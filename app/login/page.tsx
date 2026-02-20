"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabase"

export default function LoginPage() {

  const router = useRouter()
  const [loading, setLoading] = useState(true)

  // ===============================
  // SESSION CHECK + LISTENER
  // ===============================

  useEffect(() => {

    async function init() {

      const { data } = await supabase.auth.getSession()

      if (data.session) {
        router.replace("/dashboard")
      } else {
        setLoading(false)
      }
    }

    init()

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          router.replace("/dashboard")
        }
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }

  }, [])

  // ===============================
  // GOOGLE LOGIN
  // ===============================

  async function loginWithGoogle() {

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "https://www.myleadassistant.com"
      }
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">

      <div className="bg-gray-900 p-8 rounded-xl w-80 text-center">

        <h1 className="text-xl mb-6 font-bold">Login</h1>

        <button
          onClick={loginWithGoogle}
          className="bg-white text-black px-4 py-2 rounded w-full"
        >
          Login with Google
        </button>

      </div>

    </div>
  )
}