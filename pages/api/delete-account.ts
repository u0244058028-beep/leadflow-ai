import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

// OBS: Dette må KUN kjøres på server, aldri i browser!
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' })
    }

    // Slett brukeren fra auth.users (caskaderer til profiles)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (error) throw error

    res.status(200).json({ success: true })
  } catch (error: any) {
    console.error('Error deleting user:', error)
    res.status(500).json({ error: error.message })
  }
}