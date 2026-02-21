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

  const { leadName, company, leadId, userId } = req.body

  if (!leadId || !userId) {
    return res.status(400).json({ error: 'Missing leadId or userId' })
  }

  try {
    // Hent brukerprofil for å personliggjøre meldingen
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, company_name')
      .eq('id', userId)
      .single()

    const userName = profile?.full_name || 'Your contact'
    const companyName = profile?.company_name || 'our team'

    const prompt = `Write a friendly follow-up email from ${userName} at ${companyName} to a lead named ${leadName}${company ? ` from ${company}` : ''}. 
The email should be professional, warm, and encourage a response. 
Keep it concise (max 150 words).
Include placeholders like {{lead_name}} that can be replaced later.

Email:`

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 300,
    })

    const message = completion.choices[0].message.content

    // Logg aktiviteten
    await supabase.from('ai_activity_log').insert({
      user_id: userId,
      lead_id: leadId,
      action_type: 'followup_generated',
      description: `Generated follow-up message for ${leadName}`,
      metadata: { 
        message_preview: message?.substring(0, 100),
        full_message: message 
      },
    })

    res.status(200).json({ message })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to generate message' })
  }
}