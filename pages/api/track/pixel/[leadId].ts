import { supabase } from '@/lib/supabaseClient'
import type { NextApiRequest, NextApiResponse } from 'next'

// 1x1 transparent GIF (minified)
const PIXEL_GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { leadId } = req.query
  
  if (req.method === 'GET') {
    // Logg åpningen
    await supabase
      .from('email_tracking')
      .insert({
        lead_id: leadId,
        ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        user_agent: req.headers['user-agent']
      })
    
    // Øk telleren (hvis du vil ha flere åpninger)
    await supabase.rpc('increment_open_count', { lead_id: leadId })
    
    // Returner piksel
    res.setHeader('Content-Type', 'image/gif')
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.send(PIXEL_GIF)
  }
}