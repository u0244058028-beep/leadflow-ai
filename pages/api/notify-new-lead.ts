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
    console.log('🔍 Looking for OWNER with ID:', page.user_id)

    // HENT EIERENS PROFIL (ikke lead!)
    const { data: owner, error: ownerError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', page.user_id)
      .maybeSingle()

    if (ownerError) {
      console.error('❌ Database error:', ownerError)
      return res.status(500).json({ error: 'Database error' })
    }

    if (!owner) {
      console.error('❌ No OWNER profile found for user:', page.user_id)
      console.error('💡 This should never happen – owner profile missing!')
      return res.status(404).json({ 
        error: 'Owner profile not found',
        hint: 'The user who created this landing page has no profile'
      })
    }

    console.log('✅ Owner found:', owner.email)
    console.log('📧 Sending email to OWNER:', owner.email)
    console.log('📧 Lead email is:', lead.email) // Dette er leadet, ikke owner!

    // Send e-post til EIEREN (ikke leadet)
    await resend.emails.send({
      from: 'LeadFlow <noreply@myleadassistant.com>',
      to: [owner.email],
      subject: `🎉 New lead from your landing page!`,
      html: `
        <h1>New Lead!</h1>
        <p><strong>${owner.full_name}</strong>, you have a new lead!</p>
        <h3>Lead Information:</h3>
        <ul>
          ${Object.entries(formData).map(([key, value]) => 
            `<li><strong>${key}:</strong> ${value}</li>`
          ).join('')}
        </ul>
        <p><strong>Lead email:</strong> ${lead.email}</p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/leads/${lead.id}">View in Dashboard</a>
      `
    })

    console.log('✅ Email sent to owner!')
    res.status(200).json({ success: true })

  } catch (error: any) {
    console.error('❌ Error:', error)
    res.status(500).json({ error: error.message })
  }
}