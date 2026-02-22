import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabaseClient'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Hent leads som trenger oppfølging (ikke kontaktet på 2 dager)
    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select(`
        *,
        profiles!leads_user_id_fkey (full_name, company_name)
      `)
      .in('status', ['new', 'contacted'])
      .lt('last_contacted', twoDaysAgo.toISOString())
      .limit(10)

    if (leadsError) {
      console.error('Error fetching leads:', leadsError)
      return res.status(500).json({ error: 'Failed to fetch leads' })
    }

    if (!leads || leads.length === 0) {
      return res.json({ success: true, message: 'No leads need followup' })
    }

    const results = []

    for (const lead of leads) {
      try {
        // 🎯 AI genererer personlig oppfølging med Puter.js
        const followupPrompt = `Write a short, friendly follow-up email to ${lead.name} from ${lead.company || 'a company'}.
        They haven't responded in 2 days. Keep it warm, not pushy.
        Include a question to encourage response.
        
        Email:`

        const followupResponse = await fetch('https://api.puter.com/v1/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [{ role: 'user', content: followupPrompt }],
            temperature: 0.7,
            max_tokens: 200
          })
        })

        if (!followupResponse.ok) {
          throw new Error(`Puter API error: ${followupResponse.status}`)
        }

        const followupData = await followupResponse.json()
        const followupText = followupData.choices?.[0]?.message?.content || ''

        // Send e-post via Resend
        const emailRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: lead.email,
            subject: `Following up, ${lead.name}`,
            html: followupText.replace(/\n/g, '<br>'),
            leadId: lead.id,
            userId: lead.user_id
          })
        })

        // Oppdater last_contacted
        await supabase
          .from('leads')
          .update({ last_contacted: new Date().toISOString() })
          .eq('id', lead.id)

        results.push({
          leadId: lead.id,
          success: true,
          emailSent: emailRes.ok
        })

      } catch (error: any) {
        // ✅ Fikset: type-casting for error
        const errorMessage = error?.message || 'Unknown error occurred'
        console.error(`Error processing lead ${lead.id}:`, errorMessage)
        
        results.push({
          leadId: lead.id,
          success: false,
          error: errorMessage
        })
      }
    }

    res.json({
      success: true,
      processed: results.length,
      results
    })

  } catch (error: any) {
    // ✅ Fikset: type-casting for error
    const errorMessage = error?.message || 'Unknown error occurred'
    console.error('Auto-followup error:', errorMessage)
    res.status(500).json({ error: errorMessage })
  }
}