import { Resend } from 'resend'
import { supabase } from '@/lib/supabaseClient'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  const { lead, page, formData } = req.body

  // Hent brukerens e-post
  const { data: user } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', page.user_id)
    .single()

  // Send e-post via Resend
  await resend.emails.send({
    from: 'LeadFlow <notifications@myleadassistant.com>',
    to: [user.email],
    subject: `🎉 New lead from ${page.title}!`,
    html: `
      <h2>You have a new lead!</h2>
      <p><strong>From page:</strong> ${page.title}</p>
      <p><strong>Submitted data:</strong></p>
      <ul>
        ${Object.entries(formData).map(([key, value]) => 
          `<li><strong>${key}:</strong> ${value}</li>`
        ).join('')}
      </ul>
      <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/leads/${lead.id}">View in LeadFlow</a></p>
    `
  })

  res.json({ success: true })
}