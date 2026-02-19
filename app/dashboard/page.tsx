"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import AIOnboarding from "../components/AIOnboarding"

const supabase = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Dashboard(){

 const [loading,setLoading] = useState(true)
 const [onboarded,setOnboarded] = useState(false)
 const [leads,setLeads] = useState<any[]>([])
 const [input,setInput] = useState("")
 const [working,setWorking] = useState(false)

 useEffect(()=>{

   checkUser()

   function finish(){
     setOnboarded(true)
   }

   window.addEventListener("onboarding-complete",finish)

   return ()=> window.removeEventListener("onboarding-complete",finish)

 },[])

 async function checkUser(){

   const { data:{ user } } = await supabase.auth.getUser()

   if(!user){
     window.location.href="/login"
     return
   }

   const { data } = await supabase
     .from("profiles")
     .select("*")
     .eq("id",user.id)
     .single()

   if(data?.onboarded){
     setOnboarded(true)
     loadLeads()
   }

   setLoading(false)
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
     name:data.name || "Unknown",
     email:data.email || "",
     raw_text:input,
     ai_summary:data.summary
   })

   setInput("")
   loadLeads()
   setWorking(false)
 }

 async function logout(){
   await supabase.auth.signOut()
   window.location.href="/login"
 }

 if(loading) return <div>Loading...</div>

 if(!onboarded){
   return (
     <div style={{background:"#000",color:"#fff",minHeight:"100vh",padding:30}}>
       <h1>Welcome to Leadflow AI</h1>
       <AIOnboarding />
     </div>
   )
 }

 return(

   <div style={{background:"#000",color:"#fff",minHeight:"100vh",padding:20}}>

     <div style={{display:"flex",justifyContent:"space-between"}}>
       <h2>Leadflow AI</h2>
       <button onClick={logout}>Logout</button>
     </div>

     {/* AI Mission */}
     <div style={{
       marginTop:20,
       padding:20,
       borderRadius:20,
       background:"linear-gradient(135deg,#1e1b4b,#312e81)"
     }}>
       🤖 AI Mission
       <p>AI is monitoring your leads automatically.</p>
     </div>

     {/* Intelligent Capture */}
     <div style={{
       marginTop:20,
       background:"#111",
       padding:20,
       borderRadius:20
     }}>
       <h3>Intelligent Lead Capture</h3>

       <textarea
         placeholder="Paste anything about your lead..."
         value={input}
         onChange={(e)=>setInput(e.target.value)}
         style={{
           width:"100%",
           height:80,
           background:"#000",
           color:"#fff",
           border:"1px solid #333",
           borderRadius:10,
           padding:10
         }}
       />

       <button
         onClick={addLead}
         style={{
           marginTop:10,
           padding:"10px 20px",
           background:"#2563eb",
           border:"none",
           borderRadius:10,
           color:"#fff"
         }}
       >
         {working ? "AI Working..." : "Add with AI"}
       </button>

     </div>

     {/* Lead workspace */}
     <div style={{marginTop:30}}>

       <h3>📋 Lead Workspace</h3>

       {leads.map((lead,i)=>(
         <div key={i} style={{
           background:"#111",
           marginTop:10,
           padding:15,
           borderRadius:12
         }}>
           <strong>{lead.name}</strong>
           <div>{lead.email}</div>
           <p style={{opacity:0.7}}>
             {lead.ai_summary}
           </p>
         </div>
       ))}

     </div>

   </div>

 )
}