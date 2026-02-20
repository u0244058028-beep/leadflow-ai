"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { analyzeLeads, AIAnalysis } from "@/lib/aiBrain"

type Lead = {
  id: string
  name: string
  email: string
  status: string
  score: number
  user_id: string
  created_at: string
  value?: number
}

export default function DashboardPage() {

  const router = useRouter()

  const [user, setUser] = useState<any>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [analysis, setAnalysis] = useState<AIAnalysis[]>([])
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")

  // ===============================
  // INIT
  // ===============================

  useEffect(() => {

    async function init() {

      const { data } = await supabase.auth.getSession()

      if (!data.session) {
        router.replace("/login")
        return
      }

      setUser(data.session.user)

      const { data: leadData } = await supabase
        .from("leads")
        .select("*")
        .eq("user_id", data.session.user.id)
        .order("created_at", { ascending: false })

      if (leadData) {
        setLeads(leadData)
        setAnalysis(analyzeLeads(leadData))
      }

      setLoading(false)
    }

    init()

  }, [])

  // ===============================
  // ADD LEAD
  // ===============================

  async function addLead() {

    if (!name || !email || !user) return

    const { data } = await supabase
      .from("leads")
      .insert({
        name,
        email,
        status: "new",
        score: 30,
        user_id: user.id,
        value: 1000 // default deal value
      })
      .select()

    if (data) {

      const updated = [data[0], ...leads]

      setLeads(updated)
      setAnalysis(analyzeLeads(updated))

      setName("")
      setEmail("")
    }
  }

  // ===============================
  // LOGOUT
  // ===============================

  async function logout() {

    await supabase.auth.signOut()
    router.replace("/login")

  }

  if (loading) {

    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-neutral-400">
        Loading dashboard...
      </div>
    )
  }

  const statuses = ["new", "contacted", "qualified", "closed"]

  const totalRevenue =
    analysis.reduce((sum, a) => sum + a.expectedRevenue, 0)

  // ===============================
  // UI
  // ===============================

  return (

    <div className="min-h-screen bg-neutral-950 text-neutral-200 p-6">

      {/* HEADER */}

      <div className="flex justify-between mb-8">
        <h1 className="text-2xl font-bold">MyLeadAssistant AI</h1>

        <button
          onClick={logout}
          className="bg-neutral-800 px-4 py-2 rounded-lg hover:bg-neutral-700 transition"
        >
          Logout
        </button>
      </div>

      {/* TOTAL REVENUE KPI */}

      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold p-4 rounded-xl mb-6">
        💰 Predicted Revenue: ${totalRevenue}
      </div>

      {/* ADD LEAD */}

      <div className="bg-neutral-900 p-4 rounded-xl mb-6 border border-neutral-800">

        <input
          placeholder="Lead name"
          className="w-full mb-2 p-2 rounded bg-neutral-950 border border-neutral-800"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          placeholder="Lead email"
          className="w-full mb-3 p-2 rounded bg-neutral-950 border border-neutral-800"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={addLead}
          className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-lg transition"
        >
          Add Lead
        </button>

      </div>

      {/* PIPELINE */}

      <div className="grid grid-cols-4 gap-4">

        {statuses.map(status => {

          const filtered = leads.filter(l => l.status === status)

          return (

            <div key={status} className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">

              <h3 className="mb-3 capitalize font-semibold">
                {status}
              </h3>

              {filtered.map(l => {

                const ai = analysis.find(a => a.id === l.id)

                return (

                  <div key={l.id} className="bg-neutral-950 p-3 mb-3 rounded border border-neutral-800">

                    <p className="font-medium">{l.name}</p>
                    <p className="text-xs text-neutral-400">{l.email}</p>

                    {ai && (

                      <div className="mt-3 text-xs">

                        <div className="mb-1">
                          🎯 Close probability:
                          <span className="ml-2 font-bold text-green-400">
                            {ai.probability}%
                          </span>
                        </div>

                        <div className="mb-1">
                          💰 Expected revenue:
                          <span className="ml-2 font-bold text-yellow-400">
                            ${ai.expectedRevenue}
                          </span>
                        </div>

                        {ai.urgency >= 50 && (
                          <div className="text-red-400 mb-1">
                            ⚠️ High urgency
                          </div>
                        )}

                        <div className="text-purple-400">
                          👉 {ai.action}
                        </div>

                      </div>

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