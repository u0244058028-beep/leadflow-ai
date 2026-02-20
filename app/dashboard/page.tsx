"use client"

import { useEffect,useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { analyzeLeads, AIAnalysis } from "@/lib/aiBrain"
import type { Lead } from "@/types/lead"

export default function DashboardPage(){

const router = useRouter()

const [user,setUser]=useState<any>(null)
const [leads,setLeads]=useState<Lead[]>([])
const [analysis,setAnalysis]=useState<AIAnalysis[]>([])
const [loading,setLoading]=useState(true)
const [autopilot,setAutopilot]=useState(false)

const [name,setName]=useState("")
const [email,setEmail]=useState("")
const [value,setValue]=useState(500)
const [type,setType]=useState("standard")

// ================= INIT =================

useEffect(()=>{ init() },[])

async function init(){

const { data } = await supabase.auth.getSession()

if(!data.session){
router.replace("/login")
return
}

setUser(data.session.user)

const { data:leadData } = await supabase
.from("leads")
.select("*")
.eq("user_id",data.session.user.id)

if(leadData){

setLeads(leadData as Lead[])
setAnalysis(analyzeLeads(leadData as Lead[]))

}

setLoading(false)
}

// ================= ADD LEAD =================

async function addLead(){

if(!name || !email || !user) return

const { data } = await supabase
.from("leads")
.insert({
name,
email,
status:"new",
score:50,
potential_value:value,
lead_type:type,
user_id:user.id
})
.select()

if(data){

const updated=[data[0],...leads]

setLeads(updated)
setAnalysis(analyzeLeads(updated))

setName("")
setEmail("")

}

}

// ================= AUTOPILOT =================

async function runAutopilot(){

const updated=[...leads]
const ai = analyzeLeads(updated)

for(const lead of updated){

const a = ai.find(x=>x.id===lead.id)
if(!a) continue

let newStatus = lead.status

if(a.probability>90) newStatus="closed"
else if(a.probability>70 && lead.status==="contacted") newStatus="qualified"
else if(a.priorityScore>60 && lead.status==="new") newStatus="contacted"

if(newStatus!==lead.status){

await supabase
.from("leads")
.update({status:newStatus})
.eq("id",lead.id)

lead.status=newStatus

}

}

setLeads(updated)
setAnalysis(analyzeLeads(updated))

}

async function logout(){

await supabase.auth.signOut()
router.replace("/login")

}

// ================= UI =================

if(loading){

return(
<div className="min-h-screen bg-neutral-950 flex items-center justify-center text-neutral-400">
Loading dashboard...
</div>
)

}

const statuses=["new","contacted","qualified","closed"]

const expectedRevenue =
analysis.reduce((sum,a)=>sum+a.expectedRevenue,0)

const priority =
[...analysis].sort((a,b)=>b.priorityScore-a.priorityScore).slice(0,5)

return(

<div className="min-h-screen bg-neutral-950 text-neutral-200 p-6">

<div className="grid grid-cols-12 gap-6">

{/* ================= AI COMMANDER ================= */}

<div className="col-span-3 bg-neutral-900 border border-neutral-800 p-4 rounded-xl">

<h2 className="font-bold mb-4">🤖 AI Commander</h2>

{priority.map(p=>(
<div key={p.id} className="mb-3 text-sm">

<div className="text-purple-400">
👉 {p.action}
</div>

<div className="text-neutral-400 text-xs">
{p.probability}% close chance
</div>

</div>
))}

<button
onClick={runAutopilot}
className="mt-4 w-full bg-green-600 hover:bg-green-500 p-2 rounded">
Enable Autopilot
</button>

</div>

{/* ================= PIPELINE ================= */}

<div className="col-span-6 grid grid-cols-4 gap-4">

{statuses.map(status=>{

const filtered = leads.filter(l=>l.status===status)

return(

<div key={status} className="bg-neutral-900 p-4 rounded-xl border border-neutral-800">

<h3 className="capitalize mb-3">{status}</h3>

{filtered.map(l=>{

const ai = analysis.find(a=>a.id===l.id)

return(

<div key={l.id} className="bg-neutral-950 p-2 mb-2 rounded">

<p>{l.name}</p>

{ai &&(
<p className="text-xs text-green-400">
${Math.round(ai.expectedRevenue)}
</p>
)}

</div>

)

})}

</div>

)

})}

</div>

{/* ================= LIVE INSIGHTS ================= */}

<div className="col-span-3 bg-neutral-900 border border-neutral-800 p-4 rounded-xl">

<h2 className="font-bold mb-4">📊 Live Insights</h2>

<div className="mb-3">
💰 Expected Revenue
<div className="text-green-400 text-xl">
${Math.round(expectedRevenue)}
</div>
</div>

<div>
🔥 Hot leads:
{analysis.filter(a=>a.probability>70).length}
</div>

</div>

</div>

{/* ADD LEAD */}

<div className="mt-6 bg-neutral-900 p-4 rounded-xl border border-neutral-800">

<input placeholder="Name"
value={name}
onChange={(e)=>setName(e.target.value)}
className="w-full p-2 mb-2 bg-neutral-950 rounded"/>

<input placeholder="Email"
value={email}
onChange={(e)=>setEmail(e.target.value)}
className="w-full p-2 mb-2 bg-neutral-950 rounded"/>

<input type="number"
value={value}
onChange={(e)=>setValue(Number(e.target.value))}
className="w-full p-2 mb-2 bg-neutral-950 rounded"/>

<select
value={type}
onChange={(e)=>setType(e.target.value)}
className="w-full p-2 mb-2 bg-neutral-950 rounded">

<option value="standard">Standard</option>
<option value="enterprise">Enterprise</option>
<option value="hot">Hot</option>

</select>

<button
onClick={addLead}
className="bg-purple-600 px-4 py-2 rounded">
Add Lead
</button>

</div>

</div>

)

}