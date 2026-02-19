import { NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

export async function POST(req:Request){

  const { message } = await req.json()

  const completion = await openai.chat.completions.create({

    model:"gpt-4o-mini",

    messages:[
      {
        role:"system",
        content:`
You are Leadflow AI — an autonomous AI onboarding employee.

Your mission:

1. Ask questions step by step.
2. Collect:
- business type
- lead source
- main goal

Speak short. Friendly. Smart.

If user answers, continue onboarding.
`
      },
      {
        role:"user",
        content:message
      }
    ]

  })

  return NextResponse.json({

    reply:completion.choices[0].message.content

  })

}