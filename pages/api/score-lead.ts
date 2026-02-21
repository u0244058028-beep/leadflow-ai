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
    return res.status(400).json({ 
      error: 'Missing required fields',
      received: { leadId, userId }
    })
  }

  try {
    console.log('Scoring lead:', { leadId, userId })

    // FØRST: Sjekk om lead finnes
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, name, company, email, status')
      .eq('id', leadId)
      .single()

    if (leadError) {
      console.error('Supabase error:', leadError)
      return res.status(404).json({ 
        error: 'Lead not found in database',
        details: leadError.message,
        leadId 
      })
    }

    if (!lead) {
      return res.status(404).json({ 
        error: 'Lead not found',
        leadId 
      })
    }

    console.log('Lead found:', lead.name)

    // Hent brukerens profil
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, company_name')
      .eq('id', userId)
      .single()

    // Sjekk om Cerebras API-nøkkel finnes
    if (!process.env.CEREBRAS_API_KEY) {
      console.error('CEREBRAS_API_KEY is missing')
      return res.status(500).json({ error: 'API key not configured' })
    }

    // Cerebras API-kall
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
        max_tokens: 5
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Cerebras API error:', response.status, errorText)
      return res.status(502).json({ 
        error: 'Cerebras API failed',
        status: response.status 
      })
    }

    const data = await response.json()
    const scoreText = data.choices[0]?.message?.content || '5'
    const score = parseInt(scoreText.replace(/[^0-9]/g, '')) || 5
    const finalScore = Math.min(10, Math.max(1, score))

    // Oppdater lead
    const { error: updateError } = await supabase
      .from('leads')
      .update({ 
        ai_score: finalScore,
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId)

    if (updateError) {
      console.error('Update error:', updateError)
      return res.status(500).json({ error: 'Failed to update lead' })
    }

    // Logg aktivitet
    try {
      await supabase.from('ai_activity_log').insert({
        user_id: userId,
        lead_id: leadId,
        action_type: 'score_updated',
        description: `Cerebras AI scored ${lead.name}: ${finalScore}/10`,
        metadata: { 
          score: finalScore,
          model: 'llama3.1-8b',
          notes_preview: notes?.substring(0, 50)
        }
      })
    } catch (logError) {
      console.warn('Logging failed:', logError)
    }

    // Hot lead? Opprett oppgave
    if (finalScore >= 8) {
      await supabase.from('tasks').insert({
        lead_id: leadId,
        user_id: userId,
        title: `🔥 Hot lead: ${lead.name}`,
        description: `Lead scored ${finalScore}/10. Follow up immediately!`,
        due_date: new Date().toISOString()
      })
    }

    res.status(200).json({ 
      success: true,
      score: finalScore,
      lead: lead.name
    })

  } catch (error: any) {
    console.error('Unexpected error:', error)
    res.status(500).json({ 
      error: error.message || 'Internal server error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}