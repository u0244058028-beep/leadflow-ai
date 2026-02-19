"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import AIOnboarding from "../components/AIOnboarding"

const supabase = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Dashboard(){

 const [loading,setLoading] = useState(true)
 const [onboarded,setOnboarded] = useState(false)

 useEffect(()=>{

   checkUser()

   function finish(){
     setOnboarded(true)
   }

   window.addEventListener("onboarding-complete",finish)

   return ()=> window.removeEventListener("onboarding-complete",finish)

 },[])

 async function checkUser(){

   const { data:{ user } } = await supabase.auth.getUser()

   if(!user){
     window.location.href="/login"
     return
   }

   const { data } = await supabase
     .from("profiles")
     .select("*")
     .eq("id",user.id)
     .single()

   if(data?.onboarded){
     setOnboarded(true)
   }

   setLoading(false)
 }

 if(loading) return <div>Loading...</div>

 if(!onboarded){
   return (
     <div style={{background:"#000",color:"#fff",minHeight:"100vh",padding:30}}>
       <h1>Welcome to Leadflow AI</h1>
       <AIOnboarding />
     </div>
   )
 }

 return(

   <div style={{background:"#000",color:"#fff",minHeight:"100vh",padding:30}}>
     <h1>Leadflow AI Dashboard</h1>
     <p>AI is monitoring your leads automatically.</p>
   </div>

 )
}