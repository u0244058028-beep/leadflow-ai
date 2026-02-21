import { supabase } from '@/lib/supabaseClient'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { leadId, notes, userId } = req.body

  try {
    // Hent lead-info
    const { data: lead } = await supabase
      .from('leads')
      .select('name, company, email, status')
      .eq('id', leadId)
      .single()

    // Startscore
    let score = 5
    const text = notes?.toLowerCase() || ''
    const leadText = `${lead?.name || ''} ${lead?.company || ''} ${lead?.email || ''}`.toLowerCase()

    // POSITIVE SIGNALER (+2)
    const positiveKeywords = [
      'budget', 'ready', 'meeting', 'demo', 'interested', 
      'urgent', 'asap', 'decision', 'ceo', 'founder',
      'buy', 'purchase', 'subscription', 'contract'
    ]
    positiveKeywords.forEach(keyword => {
      if (text.includes(keyword) || leadText.includes(keyword)) score += 2
    })

    // MELLOM SIGNALER (+1)
    const mediumKeywords = [
      'great', 'awesome', 'perfect', 'sounds good',
      'learn more', 'curious', 'tell me', 'pricing'
    ]
    mediumKeywords.forEach(keyword => {
      if (text.includes(keyword) || leadText.includes(keyword)) score += 1
    })

    // NEGATIVE SIGNALER (-3)
    const negativeKeywords = [
      'not interested', 'too expensive', 'no budget', 
      'later', 'busy', 'no time', 'unsubscribe'
    ]
    negativeKeywords.forEach(keyword => {
      if (text.includes(keyword) || leadText.includes(keyword)) score -= 3
    })

    // Status-basert scoring
    if (lead?.status === 'qualified') score += 2
    if (lead?.status === 'converted') score = 10
    if (lead?.status === 'lost') score = 1

    // Begrens mellom 1-10
    const finalScore = Math.min(10, Math.max(1, score))

    // Oppdater lead
    await supabase
      .from('leads')
      .update({ ai_score: finalScore })
      .eq('id', leadId)

    // Logg aktivitet (valgfritt)
    await supabase.from('ai_activity_log').insert({
      user_id: userId,
      lead_id: leadId,
      action_type: 'score_updated',
      description: `Updated lead score to ${finalScore}/10`,
      metadata: { method: 'rule-based' }
    })

    res.status(200).json({ score: finalScore })
  } catch (error) {
    console.error('Error scoring lead:', error)
    res.status(500).json({ error: error.message })
  }
}