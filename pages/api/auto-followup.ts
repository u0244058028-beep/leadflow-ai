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
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId } = req.body
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' })
    }

    // Hent brukerens e-post for reply_to
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single()

    // Hent leads som trenger oppfølging
    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['new', 'contacted'])
      .or(`last_contacted.is.null,last_contacted.lt.${twoDaysAgo.toISOString()}`)
      .limit(20)

    if (leadsError) {
      console.error('Error fetching leads:', leadsError)
      return res.status(500).json({ error: 'Failed to fetch leads' })
    }

    if (!leads || leads.length === 0) {
      return res.json({ message: 'No leads need followup', results: [] })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.myleadassistant.com'
    const results = []

    for (const lead of leads) {
      try {
        // Bestem type oppfølging
        let followupType = 'standard'
        let subject = ''
        let customPrompt = ''

        if (lead.ai_score >= 8) {
          followupType = 'hot'
          subject = `Quick question, ${lead.name.split(' ')[0]}?`
          customPrompt = `This is a HOT lead (score ${lead.ai_score}/10). Suggest booking a meeting or demo.`
        } else if (lead.ai_score >= 5) {
          followupType = 'warm'
          subject = `Following up, ${lead.name.split(' ')[0]}`
          customPrompt = `This is a WARM lead (score ${lead.ai_score}/10). Ask if they have questions.`
        } else {
          followupType = 'cold'
          subject = `Checking in, ${lead.name.split(' ')[0]}`
          customPrompt = `This is a COLD lead (score ${lead.ai_score}/10). Keep it light and offer value.`
        }

        if (!lead.last_contacted) {
          followupType = 'welcome'
          subject = `Thanks for your interest, ${lead.name.split(' ')[0]}!`
          customPrompt = `This is their FIRST contact. Welcome them warmly.`
        }

        // Generer melding
        const prompt = `Write a friendly follow-up email to ${lead.name}.
        
Lead context:
- Name: ${lead.name}
- Company: ${lead.company || 'Not specified'}
- Title: ${lead.title || 'Not specified'}
- Industry: ${lead.industry || 'Not specified'}
- Score: ${lead.ai_score || 'Not scored yet'}/10
- Type: ${followupType} lead

${customPrompt}

Guidelines:
- Keep it warm and professional
- Include a specific question to encourage response
- Max 150 words`

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

        if (!aiResponse.ok) throw new Error(`AI API error: ${aiResponse.status}`)

        const aiData = await aiResponse.json()
        const message = aiData.choices?.[0]?.message?.content || ''
        if (!message) throw new Error('AI returned empty message')

        const trackingPixel = generateTrackingPixel(lead.id, siteUrl)
        
        const htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #ffffff; border-radius: 8px; padding: 30px;">
                ${message.replace(/\n/g, '<br>')}
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                
                <div style="font-size: 12px; color: #6b7280;">
                  <p style="margin: 0 0 10px 0;">
                    📸 This email contains a tiny tracking pixel. If you prefer not to be tracked, disable images.
                  </p>
                  <p style="margin: 0;">
                    Reply directly to this email – it will go to your contact at ${lead.company || 'our team'}.
                  </p>
                </div>
                
                ${trackingPixel}
              </div>
            </body>
          </html>
        `

        // 🔥 VIKTIG: Bruk reply_to (med underscore)!
        const { data: emailData, error: emailError } = await resend.emails.send({
          from: 'LeadFlow <noreply@myleadassistant.com>',
          to: [lead.email],
          reply_to: userProfile?.email || 'owner@example.com', // ← Fikset!
          subject: subject,
          html: htmlContent
        })

        if (emailError) throw emailError

        // Oppdater lead
        await supabase
          .from('leads')
          .update({ 
            last_contacted: new Date().toISOString(),
            status: lead.status === 'new' ? 'contacted' : lead.status
          })
          .eq('id', lead.id)

        await supabase.from('ai_activity_log').insert({
          user_id: userId,
          lead_id: lead.id,
          action_type: 'followup_sent',
          description: `${followupType} follow-up sent to ${lead.name}`
        })

        results.push({ leadId: lead.id, name: lead.name, success: true })

      } catch (error) {
        console.error(`Error processing lead ${lead.id}:`, error)
        results.push({ leadId: lead.id, name: lead.name, success: false })
      }
    }

    res.json({ success: true, results })

  } catch (error: any) {
    console.error('Fatal error:', error)
    res.status(500).json({ error: error.message })
  }
}