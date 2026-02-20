import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { resend } from "@/lib/resend"
import { analyzeLeads } from "@/lib/aiBrain"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {

  const { data: leads } = await supabase
    .from("leads")
    .select("*")

  if (!leads || leads.length === 0)
    return NextResponse.json({})

  const analysis = analyzeLeads(leads)

  const ranked = [...analysis].sort(
    (a, b) => b.priorityScore - a.priorityScore
  )

  const top = ranked[0]

  const lead = leads.find(l => String(l.id) === String(top.id))
  if (!lead) return NextResponse.json({})

  // ================= AI PERSONALIZATION =================

  const subject =
    lead.status === "new"
      ? `Quick idea regarding ${lead.interest}`
      : `Following up on ${lead.interest}`

  const intro =
    lead.lead_temperature === "hot"
      ? "I know timing matters here."
      : "I wanted to reach out."

  const body = `
Hi ${lead.name},

${intro}

Based on your interest in ${lead.interest}, 
we typically see opportunities around $${lead.potential_value}.

Would it make sense to explore this further?

Best,
AI Sales Agent
`

  await resend.emails.send({
    from: "sales@myleadassistant.com",
    to: lead.email,
    subject,
    text: body
  })

  // ================= UPDATE STATUS =================

  let newStatus = "contacted"

  if (top.probability > 70)
    newStatus = "qualified"

  await supabase
    .from("leads")
    .update({ status: newStatus })
    .eq("id", lead.id)

  return NextResponse.json({ success: true })
}