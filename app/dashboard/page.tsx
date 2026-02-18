'use client'

import { supabase } from "@/lib/supabase"
import { useEffect, useState } from "react"

export default function Dashboard() {

  const [leads, setLeads] = useState<any[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [generating, setGenerating] = useState(false)

  async function loadLeads() {

    const { data } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending:false })
      .limit(20) // 👈 viktig for performance

    setLeads(data || [])
  }

  async function generateAI(id:string, lead:any){

    const res = await fetch("/api/ai", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        message: `Write a friendly follow-up email to ${lead.name} at ${lead.email}.`
      })
    })

    const data = await res.json()

    await supabase
      .from("leads")
      .update({
        ai_followup: data.reply,
        last_followup: new Date()
      })
      .eq("id", id)

    loadLeads()
  }

  async function addLead() {

    setGenerating(true)

    const { data:userData } = await supabase.auth.getUser()
    const user = userData.user

    if (!user) return

    const { data } = await supabase
      .from("leads")
      .insert({
        user_id: user.id,
        name,
        email
      })
      .select()
      .single()

    if (data) {
      await generateAI(data.id, data)
    }

    setName("")
    setEmail("")
    setGenerating(false)
  }

  async function deleteLead(id:string) {

    await supabase.from("leads").delete().eq("id", id)

    loadLeads()
  }

  useEffect(()=>{
    loadLeads()
  },[])

  return (

    <main className="max-w-4xl mx-auto">

      <h1 className="text-3xl font-bold mb-6">
        Dashboard
      </h1>

      {/* ADD */}

      <div className="bg-neutral-900 p-6 rounded-xl mb-10">

        <div className="flex gap-3">

          <input
            className="bg-black border p-2 flex-1"
            placeholder="Name"
            value={name}
            onChange={(e)=>setName(e.target.value)}
          />

          <input
            className="bg-black border p-2 flex-1"
            placeholder="Email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
          />

          <button
            onClick={addLead}
            className="bg-blue-500 px-4 py-2 rounded"
          >
            {generating ? "AI generating..." : "Add Lead"}
          </button>

        </div>

      </div>

      {/* LEADS */}

      <div className="space-y-4">

        {leads.map(l=>{

          const isOpen = expanded === l.id

          return (

            <div
              key={l.id}
              className="bg-neutral-900 p-5 rounded-xl cursor-pointer"
              onClick={()=>setExpanded(isOpen ? null : l.id)}
            >

              <div className="flex justify-between items-center">

                <div>

                  <p className="font-semibold">{l.name}</p>

                  <p className="text-gray-400 text-sm">
                    {l.email}
                  </p>

                </div>

                <div className="flex gap-3 items-center">

                  <span className={`text-xs px-2 py-1 rounded ${
                    l.last_followup
                      ? "bg-green-600"
                      : "bg-yellow-600"
                  }`}>
                    {l.last_followup ? "Followed-up" : "New"}
                  </span>

                  <button
                    onClick={(e)=>{
                      e.stopPropagation()
                      deleteLead(l.id)
                    }}
                    className="text-red-400 text-sm"
                  >
                    Delete
                  </button>

                </div>

              </div>

              {/* EXPANDED */}

              {isOpen && l.ai_followup && (

                <pre className="bg-black p-4 rounded mt-4 whitespace-pre-wrap">
                  {l.ai_followup}
                </pre>

              )}

            </div>

          )

        })}

      </div>

    </main>
  )
}
