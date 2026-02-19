"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import AIOnboarding from "../components/AIOnboarding"
import AIMission from "../components/AIMission"
import LeadDetailPanel from "../components/LeadDetailPanel"

const supabase = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Dashboard(){

 const [user,setUser] = useState<any>(null)
 const [profile,setProfile] = useState<any>(null)
 const [leads,setLeads] = useState<any[]>([])
 const [selectedLead,setSelectedLead] = useState<any>(null)
 const [input,setInput] = useState("")
 const [working,setWorking] = useState(false)

 useEffect(()=>{
   init()
 },[])

 async function init(){

   const { data } = await supabase.auth.getUser()
   if(!data.user) return

   setUser(data.user)

   const { data:profileData } = await supabase
     .from("profiles")
     .select("*")
     .eq("id",data.user.id)
     .single()

   setProfile(profileData)

   if(profileData?.onboarded){
     loadLeads()
   }
 }

 async function loadLeads(){

   const { data } = await supabase
     .from("leads")
     .select("*")
     .order("created_at",{ascending:false})

   setLeads(data || [])
 }

 async function addLead(){

   if(!input) return

   setWorking(true)

   const res = await fetch("/api/ai",{
     method:"POST",
     headers:{ "Content-Type":"application/json" },
     body:JSON.stringify({ text:input })
   })

   const data = await res.json()

   await supabase.from("leads").insert({
     user_id:user.id,
     name:data.name,
     email:data.email,
     ai_summary:data.summary,
     score:data.score,
     urgency:data.urgency,
     next_action:data.next_action,
     status:"new",
     raw_text:input
   })

   setInput("")
   setWorking(false)
   loadLeads()
 }

 if(!user) return null

 if(!profile?.onboarded){
   return <AIOnboarding userId={user.id} />
 }

 return(

   <div className="p-6 space-y-6">

     <h1 className="text-3xl font-bold">
       Leadflow AI
     </h1>

     <AIMission leads={leads} />

     <div className="bg-zinc-900 p-6 rounded space-y-4">

       <h3>Intelligent Lead Capture</h3>

       <textarea
         className="w-full bg-black border rounded p-3"
         value={input}
         onChange={(e)=>setInput(e.target.value)}
         placeholder="Paste anything about your lead..."
       />

       <button
         onClick={addLead}
         className="bg-blue-600 px-4 py-2 rounded"
       >
         {working ? "AI analyzing..." : "Add with AI"}
       </button>

     </div>

     <div className="bg-zinc-900 p-6 rounded space-y-2">

       <h3>Leads</h3>

       {leads.map(l=>(
         <div
           key={l.id}
           onClick={()=>setSelectedLead(l)}
           className="bg-black/40 p-3 rounded cursor-pointer hover:bg-black/60"
         >
           <div className="font-semibold">{l.name}</div>
           <div className="text-sm opacity-70">
             Score {l.score} • {l.urgency}
           </div>
         </div>
       ))}

     </div>

     {selectedLead && (
       <LeadDetailPanel
         lead={selectedLead}
         onClose={()=>setSelectedLead(null)}
         refresh={loadLeads}
       />
     )}

   </div>

 )
}