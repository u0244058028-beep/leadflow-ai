'use client'

import Link from "next/link"

export default function Home(){

  return(

    <main className="min-h-screen bg-black text-white">

      {/* NAV */}

      <nav className="flex justify-between items-center p-6 max-w-6xl mx-auto">

        <h1 className="font-bold text-xl">
          Leadflow AI
        </h1>

        <Link href="/login">
          <button className="bg-white text-black px-4 py-2 rounded-lg">
            Login
          </button>
        </Link>

      </nav>


      {/* HERO */}

      <section className="max-w-6xl mx-auto text-center pt-24 pb-32 px-6">

        <h2 className="text-6xl font-bold leading-tight">

          Autonomous AI that follows up your leads for you.

        </h2>

        <p className="mt-6 text-lg text-gray-300 max-w-2xl mx-auto">

          Leadflow AI analyzes every lead, writes follow-ups,
          scores opportunities, and tells you exactly what to do next —
          automatically.

        </p>

        <div className="mt-10 flex justify-center gap-4">

          <Link href="/login">
            <button className="bg-blue-600 px-8 py-4 rounded-xl text-lg">
              Start Free
            </button>
          </Link>

          <a href="#features">
            <button className="border border-white px-8 py-4 rounded-xl text-lg">
              See how it works
            </button>
          </a>

        </div>

      </section>


      {/* FEATURE FLOW */}

      <section id="features" className="bg-neutral-900 py-24">

        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-12 px-6">

          <div>

            <h3 className="text-xl font-semibold">
              🤖 AI analyzes every lead
            </h3>

            <p className="text-gray-400 mt-3">
              Automatically evaluates new leads and prepares the best follow-up strategy.
            </p>

          </div>

          <div>

            <h3 className="text-xl font-semibold">
              ⚡ Lead scoring & next actions
            </h3>

            <p className="text-gray-400 mt-3">
              AI scores opportunities and recommends exactly what to do next.
            </p>

          </div>

          <div>

            <h3 className="text-xl font-semibold">
              🚀 Fully autonomous follow-up
            </h3>

            <p className="text-gray-400 mt-3">
              No reminders. No manual writing. AI handles follow-ups automatically.
            </p>

          </div>

        </div>

      </section>


      {/* VALUE SECTION */}

      <section className="py-24 text-center">

        <h2 className="text-4xl font-bold">

          Stop managing leads. Let AI manage them.

        </h2>

        <p className="mt-6 text-gray-400 max-w-xl mx-auto">

          Designed for modern founders and teams who want an AI assistant,
          not another dashboard.

        </p>

      </section>


      {/* FINAL CTA */}

      <section className="text-center pb-24">

        <Link href="/login">

          <button className="bg-white text-black px-10 py-5 rounded-xl text-xl font-semibold">

            Try Leadflow AI

          </button>

        </Link>

      </section>


      <footer className="text-center text-gray-500 pb-10">

        © 2026 Leadflow AI

      </footer>

    </main>
  )
}
{/* deploy test */}
