import { supabase } from '@/lib/supabaseClient'

export default async function handler(req, res) {
  const { leadId, notes, userId } = req.body

  try {
    // Hent lead-data
    const { data: lead } = await supabase
      .from('leads')
      .select('name, company, email, status')
      .eq('id', leadId)
      .single()

    // Cerebras API – verdens raskeste!
    const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CEREBRAS_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama3.1-8b', // eller 'glm4-9b-chat' hvis du vil bruke GLM
        messages: [
          {
            role: 'system',
            content: 'You are a lead scoring expert. Return only a number 1-10.'
          },
          {
            role: 'user',
            content: `Score this sales lead from 1-10:
            Name: ${lead.name}
            Company: ${lead.company || 'Unknown'}
            Status: ${lead.status}
            Notes: ${notes || 'No notes'}
            
            Score (1-10):`
          }
        ],
        temperature: 0.3,
        max_tokens: 5,
        stream: false
      })
    })

    const data = await response.json()
    const scoreText = data.choices[0].message.content
    const score = parseInt(scoreText.replace(/[^0-9]/g, '')) || 5
    const finalScore = Math.min(10, Math.max(1, score))

    // Oppdater lead
    await supabase
      .from('leads')
      .update({ ai_score: finalScore })
      .eq('id', leadId)

    // Logg aktivitet
    await supabase
      .from('ai_activity_log')
      .insert({
        user_id: userId,
        lead_id: leadId,
        action_type: 'score_updated',
        description: `Cerebras AI scored lead ${finalScore}/10`,
        metadata: { provider: 'cerebras', model: 'llama3.1-8b' }
      })

    res.json({ score: finalScore })
    
  } catch (error) {
    console.error('Cerebras error:', error)
    res.status(500).json({ error: error.message })
  }
}