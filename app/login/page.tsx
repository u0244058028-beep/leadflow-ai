"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function LoginPage(){

  const router = useRouter()
  const [loading,setLoading] = useState(true)

  useEffect(()=>{

    async function check(){
      const { data } = await supabase.auth.getSession()

      if(data.session){
        router.replace("/dashboard")
      } else {
        setLoading(false)
      }
    }

    check()

  },[])

  async function loginWithGoogle(){

    await supabase.auth.signInWithOAuth({
      provider:"google",
      options:{
        redirectTo:"https://www.myleadassistant.com/auth"
      }
    })

  }

  if(loading){
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return(
    <div className="min-h-screen flex items-center justify-center">

      <button
        onClick={loginWithGoogle}
        className="bg-white text-black px-6 py-3 rounded"
      >
        Login with Google
      </button>

    </div>
  )
}