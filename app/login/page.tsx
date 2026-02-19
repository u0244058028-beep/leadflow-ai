'use client'

import { supabase } from "@/lib/supabase"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Login(){

  const router = useRouter()

  // Redirect hvis allerede logget inn
  useEffect(()=>{

    async function check(){

      const {data}=await supabase.auth.getSession()

      if(data.session){

        router.push("/dashboard")

      }

    }

    check()

  },[])

  async function signInWithGoogle(){

    await supabase.auth.signInWithOAuth({

      provider:"google",

      options:{
        redirectTo:"https://leadflow-ai-ivory.vercel.app/dashboard"
      }

    })

  }

  return(

    <main className="flex items-center justify-center min-h-screen">

      <div className="bg-neutral-900 p-10 rounded-3xl text-center space-y-6">

        <h1 className="text-3xl font-bold">
          Login to Leadflow AI
        </h1>

        <button
          onClick={signInWithGoogle}
          className="bg-white text-black px-8 py-3 rounded-xl font-semibold"
        >
          Continue with Google
        </button>

      </div>

    </main>

  )

}