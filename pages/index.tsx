import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session)
    })
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigasjon */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm fixed w-full z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                LeadFlow
              </span>
            </div>
            <div className="flex items-center gap-4">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                  >
                    Logg inn
                  </Link>
                  <Link
                    href="/login?signup=true"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                  >
                    Start gratis
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Følg opp leads med
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
              AI-assistent
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
            Automatisk lead-scoring, intelligente oppfølgingsmeldinger og smart oppgaveadministrasjon. 
            Alt du trenger for å konvertere flere kunder.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/login?signup=true"
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-lg font-medium"
            >
              Start gratis 14-dagers prøveperiode
            </Link>
            <Link
              href="#demo"
              className="px-8 py-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-lg font-medium"
            >
              Se demo
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Ingen kredittkort kreves • Sett opp på 2 minutter
          </p>
        </div>
      </section>

      {/* Funksjoner */}
      <section className="py-20 bg-white" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Alt du trenger for å følge opp leads
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'AI-drevet lead-scoring',
                description: 'Få automatisk vurdering av hvor sannsynlig det er at et lead konverterer, basert på samtaler og notater.',
                icon: '🤖',
              },
              {
                title: 'Smarte oppfølgingsmeldinger',
                description: 'Generer personlige e-poster med ett klikk. AI-en skriver utkast basert på leadets historikk.',
                icon: '✉️',
              },
              {
                title: 'Oppgaveadministrasjon',
                description: 'Hold styr på oppgaver knyttet til hvert lead. Få påminnelser og se hva som haster.',
                icon: '✅',
              },
              {
                title: 'Integrert med dine verktøy',
                description: 'Koble til e-post, kalender og andre systemer du allerede bruker.',
                icon: '🔌',
              },
              {
                title: 'Sanntidsdashboard',
                description: 'Få oversikt over pipeline, konverteringsrate og teamets ytelse på ett sted.',
                icon: '📊',
              },
              {
                title: 'Sikkerhet og personvern',
                description: 'Dine data er kryptert og behandles i henhold til GDPR.',
                icon: '🔒',
              },
            ].map((feature, i) => (
              <div key={i} className="p-6 border border-gray-100 rounded-xl hover:shadow-lg transition">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hvordan det fungerer */}
      <section className="py-20 bg-gray-50" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Kom i gang på 2 minutter
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Opprett konto',
                description: 'Registrer deg med Google eller e-post. Ingen kredittkort nødvendig.',
              },
              {
                step: '2',
                title: 'Legg til leads',
                description: 'Importer eksisterende leads eller legg til manuelt. AI-en begynner å analysere med en gang.',
              },
              {
                step: '3',
                title: 'Få AI-hjelp',
                description: 'La AI-en score leads og generere oppfølgingsmeldinger. Du fokuserer på å konvertere.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Priser */}
      <section className="py-20 bg-white" id="pricing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Enkel, forutsigbar prising
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12">
            Ingen skjulte avgifter. Du betaler kun for det du bruker.
          </p>
          <div className="max-w-md mx-auto">
            <div className="border-2 border-blue-600 rounded-2xl p-8 shadow-xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
              <p className="text-gray-600 mb-6">For salgsteam og gründere</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">499 kr</span>
                <span className="text-gray-600">/mnd</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Ubegrenset antall leads',
                  'AI-scoring av leads',
                  'Generering av oppfølgingsmeldinger',
                  'Oppgaveadministrasjon',
                  'E-postintegrasjon',
                  '14 dagers gratis prøveperiode',
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/login?signup=true"
                className="block w-full text-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Start gratis prøveperiode
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-lg font-semibold mb-4">LeadFlow</h4>
              <p className="text-gray-400 text-sm">
                AI-drevet lead-oppfølging for moderne salgsteam.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Produkt</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#features" className="hover:text-white">Funksjoner</Link></li>
                <li><Link href="#pricing" className="hover:text-white">Prising</Link></li>
                <li><Link href="#how-it-works" className="hover:text-white">Hvordan det fungerer</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Selskap</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/about" className="hover:text-white">Om oss</Link></li>
                <li><Link href="/contact" className="hover:text-white">Kontakt</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Personvern</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Følg oss</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Twitter</a></li>
                <li><a href="#" className="hover:text-white">LinkedIn</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-gray-400 text-center">
            © {new Date().getFullYear()} LeadFlow. Alle rettigheter reservert.
          </div>
        </div>
      </footer>
    </div>
  )
}