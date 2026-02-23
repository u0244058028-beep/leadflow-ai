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
  console.log('Time:', new Date().toISOString())
  
  if (req.method !== 'POST') {
    console.log('❌ Wrong method:', req.method)
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId } = req.body
    console.log('👤 UserId:', userId)

    if (!userId) {
      console.log('❌ Missing userId')
      return res.status(400).json({ error: 'Missing userId' })
    }

    // Hent leads som trenger oppfølging (ikke kontaktet på 2 dager)
    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
    console.log('📅 Two days ago:', twoDaysAgo.toISOString())

    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['new', 'contacted'])
      .or(`last_contacted.is.null,last_contacted.lt.${twoDaysAgo.toISOString()}`)
      .limit(20)

    if (leadsError) {
      console.error('❌ Error fetching leads:', leadsError)
      return res.status(500).json({ error: 'Failed to fetch leads' })
    }

    console.log('📊 Found leads:', leads?.length || 0)

    if (!leads || leads.length === 0) {
      console.log('ℹ️ No leads need followup')
      return res.json({ 
        success: true, 
        message: 'No leads need follow-up right now',
        results: [] 
      })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.myleadassistant.com'
    const results = []

    for (const lead of leads) {
      console.log(`\n--- Processing lead ${lead.id} ---`)
      console.log('Name:', lead.name)
      console.log('Email:', lead.email)
      console.log('Score:', lead.ai_score)
      console.log('Status:', lead.status)

      try {
        // Bestem type oppfølging basert på score
        let followupType = 'standard'
        let customPrompt = ''
        let subject = ''

        if (lead.ai_score >= 8) {
          followupType = 'hot'
          subject = `Quick question, ${lead.name.split(' ')[0]}?`
          customPrompt = `This is a HOT lead (score ${lead.ai_score}/10). 
          Suggest booking a meeting or demo. 
          Be enthusiastic and direct. 
          Include a clear call-to-action to schedule a call.`
        } else if (lead.ai_score >= 5) {
          followupType = 'warm'
          subject = `Following up, ${lead.name.split(' ')[0]}`
          customPrompt = `This is a WARM lead (score ${lead.ai_score}/10). 
          Ask if they have questions about your offering. 
          Be helpful and consultative. 
          Offer additional value or resources.`
        } else {
          followupType = 'cold'
          subject = `Checking in, ${lead.name.split(' ')[0]}`
          customPrompt = `This is a COLD lead (score ${lead.ai_score}/10). 
          Keep it light and friendly. 
          Don't be pushy. 
          Offer a useful tip or resource related to their interest.`
        }

        if (!lead.last_contacted) {
          followupType = 'welcome'
          subject = `Thanks for your interest, ${lead.name.split(' ')[0]}!`
          customPrompt = `This is their FIRST contact. 
          Welcome them warmly. 
          Deliver the value they signed up for. 
          Ask a simple question to start a conversation.`
        }

        console.log('📧 Follow-up type:', followupType)

        // Generer melding med Puter.ai
        const prompt = `Write a friendly follow-up email to ${lead.name}.
        
Lead context:
- Name: ${lead.name}
- Company: ${lead.company || 'Not specified'}
- Title: ${lead.title || 'Not specified'}
- Industry: ${lead.industry || 'Not specified'}
- Score: ${lead.ai_score || 'Not scored yet'}/10
- Status: ${lead.status}
- Type: ${followupType} lead

${customPrompt}

Guidelines:
- Keep it warm and professional
- Include a specific question to encourage response
- Make it personal based on their title/industry if available
- Max 150 words
- No placeholders like [Name] – use real data`

        console.log('🤖 Calling Puter.ai...')
        
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

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text()
          console.error('❌ Puter.ai error:', errorText)
          throw new Error(`AI API error: ${aiResponse.status}`)
        }

        const aiData = await aiResponse.json()
        const message = aiData.choices?.[0]?.message?.content || ''
        
        if (!message) {
          throw new Error('AI returned empty message')
        }

        console.log('✅ AI message generated, length:', message.length)

        // Generer tracking-piksel (fjerner eventuelle hakeparenteser)
        const trackingPixel = generateTrackingPixel(lead.id, siteUrl)
        
        // Bygg komplett HTML for e-post
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
                    📸 To help us improve our service, this email contains a tiny tracking pixel.
                    If you prefer not to be tracked, you can disable image loading in your email settings.
                  </p>
                  <p style="margin: 0;">
                    <a href="${siteUrl}/unsubscribe/${lead.id}" style="color: #6b7280;">Unsubscribe</a> • 
                    <a href="${siteUrl}/privacy" style="color: #6b7280;">Privacy Policy</a>
                  </p>
                </div>
                
                ${trackingPixel}
              </div>
            </body>
          </html>
        `

        // Send e-post via Resend
        console.log('📤 Sending email to:', lead.email)
        
        const { data: emailData, error: emailError } = await resend.emails.send({
          from: 'LeadFlow <followup@myleadassistant.com>',
          to: [lead.email],
          subject: subject,
          html: htmlContent
        })

        if (emailError) {
          console.error('❌ Resend error:', emailError)
          throw emailError
        }

        console.log('✅ Email sent! ID:', emailData?.id)

        // Oppdater lead (last_contacted og status)
        const updateData: any = {
          last_contacted: new Date().toISOString()
        }
        
        if (lead.status === 'new') {
          updateData.status = 'contacted'
        }

        const { error: updateError } = await supabase
          .from('leads')
          .update(updateData)
          .eq('id', lead.id)

        if (updateError) {
          console.error('⚠️ Update error:', updateError)
        } else {
          console.log('✅ Lead updated')
        }

        // Logg aktiviteten i ai_activity_log
        await supabase.from('ai_activity_log').insert({
          user_id: userId,
          lead_id: lead.id,
          action_type: 'followup_sent',
          description: `${followupType} follow-up sent to ${lead.name}`,
          metadata: {
            type: followupType,
            score: lead.ai_score,
            email_id: emailData?.id,
            subject: subject
          }
        })

        results.push({
          leadId: lead.id,
          name: lead.name,
          success: true,
          type: followupType,
          emailId: emailData?.id
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

    // Oppsummer resultater
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    console.log('\n========== SUMMARY ==========')
    console.log('✅ Successful:', successful)
    console.log('❌ Failed:', failed)
    console.log('📊 Results:', results)

    res.json({ 
      success: true, 
      processed: results.length,
      successful,
      failed,
      results 
    })

  } catch (error: any) {
    console.error('❌ Fatal error:', error)
    res.status(500).json({ 
      error: error?.message || 'Internal server error' 
    })
  } finally {
    console.log('========== AUTO-FOLLOWUP END ==========\n')
  }
}