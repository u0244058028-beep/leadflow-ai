import type { NextApiRequest, NextApiResponse } from 'next'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, name } = req.body

  if (!email) {
    return res.status(400).json({ error: 'Missing email' })
  }

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.myleadassistant.com'
    const userName = name || email.split('@')[0]

    const { data, error } = await resend.emails.send({
      from: 'LeadFlow <welcome@myleadassistant.com>',
      to: [email],
      subject: `Welcome to LeadFlow, ${userName}! 🚀`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px 20px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 32px;">🎉 Welcome to LeadFlow!</h1>
            </div>
            
            <div style="background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <p style="font-size: 18px; margin-bottom: 30px;">
                Hi <strong>${userName}</strong>!
              </p>
              
              <p style="margin-bottom: 20px;">
                We're thrilled to have you on board. LeadFlow helps you generate, score, and manage leads with the power of AI.
              </p>

              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 10px;">✨ Here's what you can do now:</h3>
                <ul style="list-style: none; padding: 0; margin: 0;">
                  <li style="margin-bottom: 8px;">✅ <strong>Create your first landing page</strong> – Just describe what you offer, and AI builds it</li>
                  <li style="margin-bottom: 8px;">✅ <strong>Add leads manually</strong> or let them come in automatically</li>
                  <li style="margin-bottom: 8px;">✅ <strong>Score leads 1-10</strong> based on title, industry, and engagement</li>
                  <li style="margin-bottom: 8px;">✅ <strong>Get email notifications</strong> when new leads arrive</li>
                </ul>
              </div>

              <div style="text-align: center; margin-top: 40px;">
                <a href="${siteUrl}/dashboard" 
                   style="display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: 500;">
                  Go to Dashboard →
                </a>
              </div>

              <div style="text-align: center; margin-top: 30px;">
                <a href="${siteUrl}/landing-pages/ai-generate" 
                   style="color: #3b82f6; text-decoration: underline; font-size: 14px;">
                  Or create your first landing page now
                </a>
              </div>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 40px 0 20px 0;">
              
              <p style="color: #6b7280; font-size: 12px; text-align: center;">
                Need help? Just reply to this email – we're here for you!<br>
                <a href="${siteUrl}/privacy" style="color: #6b7280;">Privacy Policy</a> • 
                <a href="${siteUrl}/terms" style="color: #6b7280;">Terms of Service</a>
              </p>
            </div>
          </body>
        </html>
      `
    })

    if (error) throw error

    res.status(200).json({ success: true, id: data?.id })
  } catch (error) {
    console.error('Error sending welcome email:', error)
    res.status(500).json({ error: 'Failed to send welcome email' })
  }
}