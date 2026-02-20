"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { generateMission } from "@/lib/aiMission"

type Lead = {
  id: string
  name: string
  email: string
  status: string
  score: number
  user_id: string
}

export default function DashboardPage(){

  const router = useRouter()

  const [user,setUser] = useState<any>(null)
  const [leads,setLeads] = useState<Lead[]>([])
  const [name,setName] = useState("")
  const [email,setEmail] = useState("")
  const [loading,setLoading] = useState(true)

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
        user_id:user.id
      })
      .select()

    if(data){
      setLeads([data[0],...leads])
      setName("")
      setEmail("")
    }
  }

  async function logout(){
    await supabase.auth.signOut()
    router.replace("/login")
  }

  if(loading){
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  const hotLeads = leads.filter(l=>l.score>=30).length

  return(

    <div className="min-h-screen p-6">

      <div className="flex justify-between mb-6">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <button onClick={logout}>Logout</button>
      </div>

      <div className="bg-purple-700 p-4 rounded mb-6">
        🔥 Hot Leads: {hotLeads}
      </div>

      <div className="bg-gray-900 p-4 rounded mb-6">

        <input
          placeholder="Name"
          value={name}
          onChange={(e)=>setName(e.target.value)}
          className="w-full p-2 mb-2 text-black"
        />

        <input
          placeholder="Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          className="w-full p-2 mb-2 text-black"
        />

        <button
          onClick={addLead}
          className="bg-white text-black px-4 py-2 rounded"
        >
          Add Lead
        </button>

      </div>

      <div className="grid grid-cols-2 gap-4">

        {["new","contacted","qualified","closed"].map(status=>{

          const filtered = leads.filter(l=>l.status===status)

          return(
            <div key={status} className="bg-gray-900 p-4 rounded">

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