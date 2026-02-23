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

  const { email, name, offer } = req.body

  if (!email || !name) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    await resend.emails.send({
      from: 'LeadFlow <notifications@myleadassistant.com>',
      to: [email],
      subject: `Thanks for your interest, ${name}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #3b82f6;">Thank You!</h1>
          <p>Hi ${name},</p>
          <p>We've received your request for "${offer || 'Free Resource'}".</p>
          <p>You'll hear from us within 24 hours.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="font-size: 12px; color: #6b7280;">
            This is a confirmation email – no action needed.
          </p>
        </div>
      `
    })

    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error sending confirmation:', error)
    res.status(500).json({ error: 'Failed to send email' })
  }
}