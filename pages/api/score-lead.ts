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
    return res.status(400).json({ error: 'Missing leadId or userId' })
  }

  try {
    // Hent lead-data fra Supabase
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('name, company, email, status')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      throw new Error('Lead not found')
    }

    // Hent brukerens profil for kontekst
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, company_name')
      .eq('id', userId)
      .single()

    // Cerebras API – verdens raskeste!
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
        temperature: 0.3,
        max_tokens: 5,
        stream: false
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Cerebras API error:', response.status, errorData)
      throw new Error(`Cerebras API error: ${response.status}`)
    }

    const data = await response.json()
    const scoreText = data.choices[0]?.message?.content || '5'
    
    // Ekstraher tall fra responsen
    const score = parseInt(scoreText.replace(/[^0-9]/g, '')) || 5
    const finalScore = Math.min(10, Math.max(1, score))

    // Oppdater lead med ny score
    const { error: updateError } = await supabase
      .from('leads')
      .update({ 
        ai_score: finalScore,
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId)

    if (updateError) {
      console.error('Error updating lead:', updateError)
      throw new Error('Failed to update lead score')
    }

    // Logg aktiviteten i ai_activity_log
    try {
      await supabase.from('ai_activity_log').insert({
        user_id: userId,
        lead_id: leadId,
        action_type: 'score_updated',
        description: `Cerebras AI scored lead ${finalScore}/10`,
        metadata: { 
          provider: 'cerebras', 
          model: 'llama3.1-8b',
          score: finalScore,
          notes_preview: notes?.substring(0, 100)
        }
      })
    } catch (logError) {
      console.warn('Failed to log activity:', logError)
      // Ikke kritisk, fortsett
    }

    // Hvis score er høy, opprett automatisk oppgave
    if (finalScore >= 8) {
      await supabase.from('tasks').insert({
        lead_id: leadId,
        user_id: userId,
        title: `🔥 Hot lead: ${lead.name} scored ${finalScore}/10`,
        description: `Follow up immediately with this hot lead. Score: ${finalScore}/10`,
        due_date: new Date().toISOString(),
        priority: 'high'
      })
    }

    res.status(200).json({ 
      score: finalScore, 
      success: true,
      message: `Lead scored ${finalScore}/10`
    })

  } catch (error: any) {
    console.error('Error scoring lead:', error)
    res.status(500).json({ 
      error: error.message || 'Failed to score lead',
      success: false 
    })
  }
}