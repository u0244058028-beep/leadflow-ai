'use client'

import { supabase } from "@/lib/supabase"
import { useEffect, useState } from "react"

export default function Dashboard() {

  const [leads, setLeads] = useState<any[]>([])
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [loadingAI, setLoadingAI] = useState<string | null>(null)
  const [aiReplies, setAiReplies] = useState<any>({})

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

  async function generateAI(id:string) {

    setLoadingAI(id)

    const res = await fetch("/api/ai", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        message: "Write a friendly follow-up email to a new lead."
      })
    })

    const data = await res.json()

    setAiReplies((prev:any)=>({
      ...prev,
      [id]: data.reply
    }))

    setLoadingAI(null)
  }

  function copy(text:string){
    navigator.clipboard.writeText(text)
  }

  useEffect(()=>{
    loadLeads()
  },[])

  return (

    <main className="max-w-4xl mx-auto">

      <h1 className="text-3xl font-bold mb-6">
        Dashboard
      </h1>

      {/* ADD LEAD */}

      <div className="bg-neutral-900 p-6 rounded-xl mb-10">

        <h2 className="mb-4">Add Lead</h2>

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
            Add
          </button>

        </div>

      </div>

      {/* LEADS */}

      <div className="space-y-6">

        {leads.map(l=>(
          <div key={l.id} className="bg-neutral-900 p-5 rounded-xl">

            <div className="flex justify-between items-center">

              <div>
                <p className="font-semibold">{l.name}</p>
                <p className="text-gray-400 text-sm">{l.email}</p>
              </div>

              <button
                onClick={()=>generateAI(l.id)}
                className="bg-purple-500 px-3 py-2 rounded"
              >
                {loadingAI === l.id ? "Generating..." : "AI Follow-up"}
              </button>

            </div>

            {aiReplies[l.id] && (

              <div className="mt-4">

                <pre className="bg-black p-4 rounded whitespace-pre-wrap">
                  {aiReplies[l.id]}
                </pre>

                <button
                  onClick={()=>copy(aiReplies[l.id])}
                  className="mt-2 text-sm underline"
                >
                  Copy
                </button>

              </div>

            )}

          </div>
        ))}

      </div>

    </main>
  )
}
