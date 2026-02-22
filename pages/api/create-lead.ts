import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Bruk service role (har full tilgang)
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { leadData, pageId, formData } = req.body

    // Opprett lead med admin-privilegier
    const { data: newLead, error: leadError } = await supabaseAdmin
      .from('leads')
      .insert(leadData)
      .select()
      .single()

    if (leadError) throw leadError

    // Lagre skjemadata
    await supabaseAdmin
      .from('landing_page_leads')
      .insert({
        landing_page_id: pageId,
        lead_id: newLead.id,
        form_data: formData
      })

    res.json({ success: true, lead: newLead })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
}