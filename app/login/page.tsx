"use client"

import { useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Login() {

  const [email,setEmail] = useState("")
  const [loading,setLoading] = useState(false)

  async function loginGoogle(){

    await supabase.auth.signInWithOAuth({
      provider:"google",
      options:{
        redirectTo:"https://leadflow-ai-ivory.vercel.app/dashboard"
      }
    })

  }

  async function loginEmail(){

    if(!email) return

    setLoading(true)

    await supabase.auth.signInWithOtp({

      email,
      options:{
        emailRedirectTo:"https://leadflow-ai-ivory.vercel.app/dashboard"
      }

    })

    alert("Magic link sent to your email 🚀")

    setLoading(false)
  }

  return (

    <div style={{
      minHeight:"100vh",
      background:"#000",
      color:"#fff",
      display:"flex",
      justifyContent:"center",
      alignItems:"center"
    }}>

      <div style={{
        width:400,
        padding:30,
        borderRadius:20,
        background:"#111"
      }}>

        <h1>Leadflow AI</h1>

        <button onClick={loginGoogle}
        style={{
          width:"100%",
          padding:15,
          marginTop:20,
          background:"#fff",
          color:"#000",
          borderRadius:10
        }}>
          Continue with Google
        </button>

        <p style={{marginTop:20}}>Or continue with email</p>

        <input
          placeholder="Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          style={{
            width:"100%",
            padding:12,
            marginTop:10,
            background:"#000",
            border:"1px solid #333",
            color:"#fff"
          }}
        />

        <button
          onClick={loginEmail}
          disabled={loading}
          style={{
            width:"100%",
            padding:15,
            marginTop:15,
            background:"#3b82f6",
            borderRadius:10
          }}
        >
          {loading ? "Sending..." : "Send Magic Link"}
        </button>

      </div>

    </div>

  )

}