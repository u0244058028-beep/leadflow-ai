'use client'

import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { useRouter } from "next/navigation"

export default function DashboardLayout({ children }: any) {

  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    async function checkAuth() {

      const { data } = await supabase.auth.getUser()

      if (!data.user) {
        router.push("/login")
      } else {
        setLoading(false)
      }
    }

    checkAuth()

  }, [])

  if (loading) return <p>Loading...</p>

  return (
    <div className="min-h-screen bg-black text-white">

      <nav className="flex justify-between p-6 border-b border-neutral-800">

        <h1>Leadflow AI</h1>

        <button
          onClick={async ()=>{
            await supabase.auth.signOut()
            router.push("/")
          }}
        >
          Logout
        </button>

      </nav>

      <div className="p-6">
        {children}
      </div>

    </div>
  )
}
