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
    let { data: owner, error: ownerError } = await supabase
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
          owner = newOwner // Nå er owner deklarert med `let`, så dette fungerer!
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
    console.log('📧 Sending email to owner:', owner.email)

    // Bygg HTML for e-post
    const formFieldsHtml = Object.entries(formData)
      .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
      .join('')

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.myleadassistant.com'

    // Send e-post til EIEREN
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'LeadFlow <noreply@myleadassistant.com>',
      to: [owner.email],
      subject: `🎉 New lead from your landing page!`,
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
                <strong>${owner.full_name || 'Hi'}</strong>, you have a new lead!
              </p>
              
              <div style="margin-bottom: 30px;">
                <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 15px;">📋 Lead Information:</h3>
                <ul style="list-style: none; padding: 0; margin: 0;">
                  ${formFieldsHtml}
                </ul>
                <p style="margin-top: 10px; color: #666;">
                  <strong>Lead email:</strong> ${lead.email}
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 40px;">
                <a href="${siteUrl}/leads/${lead.id}" 
                   style="display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 500;">
                  View Lead in Dashboard →
                </a>
              </div>
            </div>
          </body>
        </html>
      `
    })

    if (emailError) {
      console.error('❌ Resend error:', emailError)
      return res.status(500).json({ error: 'Failed to send email' })
    }

    console.log('✅ Email sent! ID:', emailData?.id)

    res.status(200).json({ 
      success: true, 
      message: 'Notification sent to owner',
      sentTo: owner.email
    })

  } catch (error: any) {
    console.error('❌ Error:', error)
    res.status(500).json({ error: error.message })
  }
}