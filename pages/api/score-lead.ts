import type { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'

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

  const { notes } = req.body // notes kan være en streng med sammendrag av notater

  try {
    const prompt = `Basert på følgende notater om en lead, gi en sannsynlighetsscore fra 1 til 10 for at leadet vil konvertere. Svar kun med tallet. Notater: ${notes}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 5,
    })

    const score = parseInt(completion.choices[0].message.content || '5', 10)
    res.status(200).json({ score })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to score lead' })
  }
}