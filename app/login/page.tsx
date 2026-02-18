'use client'

import { supabase } from "@/lib/supabase"
import { useState } from "react"

export default function LoginPage() {

  const [email, setEmail] = useState("")

  async function login() {

    await supabase.auth.signInWithOtp({
      email
    })

    alert("Check your email for login link")
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
