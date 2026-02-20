"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { analyzeLeads, AIAnalysis } from "@/lib/aiBrain"

type Lead = {
  id:string
  name:string
  email:string
  status:string
  score:number
  user_id:string
  created_at:string
  value?:number
}

export default function DashboardPage(){

  const router = useRouter()

  const [user,setUser]=useState<any>(null)
  const [leads,setLeads]=useState<Lead[]>([])
  const [analysis,setAnalysis]=useState<AIAnalysis[]>([])
  const [loading,setLoading]=useState(true)

  const [name,setName]=useState("")
  const [email,setEmail]=useState("")

  useEffect(()=>{

    async function init(){

      const { data } = await supabase.auth.getSession()

      if(!data.session){
        router.replace("/login")
        return
      }

      setUser(data.session.user)

      const { data:leadData } = await supabase
        .from("leads")
        .select("*")
        .eq("user_id",data.session.user.id)
        .order("created_at",{ascending:false})

      if(leadData){
        setLeads(leadData)
        setAnalysis(analyzeLeads(leadData))
      }

      setLoading(false)
    }

    init()

  },[])

  async function addLead(){

    if(!name || !email || !user) return

    const { data } = await supabase
      .from("leads")
      .insert({
        name,
        email,
        status:"new",
        score:30,
        user_id:user.id,
        value:1000
      })
      .select()

    if(data){

      const updated=[data[0],...leads]

      setLeads(updated)
      setAnalysis(analyzeLeads(updated))

      setName("")
      setEmail("")
    }
  }

  async function moveLead(id:string,newStatus:string){

    await supabase
      .from("leads")
      .update({status:newStatus})
      .eq("id",id)

    const updated=leads.map(l=>
      l.id===id ? {...l,status:newStatus}:l
    )

    setLeads(updated)
    setAnalysis(analyzeLeads(updated))
  }

  async function logout(){

    await supabase.auth.signOut()
    router.replace("/login")

  }

  if(loading){
    return(
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        Loading...
      </div>
    )
  }

  const statuses=["new","contacted","qualified","closed"]

  const totalRevenue =
    analysis.reduce((sum,a)=>sum+a.expectedRevenue,0)

  const hottest =
    analysis.sort((a,b)=>b.probability-a.probability)[0]

  return(

    <div className="min-h-screen bg-neutral-950 text-neutral-200 p-6">

      {/* HEADER */}

      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">MyLeadAssistant AI</h1>
        <button onClick={logout}
        className="bg-neutral-800 px-4 py-2 rounded">
          Logout
        </button>
      </div>

      {/* COMMAND BAR */}

      <div className="bg-purple-700 p-4 rounded-xl mb-6">
        🤖 Today's Command:
        <p className="text-sm mt-2">
          {hottest
          ? `🔥 Focus on lead with ${hottest.probability}% close chance`
          : "Add leads to start AI engine"}
        </p>
      </div>

      {/* REVENUE PANEL */}

      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black p-4 rounded-xl mb-6 font-bold">
        💰 Revenue Forecast: ${totalRevenue}
      </div>

      {/* ADD LEAD */}

      <div className="bg-neutral-900 p-4 rounded-xl mb-6">

        <input
        placeholder="Lead name"
        className="w-full mb-2 p-3 bg-neutral-950 border border-neutral-800 rounded"
        value={name}
        onChange={(e)=>setName(e.target.value)}
        />

        <input
        placeholder="Lead email"
        className="w-full mb-3 p-3 bg-neutral-950 border border-neutral-800 rounded"
        value={email}
        onChange={(e)=>setEmail(e.target.value)}
        />

        <button
        onClick={addLead}
        className="bg-purple-600 px-6 py-2 rounded-lg">
          Add Lead
        </button>

      </div>

      {/* PIPELINE */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {statuses.map(status=>{

          const filtered=leads.filter(l=>l.status===status)

          return(

            <div key={status}
            className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">

              <h3 className="mb-3 capitalize font-semibold">{status}</h3>

              {filtered.map(l=>{

                const ai=analysis.find(a=>a.id===l.id)

                const isHot = hottest?.id === l.id

                return(

                  <div key={l.id}
                  className={`p-3 mb-3 rounded border ${
                    isHot
                    ? "border-purple-500 shadow-lg"
                    : "border-neutral-800"
                  }`}>

                    <p className="font-medium">{l.name}</p>
                    <p className="text-xs text-neutral-400">{l.email}</p>

                    {ai && (

                      <div className="text-xs mt-2 space-y-1">

                        <div>🎯 {ai.probability}% close chance</div>
                        <div className="text-yellow-400">
                          💰 ${ai.expectedRevenue}
                        </div>

                        <div className="text-purple-400">
                          👉 {ai.action}
                        </div>

                      </div>

                    )}

                    <button
                    onClick={()=>moveLead(l.id,"contacted")}
                    className="mt-2 text-xs bg-neutral-800 px-2 py-1 rounded">
                      Move →
                    </button>

                  </div>

                )

              })}

            </div>

          )

        })}

      </div>

    </div>
  )
}