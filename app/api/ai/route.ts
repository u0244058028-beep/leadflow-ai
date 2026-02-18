import { getOpenAI } from "@/lib/openai"

export async function POST(req:Request){

  const { name,email } = await req.json()

  const openai = getOpenAI()

  const completion = await openai.chat.completions.create({
    model:"gpt-4o-mini",
    messages:[
      {
        role:"system",
        content:`You are an autonomous AI sales employee.

Return EXACTLY:

SUMMARY:
SCORE: (0-100)
URGENCY: LOW/MEDIUM/HIGH/URGENT
NEXT ACTION:
FOLLOWUP MESSAGE:
`
      },
      {
        role:"user",
        content:`Lead: ${name}, email: ${email}`
      }
    ]
  })

  return Response.json({
    reply:completion.choices[0].message.content
  })
}