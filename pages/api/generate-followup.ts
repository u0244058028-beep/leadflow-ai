import type { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Sjekk at env-variabelen heter dette i Vercel
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { leadName, company } = req.body

  try {
    const prompt = `Skriv en vennlig oppfølgingsmelding til en lead som heter ${leadName}${company ? ` fra ${company}` : ''}. Vi snakket nylig, og jeg vil gjerne høre om de har noen spørsmål eller om vi kan ta et møte. Hold det kort, profesjonelt og vennlig.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 150,
    })

    const message = completion.choices[0].message.content
    res.status(200).json({ message })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to generate message' })
  }
}