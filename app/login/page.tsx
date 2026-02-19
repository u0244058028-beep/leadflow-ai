"use client"

import { useState } from "react"
import { supabase } from "../lib/supabaseClient"

export default function Login() {

  const [email,setEmail] = useState("")
  const [loading,setLoading] = useState(false)

  const loginGoogle = async () => {

    setLoading(true)

    await supabase.auth.signInWithOAuth({
      provider:"google",
      options:{
        redirectTo: window.location.origin + "/dashboard"
      }
    })
  }

  const loginEmail = async () => {

    setLoading(true)

    await supabase.auth.signInWithOtp({
      email
    })

    alert("Check email for login link")
    setLoading(false)
  }

  return (

    <div className="min-h-screen flex flex-col items-center justify-center gap-6">

      <h1 className="text-4xl font-bold">MyLeadAssistant</h1>

      <button
        onClick={loginGoogle}
        className="bg-blue-600 text-white px-6 py-3 rounded"
      >
        Continue with Google
      </button>

      <input
        value={email}
        onChange={(e)=>setEmail(e.target.value)}
        placeholder="Email"
        className="border p-3 rounded"
      />

      <button
        onClick={loginEmail}
        className="bg-black text-white px-6 py-3 rounded"
      >
        Continue with Email
      </button>

    </div>
  )
}