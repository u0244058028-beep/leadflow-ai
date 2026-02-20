import { NextResponse } from "next/server"
import { resend } from "@/lib/resend"
import { createClient } from "@supabase/supabase-js"
import { analyzeLeads } from "@/lib/aiBrain"

const supabase = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {

 const { data: leads } = await supabase
   .from("leads")
   .select("*")

 if(!leads) return NextResponse.json({})

 const analysis = analyzeLeads(leads)

 const ranked = [...analysis].sort(
   (a,b)=>b.priorityScore - a.priorityScore
 )

 const top = ranked[0]

 if(!top) return NextResponse.json({})

 const lead = leads.find(l=>l.id===top.id)

 if(!lead) return NextResponse.json({})

 // AI EMAIL CONTENT

 const subject = `Quick idea for ${lead.name}`

 const html = `
   Hi ${lead.name},<br/><br/>

   I noticed this could represent approx $${top.expectedRevenue} opportunity.<br/><br/>

   Want me to send details?<br/><br/>

   Best,<br/>
   AI Sales Assistant
 `

 await resend.emails.send({
   from: "sales@myleadassistant.com",
   to: lead.email,
   subject,
   html
 })

 await supabase
   .from("leads")
   .update({ status:"contacted" })
   .eq("id", lead.id)

 return NextResponse.json({ success:true })

}