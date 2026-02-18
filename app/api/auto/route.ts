import { getOpenAI } from "@/lib/openai"
import { supabase } from "@/lib/supabase"

export async function GET() {

  const openai = getOpenAI()

  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .eq("status", "new")
    .limit(3)

  if (!leads) {
    return Response.json({ ok:true })
  }

  for (const lead of leads) {

    await supabase
      .from("leads")
      .update({ status:"thinking" })
      .eq("id", lead.id)

    const completion = await openai.chat.completions.create({
      model:"gpt-4o-mini",
      messages:[
        {
          role:"user",
          content:`Write a short friendly follow-up email to ${lead.name}.`
        }
      ]
    })

    await supabase
      .from("leads")
      .update({
        ai_followup: completion.choices[0].message.content,
        last_followup: new Date(),
        status:"followed_up"
      })
      .eq("id", lead.id)
  }

  return Response.json({ processed: leads.length })
}
