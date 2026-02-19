"use client"

import { useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function IntelligentLeadCapture({ refresh }: any) {

  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)

  const handleAdd = async () => {

    if (!text) return

    setLoading(true)

    try {

      // 🔥 CALL AI
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: text })
      })

      const aiLead = await res.json()

      // 🔥 SAVE LEAD TO DATABASE
      const { error } = await supabase
        .from("leads")
        .insert({
          name: aiLead.name || "Unknown",
          email: aiLead.email || "",
          status: "new",
          score: aiLead.score || 0,
          urgency: aiLead.urgency || "low",
          notes: text
        })

      if (error) throw error

      setText("")

      // 🔥 UPDATE DASHBOARD LIVE
      refresh()

    } catch (err) {
      console.error(err)
    }

    setLoading(false)
  }

  return (
    <div className="bg-zinc-900 p-6 rounded-xl">
      <h3 className="text-lg font-bold mb-4">
        Intelligent Lead Capture
      </h3>

      <textarea
        className="w-full p-4 rounded-lg bg-black border"
        placeholder="Paste anything about your lead..."
        value={text}
        onChange={(e)=>setText(e.target.value)}
      />

      <button
        onClick={handleAdd}
        className="mt-4 bg-blue-600 px-4 py-2 rounded"
      >
        {loading ? "Working..." : "Add with AI"}
      </button>
    </div>
  )
}