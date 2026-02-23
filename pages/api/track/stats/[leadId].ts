import { supabase } from '@/lib/supabaseClient'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { leadId } = req.query

  if (!leadId || typeof leadId !== 'string') {
    return res.status(400).json({ error: 'Invalid lead ID' })
  }

  try {
    // Hent alle åpninger for dette leadet
    const { data: opens, error } = await supabase
      .from('email_tracking')
      .select('*')
      .eq('lead_id', leadId)
      .order('opened_at', { ascending: false })

    if (error) throw error

    // Hent totalt antall åpninger
    const { count } = await supabase
      .from('email_tracking')
      .select('*', { count: 'exact', head: true })
      .eq('lead_id', leadId)

    res.json({
      leadId,
      totalOpens: count || 0,
      firstOpen: opens[opens.length - 1]?.opened_at || null,
      lastOpen: opens[0]?.opened_at || null,
      opens: opens || []
    })

  } catch (error: any) {
    console.error('Error fetching tracking stats:', error)
    res.status(500).json({ error: error.message })
  }
}