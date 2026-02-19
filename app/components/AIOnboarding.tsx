"use client"

import { useState } from "react"

type Message = {
  role: "user" | "ai"
  content: string
}

export default function AIOnboarding({ onComplete }: any) {

  const questions = [
    "What type of business do you run?",
    "How do you get leads today?",
    "What is your main goal? (ex: close deals)"
  ]

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content: "👋 Hi — I'm your AI employee. Let's set up your lead machine. What type of business do you run?"
    }
  ])

  const [step, setStep] = useState(0)
  const [input, setInput] = useState("")

  function send() {

    if (!input) return

    const updated: Message[] = [
      ...messages,
      { role: "user", content: input }
    ]

    if (step < questions.length - 1) {

      updated.push({
        role: "ai",
        content: questions[step + 1]
      })

      setStep(step + 1)
      setMessages(updated)

    } else {

      updated.push({
        role: "ai",
        content: "✅ Setup complete. Your AI is ready."
      })

      setMessages(updated)
      onComplete()
    }

    setInput("")
  }

  return (
    <div className="bg-gray-900 p-4 rounded">

      {messages.map((m, i) => (
        <div key={i} className="mb-2">
          <b>{m.role === "ai" ? "AI:" : "You:"}</b> {m.content}
        </div>
      ))}

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="w-full p-2 text-black"
        placeholder="Type your answer..."
      />

      <button onClick={send} className="mt-2 bg-blue-500 p-2 rounded">
        Send
      </button>

    </div>
  )
}