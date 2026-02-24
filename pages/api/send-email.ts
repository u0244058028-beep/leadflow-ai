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

  const { to, subject, html, leadId, userId, replyTo } = req.body

  if (!to || !subject || !html || !leadId || !userId) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    // Hent brukerens e-post for replyTo
    const { data: user } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single()

    const { data, error } = await resend.emails.send({
      from: 'LeadFlow <noreply@myleadassistant.com>',
      to: [to],
      replyTo: user?.email || replyTo, // Bruk brukerens e-post
      subject: subject,
      html: html,
    })

    if (error) throw error

    // Logg at e-post ble sendt
    await supabase.from('ai_activity_log').insert({
      user_id: userId,
      lead_id: leadId,
      action_type: 'email_sent',
      description: `Sent email to ${to}: ${subject}`,
      metadata: { subject, to },
    })

    res.status(200).json({ success: true, data })
  } catch (error) {
    console.error('Error sending email:', error)
    res.status(500).json({ error: 'Failed to send email' })
  }
}