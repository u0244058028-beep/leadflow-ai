import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabaseClient'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Dette endepunktet kalles når lead svarer på e-post
  // Du må sette opp en inbound webhook i Resend
  
  const { email, subject, text, to, from } = req.body

  try {
    // Finn lead basert på opprinnelig e-post
    const { data: lead } = await supabase
      .from('leads')
      .select('id, user_id, name')
      .eq('email', from)
      .single()

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' })
    }

    // Logg at lead har svart
    await supabase.from('ai_activity_log').insert({
      user_id: lead.user_id,
      lead_id: lead.id,
      action_type: 'email_received',
      description: `${lead.name} replied to your email`,
      metadata: { subject, text }
    })

    // Opprett en oppgave for brukeren
    await supabase.from('tasks').insert({
      lead_id: lead.id,
      user_id: lead.user_id,
      title: `💬 Reply from ${lead.name}`,
      description: text.substring(0, 200),
      due_date: new Date().toISOString(),
      priority: 'high'
    })

    // Send varsel til brukeren (eier)
    const { data: owner } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', lead.user_id)
      .single()

    if (owner) {
      await resend.emails.send({
        from: 'LeadFlow <notifications@myleadassistant.com>',
        to: [owner.email],
        subject: `💬 ${lead.name} replied to your email`,
        html: `
          <h2>You have a reply from ${lead.name}!</h2>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p>${text.replace(/\n/g, '<br>')}</p>
          <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/leads/${lead.id}">View in dashboard</a></p>
        `
      })
    }

    res.status(200).json({ success: true })

  } catch (error) {
    console.error('Error processing reply:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}