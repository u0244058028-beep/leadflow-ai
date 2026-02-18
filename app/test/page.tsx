'use client'

import { supabase } from "@/lib/supabase"
import { useState } from "react"

export default function TestPage() {

  const [result, setResult] = useState("")

  async function testInsert() {

    const { data: userData } = await supabase.auth.getUser()

    const user = userData.user

    if (!user) {
      setResult("Not logged in")
      return
    }

    const { error } = await supabase
      .from("leads")
      .insert({
        user_id: user.id,
        name: "Test Lead",
        email: "test@test.com"
      })

    if (error) {
      setResult(JSON.stringify(error))
    } else {
      setResult("Inserted OK")
    }
  }

  return (
    <main>

      <button onClick={testInsert}>
        Test Supabase Insert
      </button>

      <pre>{result}</pre>

    </main>
  )
}
