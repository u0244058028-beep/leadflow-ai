import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function POST(req: Request) {

  const { name, email } = await req.json()

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content: "You are a sales AI assistant helping generate short followup messages."
      },
      {
        role: "user",
        content: `Write a short friendly followup message to lead ${name} (${email}).`
      }
    ]
  })

  return Response.json({
    message: completion.choices[0].message.content
  })
}