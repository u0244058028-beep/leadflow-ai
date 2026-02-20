"use client"

import { useEffect,useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { analyzeLeads, AIAnalysis } from "@/lib/aiBrain"

type Lead = {
  id:string
  name:string
  email:string
  status:string
  score:number
  user_id:string
  created_at:string
}

export default function DashboardPage(){

const router = useRouter()

const [user,setUser]=useState<any>(null)
const [leads,setLeads]=useState<Lead[]>([])
const [analysis,setAnalysis]=useState<AIAnalysis[]>([])
const [loading,setLoading]=useState(true)
const [autopilot,setAutopilot]=useState(false)

const [name,setName]=useState("")
const [email,setEmail]=useState("")

useEffect(()=>{ init() },[])

useEffect(()=>{

if(autopilot){
runAutopilot()
}

},[autopilot])

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
.order("created_at",{ascending:false})

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
score:30,
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

for(let i=0;i<updated.length;i++){

const ai = newAnalysis.find(a=>a.id===updated[i].id)
if(!ai) continue

const current = updated[i].status

if(ai.probability > 90 && current !== "closed"){

updated[i].status="closed"

}else if(ai.probability > 70 && current === "contacted"){

updated[i].status="qualified"

}else if(ai.urgency > 75 && current === "new"){

updated[i].status="contacted"

}

await supabase
.from("leads")
.update({status:updated[i].status})
.eq("id",updated[i].id)

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
return(
<div className="min-h-screen bg-neutral-950 flex items-center justify-center">
Loading...
</div>
)
}

const expectedRevenue =
analysis.reduce((sum,a)=>sum+a.expectedRevenue,0)

const priorityLeads =
analysis
.sort((a,b)=>b.probability+b.urgency - (a.probability+a.urgency))
.slice(0,5)

const statuses=["new","contacted","qualified","closed"]

return(

<div className="min-h-screen bg-neutral-950 text-neutral-200 p-6 space-y-6">

{/* HEADER */}

<div className="flex justify-between items-center">

<h1 className="text-2xl font-bold">
⚔️ Sales War Room
</h1>

<div className="flex gap-3">

<button
onClick={()=>setAutopilot(true)}
className="bg-green-600 px-4 py-2 rounded-lg hover:bg-green-500">
Enable Autopilot
</button>

<button
onClick={logout}
className="bg-neutral-800 px-4 py-2 rounded-lg hover:bg-neutral-700">
Logout
</button>

</div>

</div>

{/* REVENUE */}

<div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl">

<h2 className="mb-2 font-semibold">
💰 Expected Revenue
</h2>

<p className="text-3xl text-green-400 font-bold">
${expectedRevenue}
</p>

</div>

{/* AI MISSIONS */}

<div className="bg-purple-700 p-4 rounded-xl">

<h2 className="font-bold mb-3">
🤖 AI Mission
</h2>

{priorityLeads.map(p=>(
<p key={p.id}>
👉 {p.action} — {p.probability}%
</p>
))}

</div>

{/* ADD LEAD */}

<div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">

<input
placeholder="Lead name"
className="w-full mb-2 p-2 bg-neutral-950 border border-neutral-800 rounded"
value={name}
onChange={(e)=>setName(e.target.value)}
/>

<input
placeholder="Lead email"
className="w-full mb-3 p-2 bg-neutral-950 border border-neutral-800 rounded"
value={email}
onChange={(e)=>setEmail(e.target.value)}
/>

<button
onClick={addLead}
className="bg-purple-600 px-4 py-2 rounded-lg">
Add Lead
</button>

</div>

{/* PIPELINE */}

<div className="grid grid-cols-4 gap-4">

{statuses.map(status=>{

const filtered = leads.filter(l=>l.status===status)

return(

<div key={status}
className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">

<h3 className="mb-3 capitalize">
{status}
</h3>

{filtered.map(l=>(

<div key={l.id}
className="bg-neutral-950 p-2 mb-2 rounded border border-neutral-800">

<p>{l.name}</p>

</div>

))}

</div>

)

})}

</div>

</div>

)

}