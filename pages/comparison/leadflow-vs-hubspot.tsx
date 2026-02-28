// pages/comparisons/leadflow-vs-hubspot.tsx
import Link from 'next/link'
import Layout from '@/components/Layout'
import SEO from '@/components/SEO'

export default function LeadflowVsHubspot() {
  return (
    <Layout>
      <SEO 
        title="LeadFlow vs HubSpot: Which is Better for Lead Generation?"
        description="Compare LeadFlow and HubSpot for AI-powered lead generation, scoring, and follow-up. See which tool is right for your sales team."
        keywords="LeadFlow vs HubSpot, HubSpot alternative, AI lead scoring comparison"
      />

      <div className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold mb-4">LeadFlow vs HubSpot</h1>
        <p className="text-xl text-gray-600 mb-8">
          An honest comparison of two lead generation platforms
        </p>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-4">Feature</th>
                <th className="text-left py-4">LeadFlow</th>
                <th className="text-left py-4">HubSpot</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-4">AI Lead Scoring</td>
                <td className="py-4 text-green-600">✅ Advanced AI</td>
                <td className="py-4">⚠️ Basic rules only</td>
              </tr>
              <tr className="border-b">
                <td className="py-4">AI Landing Pages</td>
                <td className="py-4 text-green-600">✅ Generated in seconds</td>
                <td className="py-4">❌ Not available</td>
              </tr>
              <tr className="border-b">
                <td className="py-4">Smart Follow-ups</td>
                <td className="py-4 text-green-600">✅ AI-powered</td>
                <td className="py-4">⚠️ Template-based</td>
              </tr>
              <tr className="border-b">
                <td className="py-4">Pricing</td>
                <td className="py-4 text-green-600">$29/month</td>
                <td className="py-4">Starts at $50/month</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-2">Ready to try LeadFlow?</h3>
          <p className="mb-4">
            See why sales teams are switching from HubSpot to LeadFlow.
          </p>
          <Link 
            href="/login?signup=true" 
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Start Free Trial
          </Link>
        </div>
      </div>
    </Layout>
  )
}