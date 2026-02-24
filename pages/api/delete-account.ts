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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' })
    }

    console.log('🗑️ Starting deletion for user:', userId)

    // 1. Slett leads (dette vil cascade til tasks, notes, ai_activity_log via foreign keys)
    console.log('Deleting leads...')
    const { error: leadsError } = await supabaseAdmin
      .from('leads')
      .delete()
      .eq('user_id', userId)

    if (leadsError) {
      console.error('Error deleting leads:', leadsError)
      // Fortsett uansett
    }

    // 2. Slett landing pages (dette vil cascade til landing_page_fields, landing_page_leads)
    console.log('Deleting landing pages...')
    const { error: pagesError } = await supabaseAdmin
      .from('landing_pages')
      .delete()
      .eq('user_id', userId)

    if (pagesError) {
      console.error('Error deleting landing pages:', pagesError)
    }

    // 3. Slett filer fra storage (må gjøres manuelt)
    console.log('Deleting files from storage...')
    const { data: files } = await supabaseAdmin
      .from('lead_files')
      .select('storage_path')
      .eq('user_id', userId)

    if (files && files.length > 0) {
      const filePaths = files.map(f => f.storage_path)
      await supabaseAdmin.storage
        .from('lead-files')
        .remove(filePaths)
    }

    // 4. Slett lead_files metadata
    console.log('Deleting file metadata...')
    const { error: filesError } = await supabaseAdmin
      .from('lead_files')
      .delete()
      .eq('user_id', userId)

    if (filesError) {
      console.error('Error deleting file metadata:', filesError)
    }

    // 5. Slett profilen
    console.log('Deleting profile...')
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      console.error('Error deleting profile:', profileError)
    }

    // 6. Slett selve auth-brukeren
    console.log('Deleting auth user...')
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authError) {
      console.error('Error deleting auth user:', authError)
      throw authError
    }

    console.log('✅ User and all associated data deleted successfully')

    res.status(200).json({ 
      success: true, 
      message: 'Account deleted successfully' 
    })

  } catch (error: any) {
    console.error('❌ Error deleting user:', error)
    res.status(500).json({ 
      error: error.message || 'Failed to delete account',
      details: error.toString()
    })
  }
}