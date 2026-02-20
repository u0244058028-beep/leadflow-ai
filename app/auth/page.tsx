"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function AuthPage(){

  const router = useRouter()

  useEffect(()=>{

    async function handle(){
      const { data } = await supabase.auth.getSession()

      if(data.session){
        router.replace("/dashboard")
      } else {
        router.replace("/login")
      }
    }

    handle()

  },[])

  return <div className="min-h-screen flex items-center justify-center">Logging in...</div>
}