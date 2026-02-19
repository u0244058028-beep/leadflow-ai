'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import AIOnboarding from "../components/AIOnboarding"

export default function Dashboard(){

  const router = useRouter()

  const [leads,setLeads]=useState<any[]>([])
  const [rawInput,setRawInput]=useState("")
  const [loading,setLoading]=useState(false)

  // 🔒 AUTH PROTECTION

  useEffect(()=>{

    async function check(){

      const {data}=await supabase.auth.getSession()

      if(!data.session){

        router.push("/login")

      }

    }

    check()

  },[])

  // LOAD LEADS

  async function loadLeads(){

    const {data,error}=await supabase
      .from("leads")
      .select("*")
      .order("created_at",{ascending:false})

    if(error){

      console.log(error)
      return

    }

    setLeads(data||[])
  }

  useEffect(()=>{

    loadLeads()

  },[])

  // SMART CAPTURE

  async function smartCapture(){

    if(!rawInput.trim()) return

    setLoading(true)

    let parsed:any={}

    try{

      const res = await fetch("/api/capture",{

        method:"POST",
        headers:{ "Content-Type":"application/json"},
        body:JSON.stringify({input:rawInput})

      })

      parsed = await res.json()

    }catch(e){

      console.log("AI failed, fallback")

    }

    const {data:userData}=await supabase.auth.getUser()

    const user=userData?.user

    if(!user){

      setLoading(false)
      return

    }

    const insertData={

      user_id:user.id,
      name: parsed?.name || rawInput.substring(0,30),
      email: parsed?.email || "unknown@email.com",
      notes: parsed?.notes || rawInput,
      status:"new"

    }

    const {error}=await supabase
      .from("leads")
      .insert(insertData)

    if(error){

      console.log(error)

    }

    setRawInput("")
    setLoading(false)

    loadLeads()

  }

  async function logout(){

    await supabase.auth.signOut()

    router.push("/login")

  }

  return(

    <main className="max-w-6xl mx-auto py-14 px-4 space-y-12">

      {/* HEADER */}

      <div className="flex justify-between items-center">

        <h1 className="text-5xl font-bold">
          Leadflow AI
        </h1>

        <button
          onClick={logout}
          className="text-sm underline"
        >
          Logout
        </button>

      </div>

      {/* AI MISSION */}

      <section className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 p-8 rounded-3xl">

        <p className="text-lg font-semibold mb-2">
          🤖 AI Mission
        </p>

        <p>
          AI is monitoring your leads automatically.
        </p>

      </section>

      {/* INTELLIGENT CAPTURE */}

      <section className="bg-neutral-900 p-8 rounded-3xl space-y-4">

        <p className="font-semibold">
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
          className="bg-blue-600 px-8 py-3 rounded-xl"
        >
          {loading ? "AI thinking..." : "Add with AI"}
        </button>

      </section>

      {/* LEAD WORKSPACE */}

      <section>

        <h2 className="text-xl font-semibold mb-4">
          📋 Lead Workspace
        </h2>

        <div className="grid gap-6">

          {leads.map((l)=> (

            <div key={l.id}
              className="bg-neutral-900 p-6 rounded-2xl">

              <p className="font-semibold">
                {l.name}
              </p>

              <p className="text-gray-400 text-sm">
                {l.email}
              </p>

            </div>

          ))}

        </div>

      </section>

    </main>

  )

}