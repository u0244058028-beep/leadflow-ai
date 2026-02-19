import { NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

export async function POST(req: Request){

  const { text } = await req.json()

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
        content:text
      }
    ]

  })

  const content = completion.choices[0].message.content || "{}"

  return NextResponse.json(JSON.parse(content))
}