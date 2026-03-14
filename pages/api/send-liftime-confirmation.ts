// pages/api/send-lifetime-confirmation.ts
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

  const { email, code } = req.body

  try {
    const { data, error } = await resend.emails.send({
      from: 'My Lead Assistant <welcome@myleadassistant.com>',
      to: [email],
      subject: '🎉 Your Lifetime Access is Activated!',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 32px;">🎉 Lifetime Access Activated!</h1>
            </div>
            
            <div style="background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <p style="font-size: 18px; margin-bottom: 30px;">Congratulations!</p>
              
              <p style="margin-bottom: 20px;">
                You now have <strong>lifetime access</strong> to all My Lead Assistant Pro features. No recurring payments, ever.
              </p>

              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 10px;">✨ What's included:</h3>
                <ul style="list-style: none; padding: 0; margin: 0;">
                  <li style="margin-bottom: 8px;">✅ AI-generated landing pages</li>
                  <li style="margin-bottom: 8px;">✅ Automatic lead scoring (1-10)</li>
                  <li style="margin-bottom: 8px;">✅ Smart follow-up messages</li>
                  <li style="margin-bottom: 8px;">✅ Pipeline value tracking</li>
                  <li style="margin-bottom: 8px;">✅ Email tracking & task management</li>
                  <li style="margin-bottom: 8px;">✅ All future updates</li>
                </ul>
              </div>

              <div style="text-align: center; margin-top: 40px;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" 
                   style="display: inline-block; background: #10b981; color: white; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: 500;">
                  Go to Dashboard →
                </a>
              </div>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 40px 0 20px 0;">
              
              <p style="color: #6b7280; font-size: 12px; text-align: center;">
                Activation code: <span style="font-family: monospace;">${code}</span><br>
                Need help? Reply to this email – we're here for you!
              </p>
            </div>
          </body>
        </html>
      `
    })

    if (error) throw error
    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Email error:', error)
    res.status(500).json({ error: 'Failed to send confirmation email' })
  }
}