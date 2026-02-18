'use client'

import { supabase } from "@/lib/supabase"
import { useEffect,useState } from "react"

export default function Dashboard(){

  const [leads,setLeads]=useState<any[]>([])
  const [mission,setMission]=useState<any>({
    urgent:0,
    high:0,
    warming:0
  })

  async function loadLeads(){

    const {data}=await supabase
      .from("leads")
      .select("*")
      .order("created_at",{ascending:false})

    const list=data||[]

    setLeads(list)

    // AI mission summary
    const urgent=list.filter(l=>l.urgency==="URGENT").length
    const high=list.filter(l=>l.urgency==="HIGH").length
    const warming=list.filter(l=>l.urgency==="MEDIUM").length

    setMission({urgent,high,warming})
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

  function urgencyColor(u:string){

    if(u==="URGENT") return "text-red-400"
    if(u==="HIGH") return "text-yellow-400"
    if(u==="MEDIUM") return "text-blue-400"

    return "text-gray-400"
  }

  return(

    <main className="max-w-5xl mx-auto py-14 space-y-10">

      <h1 className="text-5xl font-bold">
        Leadflow AI
      </h1>

      {/* AI MISSION */}

      <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 p-8 rounded-3xl">

        <p className="text-lg font-semibold mb-4">
          🤖 Today's AI Mission
        </p>

        <p>{mission.urgent} urgent opportunities</p>
        <p>{mission.high} high priority leads</p>
        <p>{mission.warming} warming leads</p>

      </div>

      {/* LEADS */}

      <div className="space-y-6">

        {leads.map(l=>(

          <div key={l.id} className="bg-neutral-900 p-6 rounded-3xl">

            <div className="flex justify-between">

              <div>

                <p className="font-semibold">
                  {l.name}
                </p>

                <p className="text-gray-400 text-sm">
                  {l.email}
                </p>

              </div>

              <p className={`font-bold ${urgencyColor(l.urgency)}`}>
                {l.urgency}
              </p>

            </div>

            {l.next_action &&(

              <div className="bg-blue-900/20 border border-blue-500/20 p-4 rounded-xl mt-4">

                Next action: {l.next_action}

              </div>

            )}

          </div>

        ))}

      </div>

    </main>
  )
}