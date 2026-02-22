import type { NextApiRequest, NextApiResponse } from 'next'
import { Resend } from 'resend'
import { supabase } from '@/lib/supabaseClient'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('========== NOTIFY API START ==========')
  console.log('1. Method:', req.method)
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { lead, page, formData } = req.body

  console.log('2. Received:', { leadId: lead?.id, pageId: page?.id, hasFormData: !!formData })

  if (!lead || !page || !formData) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    console.log('3. Looking for owner with user_id:', page.user_id)

    // HENT EIERENS PROFIL
    const { data: owner, error: ownerError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', page.user_id)
      .maybeSingle()

    if (ownerError) {
      console.error('4. ❌ Owner error:', ownerError)
    }

    if (!owner) {
      console.log('5. ⚠️ No owner found in profiles')
    }

    // BESTEM EIERENS E-POST
    const ownerEmail = owner?.email || 'tasnor@hotmail.com' // DIN e-post som fallback
    const ownerName = owner?.full_name || 'Tor Arne'

    console.log('6. Sending email to OWNER:', ownerEmail)
    console.log('7. Lead email is:', lead.email)

    // Send e-post til EIEREN (DEG)
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'LeadFlow <noreply@myleadassistant.com>',
      to: [ownerEmail],
      subject: `🎉 New lead from your landing page!`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px 20px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🎉 New Lead!</h1>
            </div>
            
            <div style="background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <p style="font-size: 18px; margin-bottom: 30px;">
                <strong>${ownerName}</strong>, you have a new lead!
              </p>
              
              <div style="margin-bottom: 30px;">
                <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 15px;">📋 Lead Information:</h3>
                <ul style="list-style: none; padding: 0; margin: 0;">
                  ${Object.entries(formData).map(([key, value]) => 
                    `<li><strong>${key}:</strong> ${value}</li>`
                  ).join('')}
                </ul>
              </div>
              
              <div style="text-align: center; margin-top: 40px;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.myleadassistant.com'}/leads/${lead.id}" 
                   style="display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 500;">
                  View Lead in Dashboard →
                </a>
              </div>
            </div>
          </body>
        </html>
      `
    })

    if (emailError) {
      console.error('8. ❌ Resend error:', emailError)
      return res.status(500).json({ error: 'Failed to send email' })
    }

    console.log('9. ✅ Email sent to owner! ID:', emailData?.id)

    // Logg at varsel ble sendt
    await supabase.from('ai_activity_log').insert({
      user_id: page.user_id,
      lead_id: lead.id,
      action_type: 'notification_sent',
      description: `New lead notification sent to owner`,
      metadata: { owner_email: ownerEmail, lead_email: lead.email }
    })

    res.status(200).json({ 
      success: true, 
      message: 'Notification sent to owner',
      emailId: emailData?.id,
      sentTo: ownerEmail
    })

  } catch (error: any) {
    console.error('10. ❌ Unexpected error:', error)
    res.status(500).json({ error: error.message })
  } finally {
    console.log('========== NOTIFY API END ==========')
  }
}