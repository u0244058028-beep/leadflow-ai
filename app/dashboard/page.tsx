'use client'

import { supabase } from "@/lib/supabase"
import { useEffect, useState } from "react"

export default function Dashboard() {

  const [leads, setLeads] = useState<any[]>([])
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  async function loadLeads() {

    const { data } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending:false })

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

    setName("")
    setEmail("")

    if (data) {
      await generateAI(data.id, data)
    }

    setGenerating(false)
  }

  async function deleteLead(id:string) {

    await supabase.from("leads").delete().eq("id", id)

    loadLeads()
  }

  async function updateLead(id:string) {

    const lead = leads.find(l=>l.id===id)

    await supabase.from("leads").update({
      name: lead.name,
      email: lead.email
    }).eq("id", id)

    setEditingId(null)
    loadLeads()
  }

  function changeField(id:string, field:string, value:string){

    setLeads(prev =>
      prev.map(l =>
        l.id === id ? { ...l, [field]: value } : l
      )
    )
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

      <div className="space-y-6">

        {leads.map(l=>(
          <div key={l.id} className="bg-neutral-900 p-5 rounded-xl">

            {editingId === l.id ? (

              <div className="space-y-3">

                <input
                  className="bg-black border p-2 w-full"
                  value={l.name}
                  onChange={(e)=>changeField(l.id,"name",e.target.value)}
                />

                <input
                  className="bg-black border p-2 w-full"
                  value={l.email}
                  onChange={(e)=>changeField(l.id,"email",e.target.value)}
                />

                <button
                  onClick={()=>updateLead(l.id)}
                  className="bg-green-500 px-3 py-1"
                >
                  Save
                </button>

              </div>

            ) : (

              <div className="flex justify-between">

                <div>
                  <p className="font-semibold">{l.name}</p>
                  <p className="text-gray-400">{l.email}</p>
                </div>

                <div className="flex gap-2">

                  <button
                    onClick={()=>setEditingId(l.id)}
                    className="text-sm underline"
                  >
                    Edit
                  </button>

                  <button
                    onClick={()=>deleteLead(l.id)}
                    className="text-sm text-red-400"
                  >
                    Delete
                  </button>

                </div>

              </div>

            )}

            {l.ai_followup && (

              <pre className="bg-black p-4 rounded mt-4 whitespace-pre-wrap animate-pulse">
                {l.ai_followup}
              </pre>

            )}

          </div>
        ))}

      </div>

    </main>
  )
}
