"use client"

import { useState } from "react"

type Message = {
  role:"user"|"ai"
  content:string
}

export default function AIOnboarding(){

  const questions = [

    "What type of business do you run?",
    "Who is your ideal customer?",
    "What is your main goal? (ex: close deals)"

  ]

  const [step,setStep] = useState(0)

  const [messages,setMessages] = useState<Message[]>([
    {
      role:"ai",
      content:questions[0]
    }
  ])

  const [input,setInput] = useState("")

  const send = ()=>{

    if(!input) return

    const updatedMessages:Message[] = [

      ...messages,
      { role:"user", content:input }

    ]

    const nextStep = step + 1

    if(nextStep < questions.length){

      updatedMessages.push({
        role:"ai",
        content:questions[nextStep]
      })

    } else {

      updatedMessages.push({
        role:"ai",
        content:"Setup complete 🚀"
      })

    }

    setMessages(updatedMessages)
    setInput("")
    setStep(nextStep)

  }

  return(

    <div className="max-w-md">

      {messages.map((m,i)=>(

        <div key={i} className="mb-2">

          <b>{m.role}:</b> {m.content}

        </div>

      ))}

      <input
        value={input}
        onChange={(e)=>setInput(e.target.value)}
        className="border p-2 w-full"
        placeholder="Type..."
      />

      <button
        onClick={send}
        className="bg-blue-600 text-white px-4 py-2 mt-2"
      >
        Send
      </button>

    </div>
  )
}