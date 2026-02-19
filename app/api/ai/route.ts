import { NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

export async function POST(req: Request){

  const body = await req.json()

  // -----------------------------
  // LEAD ANALYSIS MODE
  // -----------------------------
  if(body.text){

    const completion = await openai.chat.completions.create({

      model:"gpt-4o-mini",

      messages:[
        {
          role:"system",
          content:`
Extract structured lead info.

Return STRICT JSON:

{
  "name":"",
  "email":"",
  "summary":"",
  "score":0,
  "urgency":"HIGH | MEDIUM | LOW",
  "next_action":""
}
`
        },
        {
          role:"user",
          content:body.text
        }
      ]

    })

    const content = completion.choices[0].message.content || "{}"

    return NextResponse.json(JSON.parse(content))
  }

  // -----------------------------
  // FOLLOW-UP GENERATION MODE
  // -----------------------------
  if(body.followup){

    const { lead } = body

    const completion = await openai.chat.completions.create({

      model:"gpt-4o-mini",

      messages:[
        {
          role:"system",
          content:`
You are a professional sales assistant.

Write a short, high-converting follow-up message.

Keep it concise.
Professional.
No fluff.
`
        },
        {
          role:"user",
          content:`
Lead Name: ${lead.name}
Lead Summary: ${lead.ai_summary}
Urgency: ${lead.urgency}
Suggested Action: ${lead.next_action}

Write a follow-up message.
`
        }
      ]

    })

    return NextResponse.json({
      message: completion.choices[0].message.content
    })
  }

  return NextResponse.json({ error:"Invalid request" })
}