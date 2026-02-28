// pages/guides/ai-lead-scoring.tsx
import Link from 'next/link'
import Layout from '@/components/Layout'
import SEO from '@/components/SEO'

export default function AILeadScoringGuide() {
  return (
    <Layout>
      <SEO 
        title="AI Lead Scoring Guide: How to Prioritize Leads with Machine Learning"
        description="Complete guide to AI lead scoring. Learn how machine learning can predict which leads will convert and how to implement it in your sales process."
        keywords="AI lead scoring guide, machine learning lead scoring, lead prioritization"
        ogType="article"
      />

      <div className="max-w-4xl mx-auto py-12 px-4">
        <Link href="/guides" className="text-blue-600 hover:underline mb-4 block">
          ← All Guides
        </Link>

        <h1 className="text-4xl font-bold mb-4">AI Lead Scoring Guide</h1>
        <p className="text-xl text-gray-600 mb-8">
          How to use machine learning to prioritize leads and increase conversion rates
        </p>

        <div className="prose prose-lg max-w-none">
          <h2>What You'll Learn</h2>
          <ul>
            <li>What AI lead scoring is and why it matters</li>
            <li>How machine learning models predict lead conversion</li>
            <li>Implementation strategies for sales teams</li>
            <li>Real-world results and case studies</li>
          </ul>

          <h2>Introduction to AI Lead Scoring</h2>
          <p>
            Lead scoring has been a cornerstone of sales and marketing for decades. 
            The idea is simple: assign a numerical value to each lead based on their 
            likelihood to become a customer. But traditional lead scoring methods 
            have significant limitations...
          </p>

          {/* Mer innhold her */}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 my-8">
            <h3 className="text-xl font-semibold mb-2">Ready to try AI lead scoring?</h3>
            <p className="mb-4">
              Start your 14-day free trial of LeadFlow and see the difference AI makes.
            </p>
            <Link 
              href="/login?signup=true" 
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}