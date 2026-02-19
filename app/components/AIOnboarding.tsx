"use client"

import { useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Message = {
  role: "user" | "ai"
  content: string
}

export default function AIOnboarding({ userId }: { userId: string }) {

  const questions = [
    "👋 Hi — I'm your AI employee. What type of business do you run?",
    "What is your main goal with leads?",
    "Who is your ideal customer?"
  ]

  const [step, setStep] = useState(0)
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: questions[0] }
  ])
  const [input, setInput] = useState("")
  const [answers, setAnswers] = useState<string[]>([])

  async function send() {

    if (!input) return

    const newAnswers = [...answers, input]
    setAnswers(newAnswers)

    const updatedMessages: Message[] = [
      ...messages,
      { role: "user", content: input }
    ]

    setMessages(updatedMessages)
    setInput("")

    const nextStep = step + 1

    if (nextStep < questions.length) {

      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          { role: "ai", content: questions[nextStep] }
        ])
      }, 400)

      setStep(nextStep)

    } else {

      // SAVE PROFILE
      await supabase
        .from("profiles")
        .upsert({
          id: userId,
          business_type: newAnswers[0],
          goal: newAnswers[1],
          ideal_customer: newAnswers[2],
          onboarded: true
        })

      window.location.reload()
    }
  }

  return (
    <div className="p-6 bg-zinc-900 rounded-xl space-y-4">

      <h2 className="text-xl font-semibold">🤖 AI Onboarding</h2>

      <div className="space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "ai" ? "bg-indigo-900 p-3 rounded" : "bg-zinc-800 p-3 rounded"}>
            {m.content}
          </div>
        ))}
      </div>

      <textarea
        className="w-full bg-black border rounded p-3"
        value={input}
        onChange={(e)=>setInput(e.target.value)}
        placeholder="Type your answer..."
      />

      <button
        onClick={send}
        className="bg-blue-600 px-4 py-2 rounded"
      >
        Send
      </button>

    </div>
  )
}