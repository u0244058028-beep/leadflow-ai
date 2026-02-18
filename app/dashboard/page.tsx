'use client'

import { supabase } from "@/lib/supabase"
import { useEffect,useState } from "react"

export default function Dashboard(){

  const [leads,setLeads]=useState<any[]>([])
  const [name,setName]=useState("")
  const [email,setEmail]=useState("")
  const [activity,setActivity]=useState<string[]>([])
  const [brainRunning,setBrainRunning]=useState(false)

  function addActivity(msg:string){

    setActivity(prev=>[msg,...prev.slice(0,5)])
  }

  async function aiBrain(list:any[]){

    if(brainRunning) return

    setBrainRunning(true)
    addActivity("AI scanning leads...")

    for(const lead of list){

      if(lead.status==="new"){

        addActivity(`Analyzing ${lead.name}...`)

        await supabase.from("leads")
          .update({status:"thinking"})
          .eq("id",lead.id)

        const res = await fetch("/api/ai",{
          method:"POST",
          headers:{ "Content-Type":"application/json"},
          body:JSON.stringify({
            name:lead.name,
            email:lead.email
          })
        })

        const data = await res.json()

        await supabase.from("leads")
          .update({
            ai_followup:data.reply,
            status:"ready"
          })
          .eq("id",lead.id)

        addActivity(`AI generated follow-up for ${lead.name}`)
      }
    }

    setBrainRunning(false)
  }

  async function loadLeads(){

    const {data}=await supabase
      .from("leads")
      .select("*")
      .order("created_at",{ascending:false})

    setLeads(data||[])

    if(data){
      aiBrain(data)
    }
  }

  async function addLead(){

    const {data:userData}=await supabase.auth.getUser()
    const user=userData.user

    if(!user) return

    await supabase.from("leads").insert({
      user_id:user.id,
      name,
      email,
      status:"new"
    })

    setName("")
    setEmail("")
    addActivity("New lead added — AI starting...")
  }

  useEffect(()=>{

    loadLeads()

    const channel = supabase
      .channel('realtime')
      .on('postgres_changes',
        {event:'*',schema:'public',table:'leads'},
        ()=>loadLeads()
      )
      .subscribe()

    return ()=>supabase.removeChannel(channel)

  },[])

  function statusStyle(status:string){

    if(status==="thinking") return "bg-yellow-500"
    if(status==="ready") return "bg-green-500"

    return "bg-blue-500"
  }

  return(

    <main className="max-w-6xl mx-auto py-12 px-4 space-y-10">

      <h1 className="text-5xl font-bold">
        Leadflow AI
      </h1>

      {/* ONBOARDING */}

      {leads.length===0 &&(

        <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 p-10 rounded-3xl text-center">

          <p className="text-xl">
            Add your first lead and watch AI work automatically 🤖
          </p>

        </div>

      )}

      {/* ADD CARD */}

      <div className="bg-neutral-900 p-8 rounded-3xl shadow-xl">

        <div className="flex gap-4">

          <input
            className="bg-black border p-4 rounded-xl flex-1"
            placeholder="Lead name"
            value={name}
            onChange={(e)=>setName(e.target.value)}
          />

          <input
            className="bg-black border p-4 rounded-xl flex-1"
            placeholder="Lead email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
          />

          <button
            onClick={addLead}
            className="bg-blue-600 px-8 rounded-xl font-semibold hover:bg-blue-500 transition"
          >
            Add
          </button>

        </div>

      </div>

      {/* ACTIVITY FEED */}

      <div className="bg-neutral-900 p-6 rounded-3xl">

        <p className="mb-4 font-semibold">
          AI Activity
        </p>

        {activity.map((a,i)=>(
          <p key={i} className="text-sm text-gray-400">
            {a}
          </p>
        ))}

      </div>

      {/* LEADS */}

      <div className="grid gap-8">

        {leads.map(l=>(

          <div key={l.id}
            className="bg-neutral-900 p-8 rounded-3xl shadow-lg">

            <div className="flex justify-between items-center">

              <div>

                <p className="text-lg font-semibold">
                  {l.name}
                </p>

                <p className="text-gray-400 text-sm">
                  {l.email}
                </p>

              </div>

              <span className={`px-4 py-1 rounded-full text-xs ${statusStyle(l.status)}`}>
                {l.status}
              </span>

            </div>

            {l.ai_followup &&(

              <pre className="bg-black p-6 rounded-2xl mt-6 whitespace-pre-wrap text-sm">
                {l.ai_followup}
              </pre>

            )}

          </div>

        ))}

      </div>

    </main>
  )
}
