import { supabase } from "@/lib/supabase"
import { getOpenAI } from "@/lib/openai"

export async function GET() {

  const openai = getOpenAI()

  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .is("ai_followup", null)
    .limit(5)

  if (!leads) {
    return Response.json({ ok:true })
  }

  for (const lead of leads) {

    const completion = await openai.chat.completions.create({
      model:"gpt-4o-mini",
      messages:[
        {
          role:"user",
          content:`Write a friendly follow-up email to ${lead.name} at ${lead.email}.`
        }
      ]
    })

    await supabase
      .from("leads")
      .update({
        ai_followup: completion.choices[0].message.content,
        last_followup: new Date()
      })
      .eq("id", lead.id)
  }

  return Response.json({ processed: leads.length })
}
