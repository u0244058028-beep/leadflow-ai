import type { NextApiRequest, NextApiResponse } from 'next'
import { Resend } from 'resend'
import { supabase } from '@/lib/supabaseClient'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Logg absolutt ALT
  console.log('========== NOTIFY API START ==========')
  console.log('1. Time:', new Date().toISOString())
  console.log('2. Method:', req.method)
  console.log('3. Headers:', JSON.stringify(req.headers, null, 2))
  console.log('4. Body raw:', req.body)
  console.log('5. Body parsed:', JSON.stringify(req.body, null, 2))
  console.log('6. RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY)
  console.log('7. NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL)

  if (req.method !== 'POST') {
    console.log('8. Wrong method, returning 405')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { lead, page, formData } = req.body

  console.log('9. Extracted lead:', lead ? 'yes' : 'no')
  console.log('10. Extracted page:', page ? 'yes' : 'no')
  console.log('11. Extracted formData:', formData ? 'yes' : 'no')

  if (!lead || !page || !formData) {
    console.log('12. Missing fields, returning 400')
    return res.status(400).json({ 
      error: 'Missing required fields',
      received: { lead: !!lead, page: !!page, formData: !!formData }
    })
  }

  try {
    console.log('13. Lead ID:', lead.id)
    console.log('14. Page ID:', page.id)
    console.log('15. User ID:', page.user_id)

    // PRØV Å HENTE EIEREN
    console.log('16. Attempting to fetch profile from Supabase...')
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', page.user_id)
      .maybeSingle()

    console.log('17. Profile query result:', { profile, profileError })

    let ownerEmail = null
    let ownerName = null

    if (profile) {
      console.log('18. Profile found!')
      ownerEmail = profile.email
      ownerName = profile.full_name
    } else {
      console.log('19. No profile found, using fallback')
      ownerEmail = 'tasnor@hotmail.com'
      ownerName = 'LeadFlow Owner'
    }

    console.log('20. Final recipient:', ownerEmail)

    // Bygg HTML for e-post
    const formFieldsHtml = Object.entries(formData)
      .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
      .join('')

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.myleadassistant.com'

    console.log('21. Site URL:', siteUrl)
    console.log('22. Attempting to send via Resend...')

    // Send e-post via Resend
    const emailPayload = {
      from: 'LeadFlow <noreply@myleadassistant.com>',
      to: [ownerEmail],
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
              <p style="font-size: 18px; margin-bottom: 30px;">
                <strong>${ownerName || 'Hi'}</strong>, you have a new lead!
              </p>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <p style="margin: 0 0 10px 0; font-weight: 600; font-size: 16px;">📄 Page: ${page.title || 'Landing Page'}</p>
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
    }

    console.log('23. Email payload:', JSON.stringify(emailPayload, null, 2))

    const { data: emailData, error: emailError } = await resend.emails.send(emailPayload)

    if (emailError) {
      console.error('24. ❌ Resend error:', JSON.stringify(emailError, null, 2))
      return res.status(500).json({ error: 'Failed to send email', details: emailError })
    }

    console.log('25. ✅ Email sent successfully! ID:', emailData?.id)
    console.log('26. Email data:', JSON.stringify(emailData, null, 2))

    res.status(200).json({ 
      success: true, 
      message: 'Notification sent successfully',
      emailId: emailData?.id,
      sentTo: ownerEmail
    })

  } catch (error: any) {
    console.error('27. ❌ Unexpected error:', error)
    console.error('28. Error stack:', error.stack)
    res.status(500).json({ 
      error: error.message || 'Internal server error',
      stack: error.stack
    })
  } finally {
    console.log('========== NOTIFY API END ==========')
  }
}