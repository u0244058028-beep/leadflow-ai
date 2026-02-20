"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabase"

type Lead = {
  id: string
  name: string
  email: string
  status: string
  score: number
  user_id: string
  next_followup_at?: string
}

export default function DashboardPage() {

  const router = useRouter()

  const [user, setUser] = useState<any>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [aiMessage, setAiMessage] = useState("")

  // ===============================
  // BULLETPROOF AUTH INIT
  // ===============================

  useEffect(() => {

    async function init() {

      const { data } = await supabase.auth.getSession()
      const session = data.session

      if (!session) {
        router.push("/login")
        return
      }

      setUser(session.user)

      await loadLeads(session.user.id)

      setLoading(false)
    }

    init()

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          router.push("/login")
        }
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }

  }, [])

  // ===============================
  // LOAD LEADS
  // ===============================

  async function loadLeads(userId: string) {

    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error || !data) return

    setLeads(data)

    await checkFollowups(data)
  }

  // ===============================
  // ZERO INFRA REMINDER ENGINE
  // ===============================

  async function checkFollowups(leads: Lead[]) {

    const now = new Date()

    for (const lead of leads) {

      if (!lead.next_followup_at) continue
      if (lead.status === "closed") continue

      const followupDate = new Date(lead.next_followup_at)

      if (followupDate <= now) {

        // Safe mode: just AI notification (no external email infra required)
        console.log("Reminder triggered for:", lead.name)

        const next = new Date()
        next.setDate(next.getDate() + 4)

        await supabase
          .from("leads")
          .update({ next_followup_at: next })
          .eq("id", lead.id)
      }
    }
  }

  // ===============================
  // ADD LEAD
  // ===============================

  async function addLead() {

    if (!name || !email || !user) return

    const nextFollowup = new Date()
    nextFollowup.setDate(nextFollowup.getDate() + 3)

    const { data, error } = await supabase
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

    if (error || !data) return

    setLeads([data[0], ...leads])
    setName("")
    setEmail("")
  }

  // ===============================
  // UPDATE STATUS
  // ===============================

  async function updateStatus(lead: Lead, newStatus: string) {

    await supabase
      .from("leads")
      .update({ status: newStatus })
      .eq("id", lead.id)

    setLeads(
      leads.map(l =>
        l.id === lead.id ? { ...l, status: newStatus } : l
      )
    )
  }

  // ===============================
  // AI FOLLOWUP GENERATOR
  // ===============================

  function generateFollowup(lead: Lead) {

    const msg =
      `Hi ${lead.name}, just checking in regarding your interest. ` +
      `Let me know if you'd like to move forward 🙂`

    setAiMessage(msg)
  }

  // ===============================
  // LOGOUT
  // ===============================

  async function logout() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading...
      </div>
    )
  }

  const hotLeads = leads.filter(l => l.score >= 30).length
  const dealsClosed = leads.filter(l => l.status === "closed").length

  // ===============================
  // UI
  // ===============================

  return (

    <div className="min-h-screen bg-black text-white p-6">

      <div className="flex justify-between mb-6">
        <h1 className="text-xl font-bold">MyLeadAssistant AI</h1>
        <button onClick={logout}>Logout</button>
      </div>

      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 rounded-xl mb-4">
        🏆 Deals Closed: {dealsClosed} 🔥 Hot Leads: {hotLeads}
      </div>

      <div className="bg-gray-900 p-4 rounded-xl mb-6">
        🤖 AI Suggestions
        <p className="text-sm mt-2">
          {leads.length === 0
            ? "🚀 Add your first lead."
            : "🔥 You have leads waiting for followup."
          }
        </p>
      </div>

      <div className="bg-gray-900 p-4 rounded-xl mb-6">

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
          className="bg-blue-600 px-4 py-2 rounded"
        >
          Add Lead
        </button>

      </div>

      {aiMessage && (
        <div className="bg-purple-700 p-4 rounded-xl mb-6">
          🤖 AI Followup:
          <p className="mt-2">{aiMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">

        {["new", "contacted", "qualified", "closed"].map(status => {

          const filtered = leads.filter(l => l.status === status)

          return (

            <div key={status} className="bg-gray-900 p-4 rounded-xl">

              <h2 className="mb-3 capitalize">{status}</h2>

              {filtered.map(l => (

                <div key={l.id} className="bg-black p-2 mb-2 rounded">

                  <p>{l.name}</p>
                  <p className="text-xs text-gray-400">{l.email}</p>

                  <div className="flex gap-2 mt-2 flex-wrap">

                    <button
                      onClick={() => generateFollowup(l)}
                      className="text-xs bg-purple-600 px-2 py-1 rounded"
                    >
                      🤖 Followup
                    </button>

                    {status !== "closed" && (
                      <button
                        onClick={() => updateStatus(l, "closed")}
                        className="text-xs bg-green-600 px-2 py-1 rounded"
                      >
                        ✅ Close
                      </button>
                    )}

                  </div>

                </div>

              ))}

            </div>

          )

        })}

      </div>

    </div>

  )

}