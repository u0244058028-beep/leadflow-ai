import { getOpenAI } from "@/lib/openai"

export async function POST(req: Request) {

  const { message } = await req.json()

  const openai = getOpenAI()

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You help generate follow-up replies for business leads." },
      { role: "user", content: message }
    ]
  })

  return Response.json({
    reply: completion.choices[0].message.content
  })
}
