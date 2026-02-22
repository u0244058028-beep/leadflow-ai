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
    console.log('🔍 Looking for owner with ID:', page.user_id)

    // HENT BRUKERENS PROFIL
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
      console.error('❌ No profile found for user:', page.user_id)
      console.error('💡 Profile should be created automatically in _app.tsx')
      
      // PRØV Å HENTE BRUKER FRA AUTH (som fallback)
      const { data: { user } } = await supabase.auth.admin.getUserById(page.user_id)
      
      if (user) {
        console.log('✅ Found user in auth, creating profile now...')
        
        // Opprett profil på sparket
        await supabase.from('profiles').insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
        })
        
        // Hent den nyopprettede profilen
        const { data: newOwner } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', page.user_id)
          .single()
          
        if (newOwner) {
          owner = newOwner
          console.log('✅ Profile created and retrieved')
        }
      }
      
      if (!owner) {
        return res.status(404).json({ 
          error: 'Owner profile not found',
          hint: 'Check _app.tsx for automatic profile creation'
        })
      }
    }

    console.log('✅ Owner found:', owner.email)

    // Send e-post (samme som før)
    await resend.emails.send({
      from: 'LeadFlow <noreply@myleadassistant.com>',
      to: [owner.email],
      subject: `🎉 New lead from your landing page!`,
      html: `...` // (din HTML her)
    })

    console.log('✅ Email sent!')
    res.status(200).json({ success: true })

  } catch (error: any) {
    console.error('❌ Error:', error)
    res.status(500).json({ error: error.message })
  }
}