"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"
import { analyzeLeads } from "@/lib/aiBrain"
import type { Lead } from "@/types/lead"

export default function Dashboard(){

const [leads,setLeads]=useState<Lead[]>([])
const [analysis,setAnalysis]=useState<any[]>([])

const [name,setName]=useState("")
const [email,setEmail]=useState("")
const [value,setValue]=useState(500)

useEffect(()=>{

async function load(){

const { data:{session} } = await supabase.auth.getSession()

if(!session) return

const { data } = await supabase
.from("leads")
.select("*")
.eq("user_id",session.user.id)

if(data){

setLeads(data)
setAnalysis(analyzeLeads(data))

}

}

load()

},[])

async function addLead(){

const { data:{session} } = await supabase.auth.getSession()

if(!session) return

const { data } = await supabase
.from("leads")
.insert({
name,
email,
status:"new",
score:50,
potential_value:value,
user_id:session.user.id
})
.select()

if(data){

const updated=[data[0],...leads]

setLeads(updated)
setAnalysis(analyzeLeads(updated))

}

}

const expectedRevenue =
analysis.reduce((sum,a)=>sum+a.expectedRevenue,0)

const nextAction =
[...analysis].sort((a,b)=>b.priorityScore-a.priorityScore)[0]

return(

<div className="min-h-screen bg-black text-white p-4 space-y-6">

{/* AI TASK */}

<div className="bg-purple-700 p-4 rounded-xl">

<h2 className="font-bold mb-2">
🤖 Your AI Assistant
</h2>

{nextAction &&(

<div>

<p className="text-lg">
👉 {nextAction.action}
</p>

<p className="text-sm">
{nextAction.probability}% close chance
</p>

</div>

)}

</div>

{/* MONEY */}

<div className="bg-neutral-900 p-4 rounded-xl">

<p className="text-sm text-neutral-400">
Expected revenue
</p>

<p className="text-3xl text-green-400 font-bold">
${Math.round(expectedRevenue)}
</p>

</div>

{/* ADD LEAD */}

<div className="bg-neutral-900 p-4 rounded-xl space-y-2">

<input placeholder="Name"
value={name}
onChange={(e)=>setName(e.target.value)}
className="w-full p-2 bg-black"/>

<input placeholder="Email"
value={email}
onChange={(e)=>setEmail(e.target.value)}
className="w-full p-2 bg-black"/>

<input type="number"
value={value}
onChange={(e)=>setValue(Number(e.target.value))}
className="w-full p-2 bg-black"/>

<button
onClick={addLead}
className="bg-purple-600 p-2 rounded w-full">
Add Lead
</button>

</div>

{/* PIPELINE */}

<div>

{leads.map(l=>{

const ai = analysis.find(a=>a.id===l.id)

return(

<div key={l.id}
className="bg-neutral-900 p-3 mb-2 rounded">

<p>{l.name}</p>

{ai &&(
<p className="text-green-400 text-sm">
${Math.round(ai.expectedRevenue)}
</p>
)}

</div>

)

})}

</div>

</div>

)

}