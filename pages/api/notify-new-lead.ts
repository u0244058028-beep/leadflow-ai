import type { NextApiRequest, NextApiResponse } from 'next'
import { Resend } from 'resend'
import { supabase } from '@/lib/supabaseClient'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // ===== LOGG ALT =====
  console.log('🔥🔥🔥 NOTIFY API START 🔥🔥🔥')
  console.log('1. Tid:', new Date().toISOString())
  console.log('2. Method:', req.method)
  console.log('3. Headers:', JSON.stringify(req.headers, null, 2))
  console.log('4. Body raw:', req.body)
  console.log('5. Body parsed:', JSON.stringify(req.body, null, 2))
  console.log('6. RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY)
  console.log('7. NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL)
  
  if (req.method !== 'POST') {
    console.log('8. Feil metode, returnerer 405')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { lead, page, formData } = req.body

  console.log('9. lead:', lead ? 'ja' : 'nei')
  console.log('10. page:', page ? 'ja' : 'nei')
  console.log('11. formData:', formData ? 'ja' : 'nei')

  if (!lead || !page || !formData) {
    console.log('12. Mangler felt, returnerer 400')
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    console.log('13. Lead ID:', lead.id)
    console.log('14. Lead email (fra skjema):', lead.email)
    console.log('15. Page ID:', page.id)
    console.log('16. Page user_id (eier):', page.user_id)

    // HENT EIERENS PROFIL
    console.log('17. Henter profil for user_id:', page.user_id)
    
    const { data: owner, error: ownerError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', page.user_id)
      .maybeSingle()

    console.log('18. ownerError:', ownerError)
    console.log('19. owner:', owner)

    if (ownerError) {
      console.log('20. Feil ved henting av profil:', ownerError)
    }

    if (!owner) {
      console.log('21. INGEN EIER FUNNET! Bruker fallback')
    }

    // BESTEM EIERENS E-POST
    const ownerEmail = owner?.email || 'tasnor@hotmail.com'
    const ownerName = owner?.full_name || 'Tor Arne'

    console.log('22. Skal sende til EIER:', ownerEmail)
    console.log('23. Leadets e-post er:', lead.email)

    // Bygg HTML
    const formFieldsHtml = Object.entries(formData)
      .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
      .join('')

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.myleadassistant.com'

    console.log('24. Forsøker å sende e-post via Resend...')

    // Send e-post
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'LeadFlow <noreply@myleadassistant.com>',
      to: [ownerEmail],
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

    console.log('25. emailError:', emailError)
    console.log('26. emailData:', emailData)

    if (emailError) {
      console.log('27. RESEND FEILET:', emailError)
      return res.status(500).json({ error: 'Failed to send email', details: emailError })
    }

    console.log('28. ✅ E-post sendt! ID:', emailData?.id)

    res.status(200).json({ 
      success: true, 
      message: 'Notification sent',
      emailId: emailData?.id,
      sentTo: ownerEmail
    })

  } catch (error: any) {
    console.log('29. ❌ UVENTET FEIL:', error)
    console.log('30. Stack:', error.stack)
    res.status(500).json({ error: error.message })
  } finally {
    console.log('🔥🔥🔥 NOTIFY API SLUTT 🔥🔥🔥')
  }
}