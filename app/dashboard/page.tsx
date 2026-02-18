'use client'

import { supabase } from "@/lib/supabase"
import { useEffect, useState } from "react"

export default function Dashboard() {

  const [leads, setLeads] = useState<any[]>([])
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")

  async function loadLeads() {

    const { data } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending:false })

    setLeads(data || [])
  }

  async function addLead() {

    const { data:userData } = await supabase.auth.getUser()
    const user = userData.user

    if (!user) return

    await supabase.from("leads").insert({
      user_id: user.id,
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

    const interval = setInterval(loadLeads, 5000)

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

      {/* ADD CARD */}

      <div className="bg-neutral-900 p-6 rounded-2xl mb-12 shadow-lg">

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

      {/* LEADS GRID */}

      <div className="grid gap-6">

        {leads.map(l=>(

          <div
            key={l.id}
            className="bg-neutral-900 p-6 rounded-2xl shadow-lg"
          >

            <div className="flex justify-between items-center">

              <div>

                <p className="text-lg font-semibold">
                  {l.name}
                </p>

                <p className="text-gray-400 text-sm">
                  {l.email}
                </p>

              </div>

              <span
                className={`text-xs px-3 py-1 rounded-full ${statusColor(l.status)}`}
              >
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
