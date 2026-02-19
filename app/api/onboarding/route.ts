import { NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

export async function POST(req:Request){

  const { messages } = await req.json()

  const completion = await openai.chat.completions.create({

    model:"gpt-4o-mini",

    messages:[
      {
        role:"system",
        content:`
You are Leadflow AI.

You are onboarding a new user.

Ask step-by-step questions to collect:

1. Business type
2. How they get leads
3. Their main goal (book calls, close deals, nurture, etc.)

Speak short.
Be friendly.
Never analyze leads.
Never output summary blocks.
Continue the onboarding conversation naturally.
`
      },
      ...messages.map((m:any)=>({
        role:m.role === "ai" ? "assistant" : "user",
        content:m.content
      }))
    ]

  })

  return NextResponse.json({
    reply:completion.choices[0].message.content
  })

}