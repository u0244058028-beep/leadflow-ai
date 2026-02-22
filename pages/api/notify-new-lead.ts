import type { NextApiRequest, NextApiResponse } from 'next'
import { Resend } from 'resend'
import { supabase } from '@/lib/supabaseClient'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('📧 NOTIFY API STARTED')
  console.log('Method:', req.method)
  console.log('Body:', JSON.stringify(req.body, null, 2))

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { lead, page, formData } = req.body

  if (!lead || !page || !formData) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    console.log('📧 Sending notification for lead:', lead.id)
    console.log('👤 Looking for user with id:', page.user_id)

    // Prøv å hent eierens profil
    const { data: owner, error: ownerError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', page.user_id)
      .maybeSingle() // Bruk maybeSingle i stedet for single

    if (ownerError) {
      console.error('❌ Database error:', ownerError)
      return res.status(500).json({ error: 'Database error' })
    }

    if (!owner) {
      console.log('⚠️ Owner not found in profiles, using fallback')
      
      // Fallback: send til en kjent e-post eller logg
      const adminEmail = process.env.ADMIN_EMAIL || 'tasnor@hotmail.com'
      
      // Bygg HTML (samme som før)
      const formFieldsHtml = Object.entries(formData)
        .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
        .join('')

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.myleadassistant.com'

      const { data: emailData, error: emailError } = await resend.emails.send({
        from: 'LeadFlow <noreply@myleadassistant.com>',
        to: [adminEmail],
        subject: `🎉 New lead from "${page.title || 'landing page'}"!`,
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
                <p style="font-size: 18px; margin-bottom: 30px;">You have a new lead from your landing page!</p>
                
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                  <p style="margin: 0 0 10px 0; font-weight: 600; font-size: 16px;">📄 Page: ${page.title || 'Unknown'}</p>
                </div>
                
                <div style="margin-bottom: 30px;">
                  <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 15px;">📋 Lead Information:</h3>
                  <ul style="list-style: none; padding: 0; margin: 0;">
                    ${formFieldsHtml}
                  </ul>
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

      console.log('✅ Email sent to fallback:', adminEmail)

      return res.status(200).json({ 
        success: true, 
        message: 'Notification sent to fallback email',
        emailId: emailData?.id 
      })
    }

    // Hvis vi fant eieren, send som normalt
    console.log('👤 Owner found:', owner.email)

    // ... resten av koden for å sende til eieren ...
    
  } catch (error: any) {
    console.error('❌ Unexpected error:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
}