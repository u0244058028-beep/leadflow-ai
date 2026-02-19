"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LeadDetailPanel({
 lead,
 onClose,
 refresh
}:{
 lead:any,
 onClose:()=>void,
 refresh:()=>void
}){

 const [notes,setNotes] = useState<any[]>([])
 const [newNote,setNewNote] = useState("")
 const [status,setStatus] = useState(lead.status || "new")

 useEffect(()=>{
   loadNotes()
 },[lead])

 async function loadNotes(){

   const { data } = await supabase
     .from("lead_notes")
     .select("*")
     .eq("lead_id",lead.id)
     .order("created_at",{ascending:false})

   setNotes(data || [])
 }

 async function saveNote(){

   if(!newNote) return

   await supabase.from("lead_notes").insert({
     lead_id:lead.id,
     content:newNote
   })

   setNewNote("")
   loadNotes()
 }

 async function updateStatus(){

   await supabase
     .from("leads")
     .update({ status })
     .eq("id",lead.id)

   refresh()
 }

 return(

   <div className="fixed top-0 right-0 w-[420px] h-full bg-zinc-900 p-6 overflow-y-auto shadow-2xl">

     <button onClick={onClose} className="mb-4">Close</button>

     <h2 className="text-xl font-bold">{lead.name}</h2>
     <div className="text-sm opacity-70">{lead.email}</div>

     <div className="mt-4 bg-black/40 p-4 rounded space-y-2">
       <div>🔥 Score: {lead.score}</div>
       <div>⚠ Urgency: {lead.urgency}</div>
       <div>🎯 Next Action: {lead.next_action}</div>
       <div className="text-sm opacity-80">{lead.ai_summary}</div>
     </div>

     <div className="mt-4">
       <label>Status</label>
       <select
         value={status}
         onChange={(e)=>setStatus(e.target.value)}
         onBlur={updateStatus}
         className="w-full bg-black border p-2 rounded mt-1"
       >
         <option value="new">New</option>
         <option value="contacted">Contacted</option>
         <option value="qualified">Qualified</option>
         <option value="proposal">Proposal</option>
         <option value="closed">Closed</option>
         <option value="lost">Lost</option>
       </select>
     </div>

     <div className="mt-6">
       <h3 className="font-semibold">Notes</h3>

       <textarea
         className="w-full bg-black border p-2 rounded mt-2"
         value={newNote}
         onChange={(e)=>setNewNote(e.target.value)}
         placeholder="Add note..."
       />

       <button
         onClick={saveNote}
         className="bg-blue-600 px-3 py-2 rounded mt-2"
       >
         Add Note
       </button>

       <div className="mt-4 space-y-2">
         {notes.map(n=>(
           <div key={n.id} className="bg-black/40 p-2 rounded text-sm">
             {n.content}
           </div>
         ))}
       </div>
     </div>

   </div>
 )
}