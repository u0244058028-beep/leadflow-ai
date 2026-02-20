"use client"

import { useEffect,useState,useMemo } from "react"
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
const [value,setValue]=useState(1000)
const [type,setType]=useState("demo")

useEffect(()=>{ init() },[])
useEffect(()=>{ if(autopilot) runAutopilot() },[autopilot])

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
setLeads(leadData)
setAnalysis(analyzeLeads(leadData))
}

setLoading(false)
}

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
setValue(1000)
setType("demo")
}
}

async function runAutopilot(){

const ranked = [...analysis]
.sort((a,b)=>b.priorityScore - a.priorityScore)

const top = ranked[0]
if(!top){
setAutopilot(false)
return
}

const lead = leads.find(l=>l.id===top.id)
if(!lead){
setAutopilot(false)
return
}

let newStatus = lead.status

if(top.expectedRevenue > 1000 && lead.status==="new"){
newStatus="contacted"
}
else if(top.probability>70 && lead.status==="contacted"){
newStatus="qualified"
}
else if(top.probability>90){
newStatus="closed"
}

if(newStatus !== lead.status){

await supabase
.from("leads")
.update({status:newStatus})
.eq("id",lead.id)

const updated = leads.map(l =>
l.id===lead.id ? {...l,status:newStatus} : l
)

setLeads(updated)
setAnalysis(analyzeLeads(updated))
}

setAutopilot(false)
}

async function logout(){
await supabase.auth.signOut()
router.replace("/login")
}

if(loading){
return <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white">Loading...</div>
}

const expectedRevenue =
analysis.reduce((sum,a)=>sum+a.expectedRevenue,0)

const rankedLeads = useMemo(()=>{
return [...analysis]
.sort((a,b)=>b.priorityScore - a.priorityScore)
},[analysis])

const topLeadAnalysis = rankedLeads[0]
const topLead = leads.find(l=>l.id===topLeadAnalysis?.id)

const statuses=["new","contacted","qualified","closed"]

return(

<div className="min-h-screen bg-neutral-950 text-neutral-200 p-6 space-y-6">

{/* HEADER */}

<div className="flex justify-between items-center">

<h1 className="text-2xl font-bold">
🤖 AI Sales CEO
</h1>

<div className="space-x-3">

<button
onClick={()=>setAutopilot(true)}
className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg">
Run Autopilot
</button>

<button
onClick={logout}
className="bg-neutral-800 px-4 py-2 rounded-lg">
Logout
</button>

</div>

</div>

{/* NEXT BEST ACTION */}

{topLead && topLeadAnalysis && (

<div className="bg-neutral-900 p-6 rounded-xl border border-purple-600">

<h2 className="text-lg font-semibold mb-2">
🔥 Next Best Action
</h2>

<p className="text-xl font-bold">
Contact {topLead.name}
</p>

<p className="text-sm text-neutral-400">
Type: {topLead.lead_type}
</p>

<div className="mt-3 space-y-1 text-sm">

<p>💰 Expected Revenue: 
<span className="text-green-400 ml-1">
${topLeadAnalysis.expectedRevenue.toFixed(0)}
</span>
</p>

<p>📊 Close Probability: 
<span className="ml-1">
{topLeadAnalysis.probability}%
</span>
</p>

<p>⚡ Priority Score: 
<span className="ml-1">
{topLeadAnalysis.priorityScore.toFixed(0)}
</span>
</p>

</div>

</div>

)}

{/* TOTAL REVENUE */}

<div className="bg-neutral-900 p-6 rounded-xl">
Total Expected Revenue:
<span className="text-green-400 text-2xl ml-2">
${expectedRevenue.toFixed(0)}
</span>
</div>

{/* ADD LEAD */}

<div className="bg-neutral-900 p-4 rounded-xl space-y-2">

<input
placeholder="Lead name"
value={name}
onChange={(e)=>setName(e.target.value)}
className="w-full p-2 bg-neutral-950 rounded border border-neutral-800"
/>

<input
placeholder="Lead email"
value={email}
onChange={(e)=>setEmail(e.target.value)}
className="w-full p-2 bg-neutral-950 rounded border border-neutral-800"
/>

<select
value={type}
onChange={(e)=>setType(e.target.value)}
className="w-full p-2 bg-neutral-950 rounded border border-neutral-800">

<option value="demo">Demo</option>
<option value="client">Client</option>
<option value="call">Call</option>
<option value="deal">Deal</option>

</select>

<input
type="number"
placeholder="Potential deal value"
value={value}
onChange={(e)=>setValue(Number(e.target.value))}
className="w-full p-2 bg-neutral-950 rounded border border-neutral-800"
/>

<button
onClick={addLead}
className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg w-full">
Add Lead
</button>

</div>

{/* PIPELINE */}

<div className="grid grid-cols-4 gap-4">

{statuses.map(status=>{

const filtered = leads.filter(l=>l.status===status)

return(

<div key={status}
className="bg-neutral-900 p-4 rounded-xl">

<h3 className="capitalize mb-3 font-semibold">
{status}
</h3>

{filtered.map(l=>{

const ai = analysis.find(a=>a.id===l.id)

return(

<div key={l.id}
className="bg-neutral-950 p-3 mb-2 rounded border border-neutral-800">

<p className="font-medium">
{l.name}
</p>

{ai &&(
<p className="text-xs text-green-400">
Expected: ${ai.expectedRevenue.toFixed(0)}
</p>
)}

</div>

)

})}

</div>

)

})}

</div>

</div>

)
}