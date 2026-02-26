import Link from 'next/link'
import Layout from '@/components/Layout'

export default function AboutPage() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About Us</h1>
          <p className="text-xl text-gray-600">
            Building AI-powered tools to help sales teams convert more leads
          </p>
        </div>

        {/* Mission */}
        <div className="bg-blue-50 rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Mission</h2>
          <p className="text-gray-700 leading-relaxed">
            At myleadassistant.com, we believe that every sales team deserves access to 
            cutting-edge AI technology. Our mission is to automate the tedious parts of 
            lead follow-up so you can focus on what matters most: building relationships 
            and closing deals.
          </p>
        </div>

        {/* Story */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Story</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Founded in 2026, myleadassistant.com was born from a simple observation: 
            sales teams spend too much time on manual follow-up and not enough time 
            selling. We set out to build an AI assistant that could handle the heavy 
            lifting - from generating landing pages to scoring leads and sending 
            personalized follow-ups.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Today, we're helping sales teams around the world convert more leads and 
            grow their pipeline value. And we're just getting started.
          </p>
        </div>

        {/* Values */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 border border-gray-200 rounded-lg">
              <div className="text-3xl mb-3">🚀</div>
              <h3 className="font-semibold mb-2">Innovation First</h3>
              <p className="text-sm text-gray-600">
                We're constantly pushing the boundaries of what AI can do for sales teams.
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg">
              <div className="text-3xl mb-3">🤝</div>
              <h3 className="font-semibold mb-2">Customer Success</h3>
              <p className="text-sm text-gray-600">
                Your success is our success. We're here to help you convert more leads.
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg">
              <div className="text-3xl mb-3">🔒</div>
              <h3 className="font-semibold mb-2">Privacy & Security</h3>
              <p className="text-sm text-gray-600">
                We take the security of your data seriously. Always.
              </p>
            </div>
          </div>
        </div>

        {/* Back to home */}
        <div className="text-center">
          <Link 
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </Layout>
  )
}