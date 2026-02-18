'use client'

import { supabase } from "@/lib/supabase"
import { useState } from "react"

export default function TestPage() {

  const [result, setResult] = useState("")

  async function testInsert() {

    const { data, error } = await supabase
      .from("leads")
      .insert({
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
