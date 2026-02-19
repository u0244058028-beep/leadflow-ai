"use client"

import { useEffect, useState } from "react"
import { supabase, SITE_URL } from "../lib/supabase"
import AIOnboarding from "../components/AIOnboarding"

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [onboardingComplete, setOnboardingComplete] = useState(false)

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data } = await supabase.auth.getUser()

    if (!data.user) {
      window.location.href = "/"
      return
    }

    setUser(data.user)

    // Check onboarding status (from metadata)
    const completed = data.user.user_metadata?.onboarding_complete
    setOnboardingComplete(!!completed)
  }

  async function logout() {
    await supabase.auth.signOut()

    window.location.href = SITE_URL!
  }

  if (!user) return null

  return (
    <div className="p-6 text-white">

      <div className="flex justify-between mb-6">
        <h1 className="text-xl font-bold">MyLeadAssistant</h1>
        <button onClick={logout}>Logout</button>
      </div>

      {!onboardingComplete ? (
        <AIOnboarding
          onComplete={async () => {
            await supabase.auth.updateUser({
              data: { onboarding_complete: true }
            })
            setOnboardingComplete(true)
          }}
        />
      ) : (
        <>
          <div className="bg-purple-600 p-4 rounded mb-4">
            🤖 AI Daily Briefing
          </div>

          <div className="bg-purple-600 p-4 rounded mb-4">
            🔥 AI Mission System
          </div>

          <div className="bg-gray-800 p-4 rounded">
            Enterprise Lead Pipeline
          </div>
        </>
      )}
    </div>
  )
}