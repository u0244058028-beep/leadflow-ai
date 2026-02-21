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
      {/* Navigation */}
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
            Automatic lead scoring, intelligent follow-up messages, and smart task management. 
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
              href="#demo"
              className="px-8 py-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-lg font-medium"
            >
              Watch demo
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
                title: 'AI-powered lead scoring',
                description: 'Get automatic assessment of how likely a lead is to convert, based on conversations and notes.',
                icon: '🤖',
              },
              {
                title: 'Smart follow-up messages',
                description: 'Generate personalized emails with one click. AI writes drafts based on lead history.',
                icon: '✉️',
              },
              {
                title: 'Task management',
                description: 'Keep track of tasks for each lead. Get reminders and see what needs attention.',
                icon: '✅',
              },
              {
                title: 'Integrate with your tools',
                description: 'Connect email, calendar, and other systems you already use.',
                icon: '🔌',
              },
              {
                title: 'Real-time dashboard',
                description: 'Get overview of pipeline, conversion rate, and team performance in one place.',
                icon: '📊',
              },
              {
                title: 'Security & privacy',
                description: 'Your data is encrypted and processed according to GDPR.',
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

      {/* How it works */}
      <section className="py-20 bg-gray-50" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Get started in 2 minutes
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Create account',
                description: 'Sign up with Google or email. No credit card needed.',
              },
              {
                step: '2',
                title: 'Add leads',
                description: 'Import existing leads or add manually. AI starts analyzing immediately.',
              },
              {
                step: '3',
                title: 'Get AI help',
                description: 'Let AI score leads and generate follow-ups. You focus on closing deals.',
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
                  'AI lead scoring',
                  'Follow-up message generation',
                  'Task management',
                  'Email integration',
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
                href="/login?signup=true"
                className="block w-full text-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Start free trial
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
                AI-powered lead follow-up for modern sales teams.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#features" className="hover:text-white">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="#how-it-works" className="hover:text-white">How it works</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Follow us</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Twitter</a></li>
                <li><a href="#" className="hover:text-white">LinkedIn</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-gray-400 text-center">
            © {new Date().getFullYear()} LeadFlow. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}