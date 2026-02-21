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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { leadId, notes, userId } = req.body

  if (!leadId || !userId) {
    return res.status(400).json({ error: 'Missing leadId or userId' })
  }

  try {
    // Samle informasjon om leadet
    const notesText = notes || 'No notes yet'
    
    const prompt = `Based on the following notes about a sales lead, rate the likelihood of conversion from 1 to 10. 
    Only respond with a single number between 1-10.
    
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
    await supabase
      .from('leads')
      .update({ ai_score: finalScore })
      .eq('id', leadId)

    // Logg aktiviteten
    await supabase.from('ai_activity_log').insert({
      user_id: userId,
      lead_id: leadId,
      action_type: 'score_updated',
      description: `Updated lead score to ${finalScore}/10`,
      metadata: { previous_score: null, new_score: finalScore },
    })

    res.status(200).json({ score: finalScore })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to score lead' })
  }
}