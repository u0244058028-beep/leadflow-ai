import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Bruk service role (har full tilgang)
)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { leadData, pageId, formData } = req.body

    if (!leadData || !pageId || !formData) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    console.log('Creating lead with admin client:', leadData)

    // Opprett lead med admin-privilegier
    const { data: newLead, error: leadError } = await supabaseAdmin
      .from('leads')
      .insert(leadData)
      .select()
      .single()

    if (leadError) {
      console.error('Lead creation error:', leadError)
      throw leadError
    }

    console.log('Lead created:', newLead)

    // Lagre skjemadata
    const { error: formError } = await supabaseAdmin
      .from('landing_page_leads')
      .insert({
        landing_page_id: pageId,
        lead_id: newLead.id,
        form_data: formData
      })

    if (formError) {
      console.error('Form data error:', formError)
      // Ikke kritisk, fortsett
    }

    res.status(200).json({ 
      success: true, 
      lead: newLead 
    })

  } catch (error: any) {
    console.error('API error:', error)
    res.status(500).json({ 
      error: error.message || 'Failed to create lead' 
    })
  }
}