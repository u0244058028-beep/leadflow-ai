'use client'

import { supabase } from "@/lib/supabase"
import { useEffect, useState } from "react"

export default function Dashboard() {

  const [leads,setLeads]=useState<any[]>([])
  const [rawInput,setRawInput]=useState("")
  const [loading,setLoading]=useState(false)

  // LOAD LEADS

  async function loadLeads(){

    const {data}=await supabase
      .from("leads")
      .select("*")
      .order("created_at",{ascending:false})

    setLeads(data||[])
  }

  // SMART AI CAPTURE

  async function smartCapture(){

    if(!rawInput.trim()) return

    setLoading(true)

    const res = await fetch("/api/capture",{
      method:"POST",
      headers:{ "Content-Type":"application/json"},
      body:JSON.stringify({ input:rawInput })
    })

    const parsed = await res.json()

    const { data:userData } = await supabase.auth.getUser()
    const user=userData.user

    if(!user) return

    await supabase.from("leads").insert({
      user_id:user.id,
      name:parsed.name,
      email:parsed.email,
      notes:parsed.notes,
      status:"new"
    })

    setRawInput("")
    setLoading(false)
  }

  // REALTIME UPDATE

  useEffect(()=>{

    loadLeads()

    const channel = supabase
      .channel('realtime')
      .on(
        'postgres_changes',
        {event:'*',schema:'public',table:'leads'},
        ()=>loadLeads()
      )
      .subscribe()

    return ()=>{ void supabase.removeChannel(channel) }

  },[])

  // AI MISSION

  const urgent = leads.filter(l=>l.urgency==="URGENT")

  function urgencyStyle(u:string){

    if(u==="URGENT") return "text-red-400"
    if(u==="HIGH") return "text-yellow-400"

    return "text-gray-400"
  }

  return (

    <main className="max-w-5xl mx-auto py-14 px-4 space-y-12">

      <h1 className="text-5xl font-bold">
        Leadflow AI
      </h1>

      {/* AI MISSION */}

      <section className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 p-8 rounded-3xl">

        <p className="text-lg font-semibold mb-3">
          🤖 AI Mission
        </p>

        <p>{urgent.length} leads need attention</p>

      </section>

      {/* INTELLIGENT CAPTURE */}

      <section className="bg-neutral-900 p-8 rounded-3xl">

        <p className="font-semibold mb-4">
          Intelligent Lead Capture
        </p>

        <textarea
          className="bg-black border p-4 rounded-xl w-full"
          placeholder="Paste anything about your lead... email, text, notes, website..."
          value={rawInput}
          onChange={(e)=>setRawInput(e.target.value)}
        />

        <button
          onClick={smartCapture}
          className="bg-blue-600 px-8 py-3 rounded-xl mt-4"
        >
          {loading ? "Analyzing..." : "Add with AI"}
        </button>

      </section>

      {/* PRIORITY LEADS */}

      {urgent.length>0 &&(

        <section>

          <h2 className="mb-4 text-xl font-semibold">
            🔥 Needs Attention
          </h2>

          <div className="space-y-4">

            {urgent.map(l=>(

              <div
                key={l.id}
                className="bg-neutral-900 p-6 rounded-2xl"
              >

                <p className="font-semibold">
                  {l.name}
                </p>

                <p className="text-sm text-gray-400">
                  {l.next_action}
                </p>

              </div>

            ))}

          </div>

        </section>

      )}

      {/* ALL LEADS */}

      <section>

        <h2 className="mb-4 text-xl font-semibold">
          All Leads
        </h2>

        <div className="space-y-4">

          {leads.map(l=>(

            <div
              key={l.id}
              className="bg-neutral-900 p-6 rounded-2xl flex justify-between"
            >

              <div>

                <p className="font-semibold">
                  {l.name}
                </p>

                <p className="text-gray-400 text-sm">
                  {l.email}
                </p>

              </div>

              <p className={urgencyStyle(l.urgency)}>
                {l.urgency}
              </p>

            </div>

          ))}

        </div>

      </section>

    </main>

  )
}