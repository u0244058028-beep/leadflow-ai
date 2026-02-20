"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { generatePriorityMissions } from "@/lib/aiBrain"

type Lead = {
  id: string
  name: string
  email: string
  status: string
  score: number
  user_id: string
  created_at: string
  next_followup_at?: string
}

type Mission = {
  type: string
  text: string
  priority: number
}

export default function DashboardPage() {

  const router = useRouter()

  const [user, setUser] = useState<any>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [missions, setMissions] = useState<Mission[]>([])
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

        const aiMissions = generatePriorityMissions(leadData)
        setMissions(aiMissions)

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

    const nextFollowup = new Date()
    nextFollowup.setDate(nextFollowup.getDate() + 3)

    const { data } = await supabase
      .from("leads")
      .insert({
        name,
        email,
        status: "new",
        score: 30,
        user_id: user.id,
        next_followup_at: nextFollowup
      })
      .select()

    if (data) {

      const updated = [data[0], ...leads]

      setLeads(updated)

      const aiMissions = generatePriorityMissions(updated)
      setMissions(aiMissions)

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
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    )
  }

  const hotLeads = leads.filter(l => l.score >= 30).length

  // ===============================
  // UI
  // ===============================

  return (

    <div className="min-h-screen p-6">

      {/* HEADER */}
      <div className="flex justify-between mb-6">
        <h1 className="text-xl font-bold">MyLeadAssistant AI</h1>
        <button onClick={logout}>Logout</button>
      </div>

      {/* AI MISSION PANEL */}
      <div className="bg-purple-700 p-4 rounded-xl mb-6">

        <h2 className="font-bold mb-2">🤖 Today's Mission</h2>

        {missions.length === 0 && (
          <p>No urgent actions right now.</p>
        )}

        {missions.map((m, i) => (
          <p key={i}>{m.text}</p>
        ))}

      </div>

      {/* STATS */}
      <div className="bg-gray-900 p-4 rounded mb-6">
        🔥 Hot Leads: {hotLeads}
      </div>

      {/* ADD LEAD */}
      <div className="bg-gray-900 p-4 rounded mb-6">

        <input
          placeholder="Name"
          className="w-full mb-2 p-2 text-black"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          placeholder="Email"
          className="w-full mb-2 p-2 text-black"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={addLead}
          className="bg-white text-black px-4 py-2 rounded"
        >
          Add Lead
        </button>

      </div>

      {/* PIPELINE */}
      <div className="grid grid-cols-2 gap-4">

        {["new", "contacted", "qualified", "closed"].map(status => {

          const filtered = leads.filter(l => l.status === status)

          return (

            <div key={status} className="bg-gray-900 p-4 rounded">

              <h2 className="mb-3 capitalize">{status}</h2>

              {filtered.map(l => (

                <div key={l.id} className="bg-black p-2 mb-2 rounded">

                  <p>{l.name}</p>
                  <p className="text-xs text-gray-400">{l.email}</p>

                </div>

              ))}

            </div>

          )

        })}

      </div>

    </div>

  )
}