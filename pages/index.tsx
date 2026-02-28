import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import SEO from '@/components/SEO' // 🟢 NY

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session)
    })
  }, [])

  return (
    <>
      {/* 🟢 NY: SEO for forsiden */}
      <SEO 
        title="AI Lead Assistant - Automate Lead Follow Up & Scoring"
        description="AI-powered lead generation and follow-up. Create landing pages in seconds, score leads automatically, and track pipeline value. Start your 14-day free trial."
        keywords="AI lead scoring, lead generation software, sales automation, lead follow up, pipeline tracking, CRM alternative"
        ogType="website"
      />

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Navigation */}
        <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm fixed w-full z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center">
                <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  myleadassistant.com
                </Link>
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
                      Log in
                    </Link>
                    <Link
                      href="/login?signup=true"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                    >
                      Start free trial
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
              Follow up leads with
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
                AI Assistant
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
              AI-generated landing pages, automatic lead scoring, intelligent follow-up messages, and smart task management. 
              Everything you need to convert more customers.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/login?signup=true"
                className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-lg font-medium"
              >
                Start 14-day free trial
              </Link>
              <Link
                href="/guides/lead-scoring-guide" // 🟢 Endret til faktisk guide
                className="px-8 py-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-lg font-medium"
              >
                Read our guide
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              No credit card required • Set up in 2 minutes
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-white" id="features">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Everything you need to follow up leads
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: 'AI-generated landing pages',
                  description: 'Create high-converting lead capture pages in seconds. Just describe what you offer, and AI builds the perfect page.',
                  icon: '📄',
                },
                {
                  title: 'AI-powered lead scoring',
                  description: 'Get automatic assessment of how likely a lead is to convert (1-10), based on title, industry, and engagement.',
                  icon: '🤖',
                },
                {
                  title: 'Smart follow-up messages',
                  description: 'Generate personalized emails with one click. AI writes drafts based on lead history and score.',
                  icon: '✉️',
                },
                {
                  title: 'Pipeline value tracking',
                  description: 'Set potential deal values for each lead and see your total pipeline value in real-time.',
                  icon: '💰',
                },
                {
                  title: 'Email tracking',
                  description: 'Know when leads open your emails with automatic tracking pixels.',
                  icon: '📨',
                },
                {
                  title: 'Task management',
                  description: 'Keep track of tasks for each lead. Get reminders and see what needs attention.',
                  icon: '✅',
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

        {/* How it works */}
        <section className="py-20 bg-gray-50" id="how-it-works">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Get started in 2 minutes
            </h2>
            <div className="grid md:grid-cols-4 gap-8">
              {[
                {
                  step: '1',
                  title: 'Create account',
                  description: 'Sign up with Google or email. No credit card needed.',
                },
                {
                  step: '2',
                  title: 'Generate landing page',
                  description: 'Describe your offer and let AI create a professional lead capture page instantly.',
                },
                {
                  step: '3',
                  title: 'Add leads',
                  description: 'Leads come in automatically from your pages. Add manually if needed.',
                },
                {
                  step: '4',
                  title: 'Let AI help',
                  description: 'Score leads, send follow-ups, and track pipeline value automatically.',
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

        {/* AI Landing Pages Feature */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Create landing pages with AI
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  Stop wasting time designing pages. Just describe what you're offering, and our AI generates a complete, high-converting lead capture page in seconds.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Choose from guides, checklists, demos, consultations and more</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Optional fields to qualify leads without scaring them away</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Publish instantly at your own myleadassistant.com/s/your-page</span>
                  </li>
                </ul>
                <Link
                  href="/login?signup=true"
                  className="mt-8 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Try it now
                </Link>
              </div>
              <div className="bg-gray-100 rounded-xl p-8 border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <span className="text-6xl mb-4 block">📄✨</span>
                  <p className="text-gray-500 italic">"Create a landing page for my new AI consulting service"</p>
                  <div className="mt-4 h-2 w-24 bg-blue-600 mx-auto rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pipeline Value Feature */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 bg-white rounded-xl shadow-lg p-8">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Pipeline Value</span>
                  <span className="text-3xl font-bold text-green-600">$45,200</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>🔥 Hot leads (8-10)</span>
                    <span className="font-medium">$28,500</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: '63%' }}></div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>👍 Warm leads (5-7)</span>
                    <span className="font-medium">$12,000</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '27%' }}></div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>❄️ Cold leads (1-4)</span>
                    <span className="font-medium">$4,700</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '10%' }}></div>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Know your pipeline value
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  Set potential deal values for each lead and watch your total pipeline grow in real-time. Know exactly how much revenue you have in the pipeline.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Set custom values for each lead</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Automatic value estimates based on title and industry</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Track total pipeline value on your dashboard</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-20 bg-white" id="pricing">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
              Simple, predictable pricing
            </h2>
            <p className="text-xl text-gray-600 text-center mb-12">
              No hidden fees. You only pay for what you use.
            </p>
            <div className="max-w-md mx-auto">
              <div className="border-2 border-blue-600 rounded-2xl p-8 shadow-xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
                <p className="text-gray-600 mb-6">For sales teams and founders</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">$29</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {[
                    'Unlimited leads',
                    'AI-generated landing pages',
                    'AI lead scoring',
                    'Follow-up message generation',
                    'Pipeline value tracking',
                    'Email tracking',
                    'Task management',
                    '14-day free trial',
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
                  href="/pricing"
                  className="block w-full text-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  See pricing details
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
                <h4 className="text-lg font-semibold mb-4">myleadassistant.com</h4>
                <p className="text-gray-400 text-sm">
                  AI-powered lead follow-up for modern sales teams.
                </p>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4">Product</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><Link href="#features" className="hover:text-white">Features</Link></li>
                  <li><Link href="#pricing" className="hover:text-white">Pricing</Link></li>
                  <li><Link href="/guides" className="hover:text-white">Guides</Link></li> {/* 🟢 NY */}
                  <li><Link href="/comparisons" className="hover:text-white">Comparisons</Link></li> {/* 🟢 NY */}
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4">Company</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><Link href="/about" className="hover:text-white">About</Link></li>
                  <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                  <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
                  <li><Link href="/blog" className="hover:text-white">Blog</Link></li> {/* 🟢 NY */}
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4">Follow us</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>
                    <a 
                      href="https://x.com/L30401My" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-white transition"
                    >
                      X (Twitter)
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://www.linkedin.com/company/myleadassistant" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-white transition"
                    >
                      LinkedIn
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-gray-400 text-center">
              © {new Date().getFullYear()} myleadassistant.com. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}