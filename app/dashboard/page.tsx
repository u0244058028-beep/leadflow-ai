"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import AIOnboarding from "../components/AIOnboarding"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Dashboard() {

  const [loading,setLoading] = useState(true)
  const [onboarded,setOnboarded] = useState(false)
  const [user,setUser] = useState<any>(null)

  useEffect(()=>{
    checkUser()
  },[])

  async function checkUser(){

    const { data:{ user } } = await supabase.auth.getUser()

    if(!user){
      window.location.href="/login"
      return
    }

    setUser(user)

    // check profile
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id",user.id)
      .single()

    if(!data){
      // create profile
      await supabase.from("profiles").insert({
        id:user.id
      })
      setOnboarded(false)
    } else {
      setOnboarded(data.onboarded)
    }

    setLoading(false)
  }

  async function logout(){
    await supabase.auth.signOut()
    window.location.href="/login"
  }

  if(loading){
    return <div style={{color:"#fff",background:"#000",minHeight:"100vh"}}>Loading...</div>
  }

  if(!onboarded){
    return (
      <div style={{background:"#000",color:"#fff",minHeight:"100vh",padding:30}}>
        <h1>Welcome to Leadflow AI</h1>
        <AIOnboarding />
      </div>
    )
  }

  return (

    <div style={{background:"#000",color:"#fff",minHeight:"100vh",padding:30}}>

      <div style={{display:"flex",justifyContent:"space-between"}}>
        <h1>Leadflow AI</h1>
        <button onClick={logout}>Logout</button>
      </div>

      <div style={{
        marginTop:30,
        padding:20,
        borderRadius:20,
        background:"linear-gradient(135deg,#1e1b4b,#312e81)"
      }}>
        🤖 AI Mission  
        <p>AI is monitoring your leads automatically.</p>
      </div>

      <div style={{
        marginTop:30,
        padding:20,
        borderRadius:20,
        background:"#111"
      }}>
        <h3>Intelligent Lead Capture</h3>
        <p>Paste anything about your lead...</p>
      </div>

    </div>

  )

}