'use client'

import { supabase } from "@/lib/supabase"
import { useState } from "react"

export default function LoginPage() {

  const [email, setEmail] = useState("")

  async function login() {

    const redirectUrl = "https://leadflow-ai-ivory.vercel.app/auth"

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl
      }
    })

    if (error) {
      alert(error.message)
    } else {
      alert("Check your email for login link")
    }
  }

  return (
    <main>
      <h1>Login</h1>

      <input
        placeholder="email"
        value={email}
        onChange={(e)=>setEmail(e.target.value)}
      />

      <button onClick={login}>
        Login
      </button>

    </main>
  )
}
