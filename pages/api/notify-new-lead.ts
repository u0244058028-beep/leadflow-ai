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

    // 1. PRØV Å HENTE FRA PROFILES
    let { data: owner, error: ownerError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', page.user_id)
      .maybeSingle()

    // 2. HVIS IKKE FUNNET, HENT FRA AUTH.USERS
    if (!owner && !ownerError) {
      console.log('⚠️ Profile not found, trying auth.users...')
      
      const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(page.user_id)
      
      if (authError) {
        console.error('❌ Auth error:', authError)
      }
      
      if (user) {
        console.log('✅ Found user in auth:', user.email)
        
        // Opprett profile på sparket!
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
          })
        
        if (insertError) {
          console.error('❌ Could not create profile:', insertError)
        } else {
          console.log('✅ Profile created from auth data')
          
          // Hent den nyopprettede profilen
          const { data: newOwner } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', page.user_id)
            .single()
          
          if (newOwner) {
            owner = newOwner
          }
        }
      }
    }

    // 3. FORTSATT INGEN? BRUK FALLBACK
    if (!owner) {
      console.error('❌ Could not find or create profile for user:', page.user_id)
      
      // SISTE FALLBACK – send til din e-post for debugging
      await resend.emails.send({
        from: 'LeadFlow <noreply@myleadassistant.com>',
        to: ['tasnor@hotmail.com'], // DIN E-POST
        subject: `🔴 DEBUG: Missing profile for user ${page.user_id}`,
        html: `
          <h1>Profile Missing!</h1>
          <p>A lead was created but no profile was found for user: ${page.user_id}</p>
          <p>Lead details:</p>
          <ul>
            ${Object.entries(formData).map(([key, value]) => 
              `<li><strong>${key}:</strong> ${value}</li>`
            ).join('')}
          </ul>
        `
      })
      
      return res.status(200).json({ 
        warning: 'No owner profile found, but lead was created',
        leadId: lead.id
      })
    }

    // 4. SEND E-POST TIL EIEREN
    console.log('✅ Sending email to owner:', owner.email)

    await resend.emails.send({
      from: 'LeadFlow <noreply@myleadassistant.com>',
      to: [owner.email],
      subject: `🎉 New lead from your landing page!`,
      html: `
        <h1>New Lead!</h1>
        <p><strong>${owner.full_name || 'Hi'}</strong>, you have a new lead!</p>
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

    console.log('✅ Email sent!')
    res.status(200).json({ success: true })

  } catch (error: any) {
    console.error('❌ Error:', error)
    res.status(500).json({ error: error.message })
  }
}