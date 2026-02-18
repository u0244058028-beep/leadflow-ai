'use client'

import { supabase } from "@/lib/supabase"
import { useEffect,useState } from "react"

export default function Dashboard(){

  const [leads,setLeads]=useState<any[]>([])
  const [activity,setActivity]=useState<string[]>([])
  const [name,setName]=useState("")
  const [email,setEmail]=useState("")
  const [brainRunning,setBrainRunning]=useState(false)

  function addActivity(msg:string){
    setActivity(prev=>[msg,...prev.slice(0,5)])
  }

  function parseAI(text:string){

    const scoreMatch = text.match(/(\d+)/)
    const score = scoreMatch ? parseInt(scoreMatch[0]) : 50

    const nextActionMatch = text.split("NEXT ACTION")[1]

    return {
      score,
      nextAction: nextActionMatch || "Follow up soon"
    }
  }

  async function aiBrain(list:any[]){

    if(brainRunning) return

    setBrainRunning(true)

    for(const lead of list){

      if(lead.status==="new"){

        addActivity(`AI analyzing ${lead.name}`)

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

        const parsed = parseAI(data.reply)

        await supabase.from("leads")
          .update({
            ai_followup:data.reply,
            score:parsed.score,
            next_action:parsed.nextAction,
            status:"ready"
          })
          .eq("id",lead.id)

        addActivity(`Lead upgraded: ${lead.name}`)
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
    addActivity("New lead detected — AI engaged")
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

    // IMPORTANT: cleanup must be sync (NOT async)
    return ()=>{
      supabase.removeChannel(channel)
    }

  },[])

  function scoreColor(score:number){

    if(score>70) return "text-green-400"
    if(score>40) return "text-yellow-400"

    return "text-red-400"
  }

  return(

    <main className="max-w-6xl mx-auto py-12 px-4 space-y-10">

      <h1 className="text-5xl font-bold">
        Leadflow AI
      </h1>

      {/* ADD */}

      <div className="bg-neutral-900 p-8 rounded-3xl">

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
            className="bg-blue-600 px-8 rounded-xl"
          >
            Add
          </button>

        </div>

      </div>

      {/* ACTIVITY */}

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

          <div key={l.id} className="bg-neutral-900 p-8 rounded-3xl">

            <div className="flex justify-between">

              <div>

                <p className="font-semibold">{l.name}</p>
                <p className="text-gray-400">{l.email}</p>

              </div>

              <div className="text-right">

                <p className={`${scoreColor(l.score||0)} font-bold`}>
                  {l.score || 0}
                </p>

                <p className="text-xs text-gray-400">
                  Lead Score
                </p>

              </div>

            </div>

            {l.next_action &&(

              <p className="mt-4 text-blue-400 text-sm">
                Next action: {l.next_action}
              </p>

            )}

            {l.ai_followup &&(

              <pre className="bg-black p-6 rounded-xl mt-6 whitespace-pre-wrap text-sm">
                {l.ai_followup}
              </pre>

            )}

          </div>

        ))}

      </div>

    </main>

  )
}
