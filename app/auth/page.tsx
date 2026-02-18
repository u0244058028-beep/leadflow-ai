'use client'

import { useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function AuthPage() {

  const router = useRouter()

  useEffect(() => {

    async function handleAuth() {

      await supabase.auth.getSession()

      router.push("/test")
    }

    handleAuth()

  }, [router])

  return <p>Logging you in...</p>
}
