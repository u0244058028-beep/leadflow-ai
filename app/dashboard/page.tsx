"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

export default function Dashboard() {

  const router = useRouter()
  const [loading,setLoading] = useState(true)

  useEffect(() => {

    const checkUser = async () => {

      const { data:{ session } } = await supabase.auth.getSession()

      if(!session){
        router.push("/login")
      } else {
        setLoading(false)
      }
    }

    checkUser()

  },[])

  if(loading){
    return <div className="p-10">Loading...</div>
  }

  return (
    <div className="p-10">
      <h1>Dashboard</h1>
    </div>
  )
}