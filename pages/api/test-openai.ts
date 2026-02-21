import type { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Tillat CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Håndter preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // Sjekk om API-nøkkel finnes
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        success: false, 
        error: 'OPENAI_API_KEY is not set in environment variables' 
      })
    }

    console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY)
    console.log('OPENAI_API_KEY starts with:', process.env.OPENAI_API_KEY.substring(0, 7) + '...')

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ 
        role: 'user', 
        content: 'Say "OpenAI API is working perfectly!" if you receive this message.' 
      }],
      max_tokens: 20,
      temperature: 0.3,
    })

    const message = completion.choices[0]?.message?.content || 'No response'

    res.status(200).json({ 
      success: true, 
      message: message,
      model: completion.model,
      usage: completion.usage
    })

  } catch (error: any) {
    console.error('OpenAI test failed:', {
      message: error.message,
      status: error.status,
      type: error.type,
      stack: error.stack
    })

    res.status(500).json({ 
      success: false, 
      error: error.message || 'Unknown error',
      type: error.type,
      status: error.status
    })
  }
}