"use client"

import { useEffect,useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import AIOnboarding from "../components/AIOnboarding"

export default function Dashboard(){

  const router = useRouter()
  const [user,setUser] = useState<any>(null)

  useEffect(()=>{

    const checkUser = async ()=>{

      const { data } = await supabase.auth.getUser()

      if(!data.user){
        router.push("/")
        return
      }

      setUser(data.user)
    }

    checkUser()

  },[])

  const logout = async ()=>{

    await supabase.auth.signOut()

    // FORCE CORRECT DOMAIN REDIRECT
    window.location.href = window.location.origin

  }

  if(!user) return null

  return(

    <div className="p-6">

      <div className="flex justify-between mb-8">

        <h1 className="text-3xl font-bold">MyLeadAssistant</h1>

        <button onClick={logout}>Logout</button>

      </div>

      <AIOnboarding/>

    </div>
  )
}