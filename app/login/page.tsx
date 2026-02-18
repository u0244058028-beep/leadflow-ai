'use client'

import { supabase } from "@/lib/supabase"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {

  const [email, setEmail] = useState("")
  const router = useRouter()

  async function login() {

    await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + "/auth"
      }
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
