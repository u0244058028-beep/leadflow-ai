"use client"

import { useState } from "react"

export default function AIOnboarding(){

  const [messages,setMessages] = useState([
    {role:"ai", text:"Hi 👋 I'm your AI employee. What kind of business do you run?"}
  ])

  const [input,setInput] = useState("")
  const [loading,setLoading] = useState(false)

  async function send(){

    if(!input) return

    const newMessages = [...messages,{role:"user",text:input}]
    setMessages(newMessages)
    setInput("")
    setLoading(true)

    const res = await fetch("/api/ai-onboarding",{
      method:"POST",
      body:JSON.stringify({message:input})
    })

    const data = await res.json()

    setMessages([...newMessages,{role:"ai",text:data.reply}])

    setLoading(false)
  }

  return (

    <div style={{background:"#111",padding:20,borderRadius:20}}>

      <h3>🤖 AI Setup</h3>

      <div style={{maxHeight:300,overflow:"auto"}}>

        {messages.map((m,i)=>(
          <div key={i} style={{marginTop:10}}>
            <b>{m.role==="ai"?"AI":"You"}:</b> {m.text}
          </div>
        ))}

      </div>

      <input
        value={input}
        onChange={(e)=>setInput(e.target.value)}
        placeholder="Type..."
        style={{width:"100%",marginTop:10}}
      />

      <button onClick={send}>
        {loading ? "Thinking..." : "Send"}
      </button>

    </div>

  )

}