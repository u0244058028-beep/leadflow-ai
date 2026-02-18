import { getOpenAI } from "@/lib/openai"

export async function POST(req:Request){

  const { name,email } = await req.json()

  const openai = getOpenAI()

  const completion = await openai.chat.completions.create({
    model:"gpt-4o-mini",
    messages:[
      {
        role:"system",
        content:`You are an elite autonomous sales assistant.
Generate:
1) Friendly follow-up email
2) Short lead summary
3) Recommended next action`
      },
      {
        role:"user",
        content:`Lead name: ${name}, email: ${email}`
      }
    ]
  })

  return Response.json({
    reply:completion.choices[0].message.content
  })
}
