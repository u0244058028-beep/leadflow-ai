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

export default function AIOnboarding() {

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content:
        "👋 Hi — I'm your AI employee.\nLet's set up your lead machine.\nWhat type of business do you run?"
    }
  ])

  const [input, setInput] = useState("")
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  async function finishOnboarding() {

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from("profiles")
      .update({ onboarded: true })
      .eq("id", user.id)

    window.dispatchEvent(new Event("onboarding-complete"))
  }

  async function handleSend() {

    if (!input) return

    const userMessage: Message = { role: "user", content: input }

    const updatedMessages: Message[] = [...messages, userMessage]

    setMessages(updatedMessages)
    setInput("")
    setLoading(true)

    let aiResponse = ""

    if (step === 1) {
      aiResponse =
        "Nice. What is your main goal?\nGenerate leads, close deals, or automate follow-ups?"
      setStep(2)
    }
    else if (step === 2) {
      aiResponse =
        "Got it. Who is your ideal customer?"
      setStep(3)
    }
    else if (step === 3) {
      aiResponse =
        "Perfect. Your AI lead machine is ready 🚀"
      setStep(4)

      await finishOnboarding()
    }

    const aiMessage: Message = { role: "ai", content: aiResponse }

    setMessages(prev => [...prev, aiMessage])
    setLoading(false)
  }

  return (
    <div style={{
      background: "#111",
      padding: 20,
      borderRadius: 20,
      maxWidth: 600,
      marginTop: 20
    }}>

      <h3>🤖 AI Onboarding</h3>

      <div style={{ marginTop: 20 }}>

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              marginBottom: 10,
              padding: 12,
              borderRadius: 12,
              background:
                msg.role === "ai"
                  ? "#312e81"
                  : "#1f2937"
            }}
          >
            {msg.content}
          </div>
        ))}

      </div>

      {step < 4 && (
        <>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your answer..."
            style={{
              width: "100%",
              marginTop: 15,
              height: 70,
              background: "#000",
              color: "#fff",
              border: "1px solid #333",
              borderRadius: 10,
              padding: 10
            }}
          />

          <button
            onClick={handleSend}
            style={{
              marginTop: 10,
              padding: "10px 20px",
              background: "#2563eb",
              border: "none",
              borderRadius: 10,
              color: "#fff"
            }}
          >
            {loading ? "Thinking..." : "Send"}
          </button>
        </>
      )}

    </div>
  )
}