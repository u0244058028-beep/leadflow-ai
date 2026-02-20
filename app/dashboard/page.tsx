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
}
}

async function runAutopilot(){

const updated=[...leads]
const newAnalysis = analyzeLeads(updated)

for(const lead of updated){

const ai = newAnalysis.find(a=>String(a.id)===String(lead.id))
if(!ai) continue

let newStatus = lead.status

if(ai.expectedRevenue > 1000 && lead.status==="new"){
newStatus="contacted"
}
else if(ai.probability>70 && lead.status==="contacted"){
newStatus="qualified"
}
else if(ai.probability>90){
newStatus="closed"
}

if(newStatus !== lead.status){

await supabase
.from("leads")
.update({status:newStatus})
.eq("id",lead.id)

lead.status=newStatus

}

}

setLeads(updated)
setAnalysis(analyzeLeads(updated))
setAutopilot(false)
}

async function logout(){
await supabase.auth.signOut()
router.replace("/login")
}

if(loading){
return <div className="min-h-screen flex items-center justify-center">Loading...</div>
}

const expectedRevenue =
analysis.reduce((sum,a)=>sum+(a?.expectedRevenue ?? 0),0)

const statuses=["new","contacted","qualified","closed"]

return(

<div className="min-h-screen bg-neutral-950 text-neutral-200 p-6 space-y-6">

<div className="flex justify-between">

<h1 className="text-2xl font-bold">⚔️ Sales War Room</h1>

<button onClick={()=>setAutopilot(true)}
className="bg-green-600 px-4 py-2 rounded-lg">
Enable Autopilot
</button>

</div>

<div className="bg-neutral-900 p-6 rounded-xl">
💰 Expected Revenue:
<span className="text-green-400 text-2xl ml-2">
${expectedRevenue.toFixed(0)}
</span>
</div>

<div className="bg-neutral-900 p-4 rounded-xl space-y-2">

<input placeholder="Lead name"
value={name}
onChange={(e)=>setName(e.target.value)}
className="w-full p-2 bg-neutral-950 rounded"/>

<input placeholder="Lead email"
value={email}
onChange={(e)=>setEmail(e.target.value)}
className="w-full p-2 bg-neutral-950 rounded"/>

<input type="number"
placeholder="Potential deal value"
value={value}
onChange={(e)=>setValue(Number(e.target.value))}
className="w-full p-2 bg-neutral-950 rounded"/>

<select
value={type}
onChange={(e)=>setType(e.target.value)}
className="w-full p-2 bg-neutral-950 rounded">

<option value="standard">Standard</option>
<option value="enterprise">Enterprise</option>
<option value="hot">Hot Lead</option>

</select>

<button onClick={addLead}
className="bg-purple-600 px-4 py-2 rounded-lg">
Add Lead
</button>

</div>

<div className="grid grid-cols-4 gap-4">

{statuses.map(status=>{

const filtered = leads.filter(l=>l.status===status)

return(

<div key={status}
className="bg-neutral-900 p-4 rounded-xl">

<h3 className="capitalize mb-3">{status}</h3>

{filtered.map(l=>{

const ai = analysis.find(a=>String(a.id)===String(l.id))

return(

<div key={l.id}
className="bg-neutral-950 p-2 mb-2 rounded">

<p>{l.name}</p>

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