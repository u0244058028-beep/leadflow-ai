"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

type Lead = {
  id:string
  name:string
  email:string
  status:string
  score:number
  user_id:string
}

export default function DashboardPage(){

  const router = useRouter()

  const [user,setUser] = useState<any>(null)
  const [leads,setLeads] = useState<Lead[]>([])

  const [name,setName] = useState("")
  const [email,setEmail] = useState("")

  // ===============================
  // AUTH CHECK
  // ===============================

  useEffect(()=>{

    async function init(){

      const { data:{user} } = await supabase.auth.getUser()

      if(!user){
        router.push("/login")
        return
      }

      setUser(user)

      loadLeads(user.id)
    }

    init()

  },[])

  // ===============================
  // LOAD LEADS
  // ===============================

  async function loadLeads(userId:string){

    const { data,error } = await supabase
      .from("leads")
      .select("*")
      .eq("user_id",userId)
      .order("created_at",{ascending:false})

    if(!error && data){
      setLeads(data)
    }

  }

  // ===============================
  // SCORE CALCULATION (AI-LITE)
  // ===============================

  function calculateScore(){

    let score = 0

    if(email.includes("@")) score+=20
    if(name.length>2) score+=10

    return score
  }

  // ===============================
  // ADD LEAD
  // ===============================

  async function addLead(){

    if(!name || !email) return

    const score = calculateScore()

    const { data,error } = await supabase
      .from("leads")
      .insert({
        name,
        email,
        status:"new",
        score,
        user_id:user.id
      })
      .select()

    if(error){
      console.log("Insert error:",error)
      return
    }

    if(data){
      setLeads([data[0],...leads])
      setName("")
      setEmail("")
    }
  }

  // ===============================
  // LOGOUT
  // ===============================

  async function logout(){

    await supabase.auth.signOut()

    router.push("/login")
  }

  // ===============================
  // STATS
  // ===============================

  const hotLeads = leads.filter(l=>l.score>=30).length
  const dealsClosed = leads.filter(l=>l.status==="closed").length

  // ===============================
  // UI
  // ===============================

  return(

    <div className="min-h-screen bg-black text-white p-6">

      {/* HEADER */}
      <div className="flex justify-between mb-6">
        <h1 className="text-xl font-bold">Leadflow AI</h1>
        <button onClick={logout}>Logout</button>
      </div>

      {/* ADDICTIVE STATS */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 rounded-xl mb-4">
        🏆 Deals Closed: {dealsClosed} 🔥 Hot Leads: {hotLeads}
      </div>

      {/* AI SUGGESTIONS */}
      <div className="bg-gray-900 p-4 rounded-xl mb-6">
        🤖 AI Suggestions
        <p className="text-sm mt-2">
          {leads.length===0
            ? "🚀 Add your first lead to start momentum."
            : "🔥 Follow up with hot leads today."
          }
        </p>
      </div>

      {/* ADD LEAD */}
      <div className="bg-gray-900 p-4 rounded-xl mb-6">

        <input
          placeholder="Name"
          className="w-full mb-2 p-2 text-black"
          value={name}
          onChange={(e)=>setName(e.target.value)}
        />

        <input
          placeholder="Email"
          className="w-full mb-2 p-2 text-black"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
        />

        <button
          onClick={addLead}
          className="bg-blue-600 px-4 py-2 rounded"
        >
          Add
        </button>

      </div>

      {/* PIPELINE */}
      <div className="grid grid-cols-2 gap-4">

        {["new","contacted","qualified","closed"].map(status=>{

          const filtered = leads.filter(l=>l.status===status)

          return(

            <div key={status} className="bg-gray-900 p-4 rounded-xl">

              <h2 className="mb-3 capitalize">{status}</h2>

              {filtered.map(l=>(

                <div key={l.id} className="bg-black p-2 mb-2 rounded">
                  <p>{l.name}</p>
                  <p className="text-xs text-gray-400">{l.email}</p>
                </div>

              ))}

            </div>

          )

        })}

      </div>

    </div>

  )

}