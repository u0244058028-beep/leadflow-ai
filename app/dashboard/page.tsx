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

const statuses = ["new","contacted","qualified","closed"]

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

  function calculateScore(lead:any){

    let score = 0

    if(lead.email) score += 20
    if(lead.company) score += 20
    if(lead.notes) score += 20
    if(lead.status === "contacted") score += 10
    if(lead.status === "qualified") score += 20
    if(lead.status === "closed") score += 30

    return Math.min(score,100)
  }

  async function addLead(){

    const score = calculateScore(newLead)

    const { data } = await supabase
      .from("leads")
      .insert({
        ...newLead,
        status:"new",
        score
      })
      .select()

    if(data){
      setLeads([data[0],...leads])
      setNewLead({name:"",email:"",company:"",notes:""})
    }
  }

  async function updateStatus(id:string,status:string){

    const lead = leads.find(l=>l.id===id)
    if(!lead) return

    const score = calculateScore({...lead,status})

    await supabase
      .from("leads")
      .update({status,score})
      .eq("id",id)

    loadLeads()
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

  const hot = leads.filter(l=>l.score>=70).length
  const followup = leads.filter(l=>l.status==="contacted").length
  const cold = leads.filter(l=>l.score<30).length

  return(

    <div className="p-6 bg-black text-white min-h-screen">

      {/* AI MISSION PANEL */}
      <div className="bg-zinc-900 p-4 rounded mb-6">

        <h2 className="text-xl font-bold mb-2">
          🤖 AI Mission Control
        </h2>

        <div className="flex gap-6">

          <div>🔥 Hot: {hot}</div>
          <div>⏳ Needs Follow-up: {followup}</div>
          <div>🧊 Cold: {cold}</div>

        </div>

        <div className="mt-3 text-sm text-gray-400">
          {hot > 0 
            ? `${hot} hot leads need attention today.` 
            : "No urgent leads. You're on track."}
        </div>

      </div>

      {/* ADD LEAD */}
      <div className="bg-zinc-900 p-4 rounded mb-6">

        <h2 className="font-bold mb-2">Add Lead</h2>

        <div className="flex gap-2">

          <input
            placeholder="Name"
            value={newLead.name}
            onChange={e=>setNewLead({...newLead,name:e.target.value})}
            className="bg-zinc-800 p-2 rounded"
          />

          <input
            placeholder="Email"
            value={newLead.email}
            onChange={e=>setNewLead({...newLead,email:e.target.value})}
            className="bg-zinc-800 p-2 rounded"
          />

          <button
            onClick={addLead}
            className="bg-blue-600 px-4 rounded"
          >
            Add
          </button>

        </div>

      </div>

      {/* PIPELINE */}

      <div className="grid grid-cols-4 gap-4">

        {statuses.map(status=>(

          <div key={status} className="bg-zinc-900 p-3 rounded">

            <h3 className="font-bold capitalize mb-3">
              {status}
            </h3>

            {leads
              .filter(l=>l.status===status)
              .map(l=>(
                <div
                  key={l.id}
                  onClick={()=>setSelected(l)}
                  className="bg-zinc-800 p-2 rounded mb-2 cursor-pointer"
                >
                  <div>{l.name}</div>
                  <div className="text-xs text-gray-400">
                    Score {l.score}
                  </div>

                  <select
                    value={l.status}
                    onChange={(e)=>updateStatus(l.id,e.target.value)}
                    className="bg-black text-xs mt-1"
                  >
                    {statuses.map(s=>(
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>

                </div>
              ))
            }

          </div>

        ))}

      </div>

      {/* DETAIL PANEL */}

      {selected && (

        <div className="fixed bottom-0 right-0 bg-zinc-900 w-96 p-6 h-full border-l border-zinc-700">

          <h2 className="text-xl font-bold mb-3">
            {selected.name}
          </h2>

          <p>{selected.email}</p>
          <p>{selected.company}</p>

          <div className="mt-4">

            <button
              onClick={generateFollowup}
              className="bg-green-600 px-4 py-2 rounded mr-2"
            >
              AI Follow-up
            </button>

            <button
              onClick={()=>deleteLead(selected.id)}
              className="bg-red-600 px-4 py-2 rounded"
            >
              Delete
            </button>

          </div>

        </div>

      )}

    </div>

  )
}