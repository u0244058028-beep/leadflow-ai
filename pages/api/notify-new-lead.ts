import type { NextApiRequest, NextApiResponse } from 'next'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

// BRUK SERVICE ROLE KEY for å få tilgang til auth.users
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

    // HENT EIEREN DIREKTE FRA AUTH.USERS (100% sikkert!)
    const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.getUserById(
      page.user_id
    )

    if (authError || !user) {
      console.error('❌ Could not find user in auth:', authError)
      return res.status(404).json({ error: 'User not found in auth' })
    }

    // SIKRER AT VI HAR EN STRING (ikke undefined)
    const ownerEmail = user.email
    if (!ownerEmail) {
      console.error('❌ User has no email address')
      return res.status(400).json({ error: 'User has no email address' })
    }

    const ownerName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'

    console.log('✅ Owner found in auth:', ownerEmail)

    // OPPRETT PROFIL I PROFILES-TABELLEN (for fremtiden)
    await supabaseAdmin
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        full_name: ownerName,
        avatar_url: user.user_metadata?.avatar_url || null
      }, { onConflict: 'id' })

    // Send e-post til EIEREN
    const { error: emailError } = await resend.emails.send({
      from: 'LeadFlow <noreply@myleadassistant.com>',
      to: [ownerEmail], // Nå er ownerEmail garantert en string
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
                <strong>${ownerName}</strong>, you have a new lead!
              </p>
              
              <div style="margin-bottom: 30px;">
                <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 15px;">📋 Lead Information:</h3>
                <ul style="list-style: none; padding: 0; margin: 0;">
                  ${Object.entries(formData).map(([key, value]) => 
                    `<li><strong>${key}:</strong> ${value}</li>`
                  ).join('')}
                </ul>
                <p style="margin-top: 10px; color: #666;">
                  <strong>Lead email:</strong> ${lead.email}
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 40px;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.myleadassistant.com'}/leads/${lead.id}" 
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

    console.log('✅ Email sent to owner:', ownerEmail)
    res.status(200).json({ success: true })

  } catch (error: any) {
    console.error('❌ Error:', error)
    res.status(500).json({ error: error.message })
  }
}