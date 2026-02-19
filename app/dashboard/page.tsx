"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import AIOnboarding from "../components/AIOnboarding"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Dashboard() {

  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  useEffect(()=>{

    async function load(){

      const { data } = await supabase.auth.getUser()

      if(!data.user) return

      setUser(data.user)

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single()

      setProfile(profileData)

    }

    load()

  },[])

  if(!user) return null

  if(!profile?.onboarded){

    return (
      <div className="p-6">
        <AIOnboarding userId={user.id} />
      </div>
    )
  }

  return (

    <div className="p-6 space-y-6">

      <h1 className="text-3xl font-bold">
        Leadflow AI Dashboard
      </h1>

      <div className="bg-indigo-950 p-4 rounded">
        🤖 AI is monitoring your leads automatically
      </div>

      <div className="bg-zinc-900 p-6 rounded">
        Intelligent Lead Capture coming next step
      </div>

    </div>
  )
}