import type { NextApiRequest, NextApiResponse } from 'next'
import { Resend } from 'resend'
import { supabase } from '@/lib/supabaseClient'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { lead, page, formData } = req.body

  if (!lead || !page || !formData) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    console.log('📧 Sending notification for lead:', lead.id)

    // Hent eierens profil
    const { data: owner, error: ownerError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', page.user_id)
      .single()

    if (ownerError || !owner) {
      console.error('❌ Owner not found:', ownerError)
      return res.status(404).json({ error: 'Owner not found' })
    }

    console.log('👤 Owner:', owner.email)

    // Bygg HTML for e-post
    const formFieldsHtml = Object.entries(formData)
      .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
      .join('')

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://myleadassistant.com'

    // Send e-post via Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'LeadFlow <notifications@myleadassistant.com>',
      to: [owner.email],
      subject: `🎉 New lead from "${page.title}"!`,
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
                <strong>${owner.full_name || 'Hi'}</strong>, you have a new lead from your landing page!
              </p>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <p style="margin: 0 0 10px 0; font-weight: 600; font-size: 16px;">📄 Page: ${page.title}</p>
                <p style="margin: 0; color: #6b7280; font-size: 14px;">${siteUrl}/s/${page.slug}</p>
              </div>
              
              <div style="margin-bottom: 30px;">
                <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 15px;">📋 Lead Information:</h3>
                <ul style="list-style: none; padding: 0; margin: 0;">
                  ${formFieldsHtml}
                </ul>
              </div>
              
              <div style="text-align: center; margin-top: 40px;">
                <a href="${siteUrl}/leads/${lead.id}" 
                   style="display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 500;">
                  View Lead in Dashboard →
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 40px 0 20px 0;">
              
              <p style="color: #6b7280; font-size: 12px; text-align: center;">
                Sent via LeadFlow · <a href="${siteUrl}/settings" style="color: #6b7280;">Notification settings</a>
              </p>
            </div>
          </body>
        </html>
      `
    })

    if (emailError) {
      console.error('❌ Resend error:', emailError)
      return res.status(500).json({ error: 'Failed to send email' })
    }

    console.log('✅ Email sent:', emailData?.id)

    // Logg at varsel ble sendt
    await supabase.from('ai_activity_log').insert({
      user_id: page.user_id,
      lead_id: lead.id,
      action_type: 'notification_sent',
      description: `New lead notification sent for ${lead.name}`,
      metadata: { page_title: page.title, email: owner.email }
    })

    res.status(200).json({ 
      success: true, 
      message: 'Notification sent successfully',
      emailId: emailData?.id 
    })

  } catch (error: any) {
    console.error('❌ Unexpected error:', error)
    res.status(500).json({ 
      error: error.message || 'Internal server error'
    })
  }
}