"use client"

import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

type Lead = {
  id:string
  name:string
  email:string
  company:string
  notes:string
  status:string
  score:number
}

export default function Dashboard(){

  const [leads,setLeads] = useState<Lead[]>([])
  const [selected,setSelected] = useState<Lead | null>(null)

  const [newLead,setNewLead] = useState({
    name:"",
    email:"",
    company:"",
    notes:""
  })

  async function loadLeads(){

    const { data } = await supabase
      .from("leads")
      .select("*")
      .order("created_at",{ascending:false})

    if(data) setLeads(data)
  }

  useEffect(()=>{
    loadLeads()
  },[])

  async function addLead(){

    const { data } = await supabase
      .from("leads")
      .insert({
        ...newLead,
        status:"new",
        score:0
      })
      .select()

    if(data){
      setLeads([data[0],...leads])
      setNewLead({name:"",email:"",company:"",notes:""})
    }
  }

  async function deleteLead(id:string){

    await supabase
      .from("leads")
      .delete()
      .eq("id",id)

    setLeads(leads.filter(l=>l.id!==id))
    setSelected(null)
  }

  async function generateFollowup(){

    if(!selected) return

    const res = await fetch("/api/ai",{
      method:"POST",
      body:JSON.stringify(selected)
    })

    const data = await res.json()

    alert(data.text)
  }

  return(

    <div className="flex h-screen">

      {/* LEFT LIST */}
      <div className="w-1/3 border-r p-4">

        <h2 className="font-bold mb-4">Leads</h2>

        <input
          placeholder="Name"
          value={newLead.name}
          onChange={e=>setNewLead({...newLead,name:e.target.value})}
        />

        <input
          placeholder="Email"
          value={newLead.email}
          onChange={e=>setNewLead({...newLead,email:e.target.value})}
        />

        <button onClick={addLead}>
          Add Lead
        </button>

        {leads.map(l=>(
          <div
            key={l.id}
            onClick={()=>setSelected(l)}
            className="cursor-pointer border p-2 mt-2"
          >
            {l.name} — Score {l.score}
          </div>
        ))}

      </div>

      {/* RIGHT DETAIL */}

      <div className="flex-1 p-6">

        {selected && (

          <div>

            <h2 className="text-xl font-bold">
              {selected.name}
            </h2>

            <p>{selected.email}</p>
            <p>{selected.company}</p>

            <button onClick={generateFollowup}>
              Generate AI Followup
            </button>

            <button
              onClick={()=>deleteLead(selected.id)}
            >
              Delete
            </button>

          </div>

        )}

      </div>

    </div>

  )
}