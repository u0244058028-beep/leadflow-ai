import { getOpenAI } from "@/lib/openai"

export async function POST(req:Request){

  const { name,email } = await req.json()

  const openai = getOpenAI()

  const completion = await openai.chat.completions.create({
    model:"gpt-4o-mini",
    messages:[
      {
        role:"system",
        content:`You are an elite autonomous sales AI.
Return:
FOLLOWUP EMAIL
SCORE (0-100)
NEXT ACTION`
      },
      {
        role:"user",
        content:`Lead: ${name}, ${email}`
      }
    ]
  })

  return Response.json({
    reply:completion.choices[0].message.content
  })
}
