import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabaseClient'
import Cerebras from '@cerebras/cerebras-cloud-sdk'

const client = new Cerebras({
  apiKey: process.env.CEREBRAS_API_KEY,
})

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
    // Hent lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('name, company, email, status')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      return res.status(404).json({ error: 'Lead not found' })
    }

    console.log('Scoring lead:', lead.name)

    // Cerebras – verdens raskeste AI!
    const startTime = Date.now()
    
    const chatCompletion = await client.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a lead scoring expert. Return only a number between 1-10. No explanation, just the number.'
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
      model: 'llama3.1-8b', // eller 'gpt-oss-120b' for større modell
      temperature: 0.3,
      max_tokens: 5
    })

    const responseTime = Date.now() - startTime
    console.log(`Cerebras response in ${responseTime}ms`)

    const scoreText = chatCompletion.choices[0]?.message?.content || '5'
    const score = parseInt(scoreText.replace(/[^0-9]/g, '')) || 5
    const finalScore = Math.min(10, Math.max(1, score))

    // Oppdater lead
    await supabase
      .from('leads')
      .update({ 
        ai_score: finalScore,
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId)

    // Logg aktivitet
    await supabase.from('ai_activity_log').insert({
      user_id: userId,
      lead_id: leadId,
      action_type: 'score_updated',
      description: `Cerebras scored ${lead.name}: ${finalScore}/10 (${responseTime}ms)`,
      metadata: { 
        score: finalScore,
        model: 'llama3.1-8b',
        response_time_ms: responseTime,
        provider: 'cerebras'
      }
    })

    // Hot lead? Opprett oppgave
    if (finalScore >= 8) {
      await supabase.from('tasks').insert({
        lead_id: leadId,
        user_id: userId,
        title: `🔥 Hot lead: ${lead.name}`,
        description: `Lead scored ${finalScore}/10 by Cerebras AI. Follow up immediately!`,
        due_date: new Date().toISOString(),
        priority: 'high'
      })
    }

    res.json({ 
      success: true,
      score: finalScore,
      response_time_ms: responseTime,
      lead: lead.name
    })

  } catch (error: any) {
    console.error('Cerebras error:', error)
    res.status(500).json({ 
      error: error.message || 'Failed to score lead',
      details: error.toString()
    })
  }
}