import type { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'
import { supabase } from '@/lib/supabaseClient'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Tillat CORS for alle forespørsler
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Håndter preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { leadId, notes, userId } = req.body

  if (!leadId || !userId) {
    return res.status(400).json({ error: 'Missing leadId or userId' })
  }

  try {
    // Sjekk OpenAI API-nøkkel
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not set')
      return res.status(500).json({ error: 'OpenAI API key not configured' })
    }

    // Samle informasjon om leadet
    const notesText = notes || 'No notes yet'
    
    const prompt = `Based on the following notes about a sales lead, rate the likelihood of conversion from 1 to 10. Only respond with a single number between 1-10.
    
    Notes: ${notesText}
    
    Score:`

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 5,
    })

    const scoreText = completion.choices[0].message.content || '5'
    // Fjern alle ikke-numeriske tegn og konverter til tall
    const score = parseInt(scoreText.replace(/[^0-9]/g, ''), 10) || 5
    // Begrens mellom 1-10
    const finalScore = Math.min(10, Math.max(1, score))

    // Oppdater lead med ny score
    const { error: updateError } = await supabase
      .from('leads')
      .update({ ai_score: finalScore })
      .eq('id', leadId)

    if (updateError) {
      console.error('Error updating lead:', updateError)
      return res.status(500).json({ error: 'Failed to update lead score' })
    }

    // Logg aktiviteten (hvis tabellen finnes)
    try {
      await supabase.from('ai_activity_log').insert({
        user_id: userId,
        lead_id: leadId,
        action_type: 'score_updated',
        description: `Updated lead score to ${finalScore}/10`,
        metadata: { new_score: finalScore },
      })
    } catch (logError) {
      // Ignorer hvis logging feiler – det er ikke kritisk
      console.warn('Failed to log activity:', logError)
    }

    res.status(200).json({ score: finalScore, success: true })
  } catch (error) {
    console.error('Error scoring lead:', error)
    res.status(500).json({ error: 'Failed to score lead' })
  }
}