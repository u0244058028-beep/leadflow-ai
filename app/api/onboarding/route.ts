import { NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

export async function POST(req: Request){

  const { messages } = await req.json()

  const completion = await openai.chat.completions.create({

    model:"gpt-4o-mini",

    messages:[
      {
        role:"system",
        content:`
You are Leadflow AI onboarding agent.

You help new users setup their AI lead system.

Ask SHORT questions step-by-step:

1. What business type
2. How they get leads
3. Main goal (close deals, nurture, book calls)

Never output summaries.
Never analyze leads.
Just continue onboarding conversation.
`
      },

      ...messages.map((m:any)=>({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.content
      }))

    ]

  })

  return NextResponse.json({
    reply: completion.choices[0].message.content
  })

}