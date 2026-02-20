"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { analyzeLeads } from "@/lib/aiBrain"
import type { Lead } from "@/types/lead"

export default function Dashboard() {

  const router = useRouter()

  const [user, setUser] = useState<any>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [analysis, setAnalysis] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [value, setValue] = useState(500)
  const [interest, setInterest] = useState("website")
  const [source, setSource] = useState("referral")
  const [temperature, setTemperature] = useState("warm")
  const [notes, setNotes] = useState("")

  // ================= INIT =================

  useEffect(() => {
    async function load() {

      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.replace("/login")
        return
      }

      setUser(session.user)

      const { data } = await supabase
        .from("leads")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })

      if (data) {
        setLeads(data as Lead[])
        setAnalysis(analyzeLeads(data as Lead[]))
      }

      setLoading(false)
    }

    load()
  }, [])

  // ================= ADD LEAD =================

  async function addLead() {

    if (!name || !email || !user) return

    const { data } = await supabase
      .from("leads")
      .insert({
        name,
        email,
        status: "new",
        score: 50,
        potential_value: value,
        interest,
        lead_source: source,
        lead_temperature: temperature,
        notes,
        user_id: user.id
      })
      .select()

    if (data) {
      const updated = [data[0] as Lead, ...leads]
      setLeads(updated)
      setAnalysis(analyzeLeads(updated))

      setName("")
      setEmail("")
      setNotes("")
    }
  }

  // ================= AUTOPILOT =================

  async function runAutopilot() {

    const updated = [...leads]
    const newAnalysis = analyzeLeads(updated)

    for (const lead of updated) {

      const ai = newAnalysis.find(a => String(a.id) === String(lead.id))
      if (!ai) continue

      let newStatus = lead.status

      if (ai.expectedRevenue > 1000 && lead.status === "new") {
        newStatus = "contacted"
      }
      else if (ai.probability > 70 && lead.status === "contacted") {
        newStatus = "qualified"
      }
      else if (ai.probability > 90) {
        newStatus = "closed"
      }

      if (newStatus !== lead.status) {

        await supabase
          .from("leads")
          .update({ status: newStatus })
          .eq("id", lead.id)

        lead.status = newStatus
      }
    }

    setLeads(updated)
    setAnalysis(analyzeLeads(updated))
  }

  async function logout() {
    await supabase.auth.signOut()
    router.replace("/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white">
        Loading...
      </div>
    )
  }

  const expectedRevenue =
    analysis.reduce((sum, a) => sum + (a?.expectedRevenue || 0), 0)

  const nextAction =
    [...analysis].sort((a, b) =>
      (b?.priorityScore || 0) - (a?.priorityScore || 0)
    )[0]

  const statuses = ["new", "contacted", "qualified", "closed"]

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 p-6 space-y-6">

      {/* HEADER */}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Sales Command Center</h1>

        <div className="flex gap-3">
          <button
            onClick={runAutopilot}
            className="bg-green-600 px-4 py-2 rounded-lg hover:bg-green-500"
          >
            AI Autopilot
          </button>

          <button
            onClick={logout}
            className="bg-neutral-800 px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>
      </div>

      {/* AI PANEL */}

      <div className="bg-purple-700 p-4 rounded-xl">
        <h2 className="font-bold mb-2">AI Assistant</h2>

        {nextAction ? (
          <>
            <p className="text-lg">{nextAction.action}</p>
            <p className="text-sm">
              {Math.round(nextAction.probability)}% close chance
            </p>
          </>
        ) : (
          <p>No actions yet</p>
        )}
      </div>

      {/* REVENUE */}

      <div className="bg-neutral-900 p-6 rounded-xl">
        <p className="text-neutral-400 text-sm">Expected revenue</p>
        <p className="text-3xl text-green-400 font-bold">
          ${Math.round(expectedRevenue)}
        </p>
      </div>

      {/* ADD LEAD */}

      <div className="bg-neutral-900 p-4 rounded-xl space-y-2">

        <input
          placeholder="Lead name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 bg-neutral-950 rounded"
        />

        <input
          placeholder="Lead email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 bg-neutral-950 rounded"
        />

        <input
          type="number"
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-full p-2 bg-neutral-950 rounded"
        />

        <select
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
          className="w-full p-2 bg-neutral-950 rounded"
        >
          <option value="website">Website</option>
          <option value="ai">AI automation</option>
          <option value="marketing">Marketing</option>
          <option value="consulting">Consulting</option>
        </select>

        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="w-full p-2 bg-neutral-950 rounded"
        >
          <option value="referral">Referral</option>
          <option value="instagram">Instagram</option>
          <option value="ads">Ads</option>
          <option value="cold">Cold outreach</option>
        </select>

        <select
          value={temperature}
          onChange={(e) => setTemperature(e.target.value)}
          className="w-full p-2 bg-neutral-950 rounded"
        >
          <option value="cold">Cold</option>
          <option value="warm">Warm</option>
          <option value="hot">Hot</option>
        </select>

        <textarea
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full p-2 bg-neutral-950 rounded"
        />

        <button
          onClick={addLead}
          className="bg-purple-600 p-2 rounded w-full"
        >
          Add Lead
        </button>
      </div>

      {/* PIPELINE */}

      <div className="grid grid-cols-4 gap-4">

        {statuses.map(status => {

          const filtered = leads.filter(l => l.status === status)

          return (
            <div key={status} className="bg-neutral-900 p-4 rounded-xl">
              <h3 className="capitalize mb-3">{status}</h3>

              {filtered.map(l => {

                const ai = analysis.find(a =>
                  String(a.id) === String(l.id)
                )

                return (
                  <div key={l.id} className="bg-neutral-950 p-2 mb-2 rounded">
                    <p>{l.name}</p>

                    {ai && (
                      <p className="text-green-400 text-sm">
                        ${Math.round(ai.expectedRevenue)}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}

      </div>

    </div>
  )
}