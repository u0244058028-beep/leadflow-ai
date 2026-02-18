'use client'

import Link from "next/link"

export default function Home() {

  return (

    <main className="min-h-screen bg-black text-white">

      {/* NAVBAR */}

      <nav className="flex justify-between items-center p-6 max-w-6xl mx-auto">

        <h1 className="text-xl font-bold">
          Leadflow AI
        </h1>

        <div className="flex gap-4">
          <Link href="/login">
            <button className="px-4 py-2 bg-white text-black rounded-lg">
              Login
            </button>
          </Link>
        </div>

      </nav>


      {/* HERO */}

      <section className="max-w-6xl mx-auto px-6 pt-20 pb-32 text-center">

        <h2 className="text-5xl font-bold leading-tight">

          Never Lose a Lead Again.

        </h2>

        <p className="mt-6 text-lg text-gray-300 max-w-2xl mx-auto">

          Leadflow AI automatically follows up with your leads,
          reminds you when you forget, and uses AI to generate
          perfect replies — so you close more deals without extra work.

        </p>

        <div className="mt-10 flex justify-center gap-4">

          <Link href="/login">
            <button className="px-6 py-3 bg-blue-500 rounded-lg text-lg">
              Get Started
            </button>
          </Link>

          <button className="px-6 py-3 border border-white rounded-lg text-lg">
            See Demo
          </button>

        </div>

      </section>


      {/* FEATURES */}

      <section className="bg-neutral-900 py-24">

        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-10">

          <div>
            <h3 className="text-xl font-semibold">
              AI Follow-up
            </h3>
            <p className="text-gray-400 mt-3">
              Automatically generate smart follow-up replies using AI.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold">
              Never Forget Leads
            </h3>
            <p className="text-gray-400 mt-3">
              Smart reminders ensure no opportunity is lost.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold">
              Built for Small Business
            </h3>
            <p className="text-gray-400 mt-3">
              Simple workflow designed for real business owners.
            </p>
          </div>

        </div>

      </section>


      {/* CTA */}

      <section className="text-center py-24">

        <h2 className="text-4xl font-bold">
          Start closing more deals today.
        </h2>

        <Link href="/login">
          <button className="mt-8 px-8 py-4 bg-white text-black rounded-xl text-lg">
            Try Leadflow AI
          </button>
        </Link>

      </section>


      {/* FOOTER */}

      <footer className="text-center text-gray-500 pb-10">
        © 2026 Leadflow AI
      </footer>

    </main>

  )
}
