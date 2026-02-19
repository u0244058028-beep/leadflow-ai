"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Message = {
  role: "ai" | "user"
  content: string
}

export default function AIOnboarding(){

  const [messages,setMessages] = useState<Message[]>([])
  const [input,setInput] = useState("")
  const [loading,setLoading] = useState(false)
  const [user,setUser] = useState<any>(null)

  useEffect(()=>{
    init()
  },[])

  async function init(){

    const { data:{ user } } = await supabase.auth.getUser()
    setUser(user)

    setMessages([
      {
        role:"ai",
        content:"👋 Hi — I'm your AI employee. Let's set up your lead machine.\n\nWhat type of business do you run?"
      }
    ])
  }

  async function sendMessage(){

    if(!input || loading) return

    const updatedMessages: Message[] = [
      ...messages,
      { role:"user", content:input }
    ]

    setMessages(updatedMessages)
    setInput("")
    setLoading(true)

    try{

      const res = await fetch("/api/onboarding",{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          onboarding:true,
          messages:updatedMessages
        })
      })

      const data = await res.json()

      const newMessages: Message[] = [
        ...updatedMessages,
        { role:"ai", content:data.reply }
      ]

      setMessages(newMessages)

      // 🚀 finish onboarding automatically
      if(newMessages.length >= 6){

        await supabase
          .from("profiles")
          .update({
            onboarded:true,
            onboarding_chat: JSON.stringify(newMessages)
          })
          .eq("id",user.id)

        window.location.reload()
      }

    }catch(e){
      console.log(e)
    }

    setLoading(false)
  }

  return(

    <div style={{
      maxWidth:600,
      marginTop:20,
      background:"#111",
      padding:20,
      borderRadius:20
    }}>

      <h2>🤖 AI Onboarding</h2>

      <div style={{
        maxHeight:300,
        overflowY:"auto",
        marginTop:20,
        marginBottom:20
      }}>

        {messages.map((m,i)=>(
          <div
            key={i}
            style={{
              marginBottom:10,
              padding:12,
              borderRadius:12,
              background:m.role==="ai" ? "#1e1b4b" : "#1f2937"
            }}
          >
            {m.content}
          </div>
        ))}

      </div>

      <textarea
        placeholder="Type your answer..."
        value={input}
        onChange={(e)=>setInput(e.target.value)}
        style={{
          width:"100%",
          height:80,
          padding:10,
          borderRadius:10,
          background:"#000",
          color:"#fff",
          border:"1px solid #333"
        }}
      />

      <button
        onClick={sendMessage}
        style={{
          marginTop:10,
          padding:"10px 20px",
          borderRadius:10,
          background:"#2563eb",
          color:"#fff",
          border:"none"
        }}
      >
        {loading ? "Thinking..." : "Send"}
      </button>

    </div>

  )
}