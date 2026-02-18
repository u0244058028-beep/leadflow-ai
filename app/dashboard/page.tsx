'use client'

import { supabase } from "@/lib/supabase"
import { useEffect, useState } from "react"

export default function Dashboard() {

  const [leads, setLeads] = useState<any[]>([])
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [aiReply, setAiReply] = useState("")

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
      email
    })

    setName("")
    setEmail("")
    loadLeads()
  }

  async function generateAI() {

    const res = await fetch("/api/ai", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        message: "Write a short friendly follow-up email to a potential customer."
      })
    })

    const data = await res.json()

    setAiReply(data.reply)
  }

  useEffect(()=>{
    loadLeads()
  },[])

  return (

    <main className="max-w-4xl mx-auto">

      <h1 className="text-3xl font-bold mb-6">
        Dashboard
      </h1>

      <div className="bg-neutral-900 p-6 rounded-xl mb-10">

        <h2>Add Lead</h2>

        <input
          className="bg-black border p-2 mr-2"
          placeholder="Name"
          value={name}
          onChange={(e)=>setName(e.target.value)}
        />

        <input
          className="bg-black border p-2 mr-2"
          placeholder="Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
        />

        <button
          onClick={addLead}
          className="bg-blue-500 px-4 py-2"
        >
          Add
        </button>

      </div>

      <div className="space-y-4">

        {leads.map(l=>(
          <div key={l.id} className="bg-neutral-900 p-4 rounded-lg">
            {l.name} — {l.email}
          </div>
        ))}

      </div>

      <div className="mt-12">

        <button
          onClick={generateAI}
          className="bg-purple-500 px-4 py-2 rounded-lg"
        >
          Generate AI Follow-up
        </button>

        <pre className="mt-4 whitespace-pre-wrap">
          {aiReply}
        </pre>

      </div>

    </main>

  )
}
