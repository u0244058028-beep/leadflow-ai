// pages/blog/[slug].tsx
import { useRouter } from 'next/router'
import Link from 'next/link'
import Layout from '@/components/Layout'
import SEO from '@/components/SEO'

// Dette ville normalt komme fra en database
const blogPosts = {
  'ai-lead-scoring-guide-2026': {
    title: 'The Complete Guide to AI Lead Scoring in 2026',
    description: 'Learn how AI-powered lead scoring can increase your conversion rates by 300%. Complete guide with examples, best practices, and implementation tips.',
    keywords: 'AI lead scoring, lead scoring guide, sales automation, lead qualification',
    content: `
      <p class="lead">Lead scoring has been around for decades, but AI has transformed it from a manual, error-prone process into an automated, highly accurate system. In this guide, we'll show you exactly how AI lead scoring works and how you can implement it to increase your conversion rates.</p>
      
      <h2>What is AI Lead Scoring?</h2>
      <p>AI lead scoring uses machine learning algorithms to analyze historical data and predict which leads are most likely to convert. Unlike traditional rule-based scoring, AI adapts and improves over time, learning from your actual results.</p>
      
      <h2>Why Traditional Lead Scoring Fails</h2>
      <p>Traditional lead scoring relies on static rules: "If title contains 'CTO', add 10 points." But this approach misses crucial context and doesn't adapt to changing market conditions.</p>
      
      <h2>Benefits of AI Lead Scoring</h2>
      <ul>
        <li><strong>300% higher conversion rates</strong> - Sales teams focus on the right leads</li>
        <li><strong>80% less time wasted</strong> - No more manual qualification</li>
        <li><strong>Real-time adaptation</strong> - The model learns from every interaction</li>
        <li><strong>Objective decisions</strong> - No human bias in lead prioritization</li>
      </ul>
      
      <h2>How LeadFlow's AI Scoring Works</h2>
      <p>Our AI analyzes multiple factors including job title, company size, industry, engagement with your emails, and behavior on your landing pages. Each lead gets a score from 1-10, with clear explanations of why they received that score.</p>
      
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 my-8">
        <h3 class="text-xl font-semibold mb-2">Try LeadFlow's AI Lead Scoring Free</h3>
        <p class="mb-4">See for yourself how AI can transform your sales process. Start your 14-day free trial today.</p>
        <a href="/login?signup=true" class="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Start Free Trial</a>
      </div>
    `,
    date: '2026-03-01',
    author: 'Tor Arne Storesund'
  }
}

export default function BlogPost() {
  const router = useRouter()
  const { slug } = router.query
  const post = blogPosts[slug as string]

  if (!post) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h1 className="text-2xl">Post not found</h1>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <SEO 
        title={post.title}
        description={post.description}
        keywords={post.keywords}
        ogType="article"
        publishedTime={post.date}
        author={post.author}
      />

      <article className="max-w-4xl mx-auto py-12 px-4">
        <Link href="/blog" className="text-blue-600 hover:underline mb-4 block">
          ← Back to Blog
        </Link>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
        
        <div className="flex items-center gap-4 text-gray-600 mb-8">
          <span>{post.date}</span>
          <span>•</span>
          <span>{post.author}</span>
        </div>

        <div 
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </Layout>
  )
}