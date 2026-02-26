import Link from 'next/link'
import { useEffect } from 'react'

export default function AILeadScoringAd() {
  useEffect(() => {
    // Spor konvertering (Google Ads)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'conversion', {
        'send_to': 'AW-CONVERSION_ID/CONVERSION_LABEL'
      })
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-20">
        <h1 className="text-5xl font-bold text-center mb-6">
          AI som scorer leads <span className="text-blue-600">automatisk</span>
        </h1>
        <p className="text-xl text-center text-gray-600 mb-12">
          Slutt å kaste bort tid på kalde leads. La AI analysere og prioritere for deg.
        </p>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Hvordan det fungerer:</h2>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <span className="text-green-500 text-xl">✓</span>
              <span>AI analyserer tittel, bransje og engasjement</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-500 text-xl">✓</span>
              <span>Får score 1-10 basert på konverteringssannsynlighet</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-500 text-xl">✓</span>
              <span>Prioriter varme leads og følg opp med en gang</span>
            </li>
          </ul>
        </div>

        <div className="text-center">
          <Link
            href="/signup?utm_source=google&utm_campaign=lead_scoring"
            className="inline-block px-8 py-4 bg-blue-600 text-white rounded-lg text-xl font-semibold hover:bg-blue-700 transition transform hover:scale-105"
          >
            Start din 14-dagers gratis prøve
          </Link>
          <p className="text-sm text-gray-500 mt-4">
            Ingen kredittkort • Kanseller når som helst
          </p>
        </div>

        {/* Trust badges */}
        <div className="mt-12 text-center text-gray-500">
          <p>Brukt av sales teams i 30+ land</p>
        </div>
      </div>
    </div>
  )
}