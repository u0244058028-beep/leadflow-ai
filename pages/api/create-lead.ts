import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Sett CORS-headere for å tillate alle
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { leadData, pageId, formData } = req.body

    if (!leadData || !pageId || !formData) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        received: { leadData: !!leadData, pageId: !!pageId, formData: !!formData }
      })
    }

    console.log('📥 API received:', JSON.stringify({ leadData, pageId }, null, 2))

    // VALIDERING: Sjekk at user_id finnes
    if (!leadData.user_id) {
      return res.status(400).json({ error: 'Missing user_id' })
    }

    // Opprett lead med admin-privilegier
    const { data: newLead, error: leadError } = await supabaseAdmin
      .from('leads')
      .insert(leadData)
      .select()
      .single()

    if (leadError) {
      console.error('❌ Supabase insert error:', leadError)
      return res.status(500).json({ 
        error: 'Database error',
        details: leadError.message,
        code: leadError.code
      })
    }

    console.log('✅ Lead created:', JSON.stringify(newLead, null, 2))

    // Lagre skjemadata
    const { error: formError } = await supabaseAdmin
      .from('landing_page_leads')
      .insert({
        landing_page_id: pageId,
        lead_id: newLead.id,
        form_data: formData
      })

    if (formError) {
      console.error('⚠️ Form data error:', formError)
      // Ikke kritisk, fortsett
    }

    // Send varsel (fire and forget) – med riktig URL-håndtering
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.myleadassistant.com'
    const notifyUrl = `${siteUrl}/api/notify-new-lead`
    
    console.log('📤 Sending notification to:', notifyUrl)

    fetch(notifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        lead: newLead, 
        page: { 
          id: pageId, 
          title: pageId, // Vi har ikke title her, men det fikses i notify-endpoint
          user_id: leadData.user_id 
        }, 
        formData 
      })
    })
    .then(response => {
      if (!response.ok) {
        console.error('⚠️ Notification response not OK:', response.status)
      } else {
        console.log('✅ Notification sent successfully')
      }
    })
    .catch(err => console.error('⚠️ Notification fetch error:', err))

    res.status(200).json({ 
      success: true, 
      lead: newLead 
    })

  } catch (error: any) {
    console.error('❌ API error:', error)
    res.status(500).json({ 
      error: error.message || 'Failed to create lead' 
    })
  }
}