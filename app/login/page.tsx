'use client'

import { supabase } from "@/lib/supabase"

export default function LoginPage() {

  async function devLogin() {

    const { error } = await supabase.auth.signInWithPassword({
      email: "test@test.com",
      password: "password123"
    })

    if (error) {
      alert(error.message)
    } else {
      window.location.href = "/dashboard"
    }
  }

  return (
    <main className="p-10">
      <button onClick={devLogin}>
        Login as Test User
      </button>
    </main>
  )
}
