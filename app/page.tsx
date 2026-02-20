import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">

      <h1 className="text-4xl font-bold mb-6">
        MyLeadAssistant AI
      </h1>

      <p className="text-gray-400 mb-8 max-w-xl">
        Your AI Sales Assistant that helps you prioritize,
        follow up and close more deals.
      </p>

      <Link
        href="/login"
        className="bg-white text-black px-6 py-3 rounded"
      >
        Get Started
      </Link>

    </div>
  )
}