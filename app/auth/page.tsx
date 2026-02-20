"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabase"

export default function AuthCallback(){

  const router = useRouter()

  useEffect(()=>{

    async function handleAuth(){

      // Viktig: hent session etter redirect
      const { data } = await supabase.auth.getSession()

      if(data.session){
        router.replace("/dashboard")
      } else {
        router.replace("/login")
      }

    }

    handleAuth()

  },[])

  return(
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      Logging you in...
    </div>
  )
}