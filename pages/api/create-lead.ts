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
  console.log('========== CREATE-LEAD START ==========')
  
  // Sett CORS-headere
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
      return res.status(400).json({ error: 'Missing required fields' })
    }

    console.log('📥 API received:', JSON.stringify({ leadData, pageId }, null, 2))

    // Opprett lead
    const { data: newLead, error: leadError } = await supabaseAdmin
      .from('leads')
      .insert(leadData)
      .select()
      .single()

    if (leadError) {
      console.error('❌ Supabase insert error:', leadError)
      return res.status(500).json({ error: 'Database error' })
    }

    console.log('✅ Lead created:', newLead.id)

    // Lagre skjemadata
    await supabaseAdmin
      .from('landing_page_leads')
      .insert({
        landing_page_id: pageId,
        lead_id: newLead.id,
        form_data: formData
      })

    // BESTEM SITE URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.myleadassistant.com'
    const cleanSiteUrl = siteUrl.replace(/\/$/, '')
    const notifyUrl = `${cleanSiteUrl}/api/notify-new-lead`
    
    console.log('📤 Sending notification to:', notifyUrl)

    // Send varsel – og VENT på svar!
    const notifyResponse = await fetch(notifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        lead: newLead, 
        page: { 
          id: pageId, 
          title: pageId,
          user_id: leadData.user_id 
        }, 
        formData 
      })
    })

    const notifyResult = await notifyResponse.text()
    console.log('📬 Notification response status:', notifyResponse.status)
    console.log('📬 Notification response body:', notifyResult)

    if (!notifyResponse.ok) {
      console.error('⚠️ Notification failed:', notifyResult)
    } else {
      console.log('✅ Notification sent successfully')
    }

    res.status(200).json({ 
      success: true, 
      lead: newLead 
    })

  } catch (error: any) {
    console.error('❌ API error:', error)
    res.status(500).json({ error: error.message })
  } finally {
    console.log('========== CREATE-LEAD END ==========')
  }
}