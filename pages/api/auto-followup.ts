import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabaseClient'
import { Resend } from 'resend'
import { generateTrackingPixel } from '@/lib/tracking'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('========== AUTO-FOLLOWUP START ==========')
  console.log('1. Method:', req.method)
  console.log('2. Body:', JSON.stringify(req.body, null, 2))
  console.log('3. RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY)
  console.log('4. NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL)

  if (req.method !== 'POST') {
    console.log('5. Wrong method, returning 405')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId } = req.body
    console.log('6. UserId:', userId)

    if (!userId) {
      console.log('7. Missing userId')
      return res.status(400).json({ error: 'Missing userId' })
    }

    // Hent leads som trenger oppfølging
    console.log('8. Fetching leads for user:', userId)
    
    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
    console.log('9. Two days ago:', twoDaysAgo.toISOString())

    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select(`
        *,
        profiles!leads_user_id_fkey (full_name, company_name)
      `)
      .eq('user_id', userId)
      .in('status', ['new', 'contacted'])
      .or(`last_contacted.is.null,last_contacted.lt.${twoDaysAgo.toISOString()}`)
      .limit(20)

    if (leadsError) {
      console.error('10. Error fetching leads:', leadsError)
      return res.status(500).json({ error: 'Failed to fetch leads' })
    }

    console.log('11. Found leads:', leads?.length || 0)

    if (!leads || leads.length === 0) {
      console.log('12. No leads need followup')
      return res.json({ message: 'No leads need followup', results: [] })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.myleadassistant.com'
    console.log('13. Site URL:', siteUrl)

    const results = []

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i]
      console.log(`\n--- Processing lead ${i+1}/${leads.length} ---`)
      console.log('Lead ID:', lead.id)
      console.log('Lead name:', lead.name)
      console.log('Lead email:', lead.email)
      console.log('Lead score:', lead.ai_score)
      console.log('Lead status:', lead.status)
      console.log('Last contacted:', lead.last_contacted)

      try {
        // Bestem type oppfølging
        let followupType = 'standard'
        let customPrompt = ''

        if (lead.ai_score >= 8) {
          followupType = 'hot'
          customPrompt = `This is a HOT lead (score ${lead.ai_score}/10). Suggest booking a meeting or demo.`
        } else if (lead.ai_score >= 5) {
          followupType = 'warm'
          customPrompt = `This is a WARM lead (score ${lead.ai_score}/10). Ask if they have questions.`
        } else {
          followupType = 'cold'
          customPrompt = `This is a COLD lead (score ${lead.ai_score}/10). Keep it light and offer value.`
        }

        if (!lead.last_contacted) {
          followupType = 'welcome'
          customPrompt = `This is their first contact. Welcome them and deliver the offer.`
        }

        console.log('Followup type:', followupType)

        // Generer melding med Puter.ai
        const prompt = `Write a short, friendly follow-up email to ${lead.name} from ${lead.company || 'a company'}.
        
Lead context:
- Score: ${lead.ai_score || 'Not scored yet'}/10
- Last contacted: ${lead.last_contacted ? new Date(lead.last_contacted).toLocaleDateString() : 'Never'}
- Status: ${lead.status}
- Type: ${followupType} lead

${customPrompt}

Keep it warm and professional. Include a question to encourage response.
Make it personal and specific to their situation.
Max 150 words.`

        console.log('Sending prompt to Puter.ai...')
        
        const aiResponse = await fetch('https://api.puter.com/v1/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 300
          })
        })

        console.log('Puter.ai response status:', aiResponse.status)

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text()
          console.error('Puter.ai error:', errorText)
          throw new Error(`AI API error: ${aiResponse.status}`)
        }

        const aiData = await aiResponse.json()
        console.log('Puter.ai response data:', aiData)

        const message = aiData.choices?.[0]?.message?.content || ''
        console.log('Generated message length:', message.length)

        if (!message) {
          throw new Error('AI returned empty message')
        }

        // Legg til tracking-piksel
        const trackingPixel = generateTrackingPixel(lead.id, siteUrl)
        
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            ${message.replace(/\n/g, '<br>')}
            <br><br>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="font-size: 12px; color: #6b7280;">
              ✉️ This email contains a tracking pixel to confirm delivery. 
              <a href="${siteUrl}/unsubscribe/${lead.id}" style="color: #6b7280;">Unsubscribe</a>
            </p>
            ${trackingPixel}
          </div>
        `

        // Send e-post via Resend
        console.log('Sending email via Resend to:', lead.email)
        
        const { data: emailData, error: emailError } = await resend.emails.send({
          from: 'LeadFlow <followup@myleadassistant.com>',
          to: [lead.email],
          subject: followupType === 'hot' 
            ? `Quick question, ${lead.name}?` 
            : `Following up, ${lead.name}`,
          html: htmlContent
        })

        if (emailError) {
          console.error('Resend error:', emailError)
          throw emailError
        }

        console.log('Email sent! ID:', emailData?.id)

        // Oppdater last_contacted
        const { error: updateError } = await supabase
          .from('leads')
          .update({ 
            last_contacted: new Date().toISOString(),
            status: lead.status === 'new' ? 'contacted' : lead.status
          })
          .eq('id', lead.id)

        if (updateError) {
          console.error('Update error:', updateError)
        } else {
          console.log('Lead updated')
        }

        // Logg aktiviteten
        await supabase.from('ai_activity_log').insert({
          user_id: userId,
          lead_id: lead.id,
          action_type: 'followup_sent',
          description: `${followupType} follow-up sent to ${lead.name} (score ${lead.ai_score}/10)`,
          metadata: {
            type: followupType,
            score: lead.ai_score,
            email_id: emailData?.id
          }
        })

        results.push({
          leadId: lead.id,
          name: lead.name,
          success: true,
          type: followupType
        })

      } catch (error: any) {
        console.error(`❌ Error processing lead ${lead.id}:`, error)
        results.push({
          leadId: lead.id,
          name: lead.name,
          success: false,
          error: error?.message || 'Unknown error'
        })
      }
    }

    console.log('========== AUTO-FOLLOWUP END ==========')
    console.log('Results:', results)

    res.json({ 
      success: true, 
      processed: results.length,
      results 
    })

  } catch (error: any) {
    console.error('❌ Fatal error:', error)
    res.status(500).json({ error: error?.message || 'Internal server error' })
  }
}