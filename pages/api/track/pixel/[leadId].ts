import { supabase } from '@/lib/supabaseClient'
import type { NextApiRequest, NextApiResponse } from 'next'

// 1x1 transparent GIF (minified) – dette er en gyldig piksel
const PIXEL_GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { leadId } = req.query
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!leadId || typeof leadId !== 'string') {
    return res.status(400).json({ error: 'Invalid lead ID' })
  }

  try {
    console.log('📸 Tracking pixel requested for lead:', leadId)

    // Hent lead for å sjekke at det finnes
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, email')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      console.error('❌ Lead not found:', leadId)
      // Returner piksel uansett for å ikke avsløre at vi tracker
      res.setHeader('Content-Type', 'image/gif')
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
      return res.send(PIXEL_GIF)
    }

    // Logg åpningen
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'Unknown'
    const userAgent = req.headers['user-agent'] || 'Unknown'

    const { error: insertError } = await supabase
      .from('email_tracking')
      .insert({
        lead_id: leadId,
        ip_address: ipAddress,
        user_agent: userAgent
      })

    if (insertError) {
      console.error('❌ Error logging open:', insertError)
    } else {
      console.log('✅ Email open tracked for lead:', leadId)
    }

    // Oppdater antall åpninger (bruker raw SQL for å øke teller)
    await supabase.rpc('increment_open_count', { lead_id: leadId })

    // Returner piksel
    res.setHeader('Content-Type', 'image/gif')
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.send(PIXEL_GIF)

  } catch (error) {
    console.error('❌ Tracking error:', error)
    // Returner piksel uansett for å unngå feilmelding hos lead
    res.setHeader('Content-Type', 'image/gif')
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.send(PIXEL_GIF)
  }
}