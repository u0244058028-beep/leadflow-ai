'use client'

import { supabase } from "@/lib/supabase"
import { useEffect,useState } from "react"

export default function Dashboard(){

  const [leads,setLeads]=useState<any[]>([])
  const [rawInput,setRawInput]=useState("")
  const [selected,setSelected]=useState<any|null>(null)

  async function loadLeads(){

    const {data}=await supabase
      .from("leads")
      .select("*")
      .order("created_at",{ascending:false})

    setLeads(data||[])
  }

  async function smartCapture(){

    if(!rawInput.trim()) return

    const res = await fetch("/api/capture",{
      method:"POST",
      headers:{ "Content-Type":"application/json"},
      body:JSON.stringify({input:rawInput})
    })

    const parsed = await res.json()

    const {data:userData}=await supabase.auth.getUser()
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
  }

  async function deleteLead(id:string){

    await supabase.from("leads").delete().eq("id",id)
  }

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

  function urgencyColor(u:string){

    if(u==="URGENT") return "text-red-400"
    if(u==="HIGH") return "text-yellow-400"

    return "text-gray-400"
  }

  const urgent = leads.filter(l=>l.urgency==="URGENT")

  return(

    <main className="max-w-6xl mx-auto py-14 px-4 space-y-12">

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

      {/* QUICK CAPTURE */}

      <section className="bg-neutral-900 p-8 rounded-3xl">

        <p className="font-semibold mb-4">
          Intelligent Lead Capture
        </p>

        <textarea
          className="bg-black border p-4 rounded-xl w-full"
          placeholder="Paste anything about your lead..."
          value={rawInput}
          onChange={(e)=>setRawInput(e.target.value)}
        />

        <button
          onClick={smartCapture}
          className="bg-blue-600 px-8 py-3 rounded-xl mt-4"
        >
          Add with AI
        </button>

      </section>

      {/* NEEDS ATTENTION */}

      {urgent.length>0 &&(

        <section>

          <h2 className="text-xl font-semibold mb-4">
            🔥 Needs Attention
          </h2>

          <div className="grid gap-6">

            {urgent.map(l=>(

              <div key={l.id}
                className="bg-neutral-900 p-6 rounded-2xl cursor-pointer"
                onClick={()=>setSelected(l)}
              >

                <p className="font-semibold">{l.name}</p>

                <p className="text-sm text-gray-400">
                  {l.next_action}
                </p>

              </div>

            ))}

          </div>

        </section>

      )}

      {/* LEAD WORKSPACE */}

      <section>

        <h2 className="text-xl font-semibold mb-4">
          📋 Lead Workspace
        </h2>

        <div className="grid gap-6">

          {leads.map(l=>(

            <div key={l.id}
              className="bg-neutral-900 p-6 rounded-2xl cursor-pointer"
              onClick={()=>setSelected(l)}
            >

              <div className="flex justify-between">

                <div>

                  <p className="font-semibold">{l.name}</p>
                  <p className="text-gray-400 text-sm">{l.email}</p>

                </div>

                <p className={urgencyColor(l.urgency)}>
                  {l.urgency}
                </p>

              </div>

            </div>

          ))}

        </div>

      </section>

      {/* DETAIL PANEL */}

      {selected &&(

        <div className="fixed right-0 top-0 h-full w-[420px] bg-black border-l border-gray-800 p-6 space-y-4">

          <button
            onClick={()=>setSelected(null)}
            className="text-sm underline"
          >
            Close
          </button>

          <h2 className="text-xl font-semibold">
            {selected.name}
          </h2>

          <p className="text-gray-400">
            {selected.email}
          </p>

          <p className={urgencyColor(selected.urgency)}>
            {selected.urgency}
          </p>

          {selected.next_action &&(

            <div className="bg-blue-900/20 border border-blue-500/20 p-4 rounded-xl">

              Next action: {selected.next_action}

            </div>

          )}

          <button
            onClick={()=>deleteLead(selected.id)}
            className="text-red-400 underline text-sm"
          >
            Delete Lead
          </button>

        </div>

      )}

    </main>

  )
}