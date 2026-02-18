'use client'

import { supabase } from "@/lib/supabase"
import { useEffect,useState } from "react"

export default function Dashboard(){

  const [leads,setLeads]=useState<any[]>([])
  const [rawInput,setRawInput]=useState("")
  const [loading,setLoading]=useState(false)

  async function loadLeads(){

    console.log("LOADING LEADS")

    const {data,error}=await supabase
      .from("leads")
      .select("*")
      .order("created_at",{ascending:false})

    console.log("LOAD RESULT",data,error)

    setLeads(data||[])
  }

  async function smartCapture(){

    console.log("BUTTON CLICKED")

    if(!rawInput.trim()){
      console.log("NO INPUT")
      return
    }

    setLoading(true)

    let parsed:any={}

    try{

      console.log("CALLING AI")

      const res = await fetch("/api/capture",{
        method:"POST",
        headers:{ "Content-Type":"application/json"},
        body:JSON.stringify({input:rawInput})
      })

      console.log("AI RESPONSE STATUS",res.status)

      parsed = await res.json()

      console.log("AI PARSED",parsed)

    }catch(e){

      console.log("AI ERROR",e)

    }

    const {data:userData,error:userError}=await supabase.auth.getUser()

    console.log("USER",userData,userError)

    const user=userData?.user

    if(!user){

      console.log("NO USER")
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

    console.log("INSERTING",insertData)

    const {error}=await supabase
      .from("leads")
      .insert(insertData)

    console.log("INSERT RESULT",error)

    setRawInput("")
    setLoading(false)

    loadLeads()
  }

  useEffect(()=>{

    loadLeads()

  },[])

  return(

    <main className="max-w-6xl mx-auto py-14 px-4 space-y-10">

      <h1 className="text-5xl font-bold">
        Leadflow AI DEBUG
      </h1>

      <div className="bg-neutral-900 p-8 rounded-3xl">

        <textarea
          className="bg-black border p-4 rounded-xl w-full"
          placeholder="Paste lead text..."
          value={rawInput}
          onChange={(e)=>setRawInput(e.target.value)}
        />

        <button
          onClick={smartCapture}
          className="bg-blue-600 px-8 py-3 rounded-xl mt-4"
        >
          {loading ? "WORKING..." : "Add with AI"}
        </button>

      </div>

      <div className="space-y-4">

        {leads.map(l=>(

          <div key={l.id} className="bg-neutral-900 p-4 rounded-xl">

            {l.name}

          </div>

        ))}

      </div>

    </main>
  )
}