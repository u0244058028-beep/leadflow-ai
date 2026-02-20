"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabase"

export default function LoginPage() {

  const router = useRouter()

  useEffect(() => {
    checkSession()
  }, [])

  async function checkSession() {
    const { data:{ session } } = await supabase.auth.getSession()
    if(session){
      router.replace("/dashboard")
    }
  }

  async function loginWithGoogle(){
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "https://www.myleadassistant.com/dashboard"
      }
    })
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