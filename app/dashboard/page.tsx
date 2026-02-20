"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { analyzeLeads } from "@/lib/aiBrain"
import type { Lead } from "@/types/lead"

export default function Dashboard() {

  const [leads, setLeads] = useState<Lead[]>([])
  const [analysis, setAnalysis] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [value, setValue] = useState(500)

  // ================= LOAD DATA =================

  useEffect(() => {

    async function load() {

      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from("leads")
        .select("*")
        .eq("user_id", session.user.id)

      if (data) {
        setLeads(data)
        setAnalysis(analyzeLeads(data))
      }

      setLoading(false)
    }

    load()

  }, [])

  // ================= ADD LEAD =================

  async function addLead() {

    const { data: { session } } = await supabase.auth.getSession()
    if (!session || !name || !email) return

    const { data } = await supabase
      .from("leads")
      .insert({
        name,
        email,
        status: "new",
        score: 50,
        potential_value: value,
        user_id: session.user.id
      })
      .select()

    if (data) {

      const updated = [data[0], ...leads]

      setLeads(updated)
      setAnalysis(analyzeLeads(updated))

      setName("")
      setEmail("")
      setValue(500)
    }
  }

  // ================= AUTOPILOT =================

  async function runAutopilot() {

    setSending(true)

    await fetch("/api/ai-autopilot", {
      method: "POST"
    })

    // reload after sending
    const { data: { session } } = await supabase.auth.getSession()

    if (session) {
      const { data } = await supabase
        .from("leads")
        .select("*")
        .eq("user_id", session.user.id)

      if (data) {
        setLeads(data)
        setAnalysis(analyzeLeads(data))
      }
    }

    setSending(false)
  }

  // ================= SAFE CALCULATIONS =================

  const expectedRevenue =
    analysis.reduce((sum, a) => sum + (a?.expectedRevenue || 0), 0)

  const sorted = [...analysis].sort(
    (a, b) => (b?.priorityScore || 0) - (a?.priorityScore || 0)
  )

  const nextAction = sorted[0]

  const nextLead = nextAction
    ? leads.find(l => String(l.id) === String(nextAction.id))
    : null

  // ================= LOADING =================

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Loading...
      </div>
    )
  }

  // ================= UI =================

  return (

    <div className="min-h-screen bg-black text-white p-4 space-y-6">

      {/* AI TASK */}

      <div className="bg-purple-700 p-4 rounded-xl">

        <h2 className="font-bold mb-2">
          🤖 Your AI Assistant
        </h2>

        {nextAction && nextLead ? (

          <div>

            <p className="text-lg font-semibold">
              👉 {nextAction.action}
            </p>

            <p className="text-sm">
              Lead: {nextLead.name}
            </p>

            <p className="text-sm">
              {Math.round(nextAction.probability)}% close chance
            </p>

            <p className="text-sm">
              Potential: ${Math.round(nextAction.expectedRevenue)}
            </p>

            <button
              onClick={runAutopilot}
              disabled={sending}
              className="mt-3 bg-green-600 px-4 py-2 rounded"
            >
              {sending ? "Sending..." : "Execute AI Action"}
            </button>

          </div>

        ) : (

          <p>No leads yet</p>

        )}

      </div>

      {/* MONEY */}

      <div className="bg-neutral-900 p-4 rounded-xl">

        <p className="text-sm text-neutral-400">
          Expected revenue
        </p>

        <p className="text-3xl text-green-400 font-bold">
          ${Math.round(expectedRevenue)}
        </p>

      </div>

      {/* ADD LEAD */}

      <div className="bg-neutral-900 p-4 rounded-xl space-y-2">

        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 bg-black border border-neutral-800 rounded"
        />

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 bg-black border border-neutral-800 rounded"
        />

        <input
          type="number"
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-full p-2 bg-black border border-neutral-800 rounded"
        />

        <button
          onClick={addLead}
          className="bg-purple-600 p-2 rounded w-full"
        >
          Add Lead
        </button>

      </div>

      {/* PIPELINE */}

      <div className="space-y-2">

        {leads.map(l => {

          const ai = analysis.find(a => String(a.id) === String(l.id))

          return (

            <div
              key={l.id}
              className="bg-neutral-900 p-3 rounded"
            >

              <div className="flex justify-between items-center">

                <div>
                  <p className="font-semibold">{l.name}</p>
                  <p className="text-xs text-neutral-400">
                    {l.email}
                  </p>
                </div>

                {ai && (
                  <div className="text-right">
                    <p className="text-green-400 text-sm">
                      ${Math.round(ai.expectedRevenue)}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {Math.round(ai.probability)}%
                    </p>
                  </div>
                )}

              </div>

            </div>

          )

        })}

      </div>

    </div>

  )

}