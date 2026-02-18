'use client'

import { supabase } from "@/lib/supabase"
import { useEffect, useState } from "react"

export default function Dashboard() {

  const [leads, setLeads] = useState<any[]>([])
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [runningBrain, setRunningBrain] = useState(false)

  async function runBrain(leadsList:any[]) {

    if(runningBrain) return

    setRunningBrain(true)

    for (const lead of leadsList) {

      if (lead.status === "new") {

        await supabase
          .from("leads")
          .update({ status:"thinking" })
          .eq("id", lead.id)

        const res = await fetch("/api/ai", {
          method:"POST",
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({
            message:`Write a short friendly follow-up email to ${lead.name}.`
          })
        })

        const data = await res.json()

        await supabase
          .from("leads")
          .update({
            ai_followup:data.reply,
            status:"followed_up"
          })
          .eq("id", lead.id)
      }
    }

    setRunningBrain(false)
  }

  async function loadLeads() {

    const { data } = await supabase
      .from("leads")
      .select("*")
      .order("created_at",{ascending:false})

    setLeads(data || [])

    if(data){
      runBrain(data)
    }
  }

  async function addLead(){

    const { data:userData } = await supabase.auth.getUser()
    const user = userData.user

    if(!user) return

    await supabase.from("leads").insert({
      user_id:user.id,
      name,
      email,
      status:"new"
    })

    setName("")
    setEmail("")

    loadLeads()
  }

  useEffect(()=>{

    loadLeads()

    const interval = setInterval(loadLeads,5000)

    return ()=>clearInterval(interval)

  },[])

  function statusColor(status:string){

    if(status==="thinking") return "bg-yellow-500"
    if(status==="followed_up") return "bg-green-500"

    return "bg-blue-500"
  }

  return (

    <main className="max-w-5xl mx-auto py-10">

      <h1 className="text-4xl font-bold mb-10">
        Leadflow AI Dashboard
      </h1>

      <div className="bg-neutral-900 p-6 rounded-2xl mb-12">

        <div className="flex gap-3">

          <input
            className="bg-black border p-3 rounded-lg flex-1"
            placeholder="Lead name"
            value={name}
            onChange={(e)=>setName(e.target.value)}
          />

          <input
            className="bg-black border p-3 rounded-lg flex-1"
            placeholder="Lead email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
          />

          <button
            onClick={addLead}
            className="bg-blue-600 px-6 rounded-xl"
          >
            Add
          </button>

        </div>

      </div>

      <div className="grid gap-6">

        {leads.map(l=>(

          <div key={l.id} className="bg-neutral-900 p-6 rounded-2xl">

            <div className="flex justify-between">

              <div>

                <p className="font-semibold">{l.name}</p>
                <p className="text-gray-400">{l.email}</p>

              </div>

              <span className={`px-3 py-1 rounded-full text-xs ${statusColor(l.status)}`}>
                {l.status}
              </span>

            </div>

            {l.ai_followup && (

              <pre className="bg-black p-4 rounded-xl mt-5 whitespace-pre-wrap">
                {l.ai_followup}
              </pre>

            )}

          </div>

        ))}

      </div>

    </main>
  )
}
