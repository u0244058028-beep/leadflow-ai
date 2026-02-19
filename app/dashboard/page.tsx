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
  created_at:string
}

const statuses = ["new","contacted","qualified","closed"]

export default function Dashboard(){

  const [leads,setLeads] = useState<Lead[]>([])
  const [selected,setSelected] = useState<Lead | null>(null)
  const [message,setMessage] = useState("")

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

    if(status==="closed"){
      setMessage("🎉 Deal closed! Momentum unlocked.")
      setTimeout(()=>setMessage(""),3000)
    }

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

  const closedDeals = leads.filter(l=>l.status==="closed").length
  const hotLeads = leads.filter(l=>l.score>=70)

  return(

    <div className="p-6 bg-black text-white min-h-screen">

      {/* DOPAMINE BAR */}

      <div className="bg-zinc-900 p-4 rounded mb-6">

        <div className="flex justify-between">

          <div>🏆 Deals Closed: {closedDeals}</div>
          <div>🔥 Hot Leads: {hotLeads.length}</div>

        </div>

        {message && (
          <div className="mt-2 text-green-400">
            {message}
          </div>
        )}

      </div>

      {/* AI INSIGHTS */}

      <div className="bg-zinc-900 p-4 rounded mb-6">

        <h2 className="font-bold mb-2">
          🤖 AI Suggestions
        </h2>

        {hotLeads.length>0 && (
          <div>🔥 Focus on high score leads today.</div>
        )}

        {closedDeals===0 && (
          <div>🚀 Close your first deal to unlock momentum.</div>
        )}

      </div>

      {/* ADD LEAD */}

      <div className="bg-zinc-900 p-4 rounded mb-6">

        <input
          placeholder="Name"
          value={newLead.name}
          onChange={e=>setNewLead({...newLead,name:e.target.value})}
          className="bg-zinc-800 p-2 mr-2"
        />

        <input
          placeholder="Email"
          value={newLead.email}
          onChange={e=>setNewLead({...newLead,email:e.target.value})}
          className="bg-zinc-800 p-2 mr-2"
        />

        <button
          onClick={addLead}
          className="bg-blue-600 px-4 py-2"
        >
          Add
        </button>

      </div>

      {/* PIPELINE */}

      <div className="grid grid-cols-4 gap-4">

        {statuses.map(status=>(

          <div key={status} className="bg-zinc-900 p-3 rounded">

            <h3 className="capitalize font-bold mb-3">
              {status}
            </h3>

            {leads.filter(l=>l.status===status).map(l=>(

              <div
                key={l.id}
                onClick={()=>setSelected(l)}
                className={`p-2 mb-2 cursor-pointer rounded ${
                  l.score>=70 ? "bg-green-800" : "bg-zinc-800"
                }`}
              >
                {l.name}

                <select
                  value={l.status}
                  onChange={(e)=>updateStatus(l.id,e.target.value)}
                  className="block mt-1 bg-black text-xs"
                >
                  {statuses.map(s=>(
                    <option key={s}>{s}</option>
                  ))}
                </select>

              </div>

            ))}

          </div>

        ))}

      </div>

    </div>
  )
}