import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabaseClient'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { leadId, notes, userId } = req.body

  if (!leadId || !userId) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    // Hent lead-data
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('name, company, email, status')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      console.error('Lead not found:', leadId)
      return res.status(404).json({ error: 'Lead not found' })
    }

    // Cerebras REST API
    const startTime = Date.now()
    
    const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CEREBRAS_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama3.1-8b',
        messages: [
          {
            role: 'system',
            content: 'You are a lead scoring expert. Return only a number between 1-10.'
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
        max_tokens: 5
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Cerebras API error:', response.status, errorText)
      return res.status(502).json({ error: 'Cerebras API failed' })
    }

    const data = await response.json()
    const responseTime = Date.now() - startTime

    const scoreText = data.choices[0]?.message?.content || '5'
    const score = parseInt(scoreText.replace(/[^0-9]/g, '')) || 5
    const finalScore = Math.min(10, Math.max(1, score))

    // Oppdater lead
    await supabase
      .from('leads')
      .update({ ai_score: finalScore })
      .eq('id', leadId)

    // Logg aktivitet
    await supabase.from('ai_activity_log').insert({
      user_id: userId,
      lead_id: leadId,
      action_type: 'score_updated',
      description: `Cerebras scored ${finalScore}/10 (${responseTime}ms)`,
      metadata: { score: finalScore }
    })

    res.json({ success: true, score: finalScore })

  } catch (error: any) {
    console.error('Error:', error)
    res.status(500).json({ error: error.message })
  }
}