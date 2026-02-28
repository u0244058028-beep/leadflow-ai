// pages/blog/index.tsx
import Link from 'next/link'
import Layout from '@/components/Layout'
import SEO from '@/components/SEO'

const blogPosts = [
  {
    slug: 'ai-lead-scoring-guide-2026',
    title: 'The Complete Guide to AI Lead Scoring in 2026',
    excerpt: 'Learn how AI-powered lead scoring can increase your conversion rates by 300%. Complete guide with examples and best practices.',
    date: '2026-03-01',
    author: 'Tor Arne Storesund',
    readTime: '12 min'
  },
  {
    slug: 'why-traditional-lead-scoring-fails',
    title: 'Why Traditional Lead Scoring Fails (And What to Do Instead)',
    excerpt: 'Static rules and manual processes are letting your best leads slip away. Here\'s why AI is the answer.',
    date: '2026-02-15',
    author: 'Tor Arne Storesund',
    readTime: '8 min'
  },
  {
    slug: '10-ways-ai-doubles-sales-productivity',
    title: '10 Ways AI Can Double Your Sales Team\'s Productivity',
    excerpt: 'From automated follow-ups to intelligent lead prioritization, discover how AI transforms sales teams.',
    date: '2026-02-01',
    author: 'Tor Arne Storesund',
    readTime: '10 min'
  }
]

export default function BlogIndex() {
  return (
    <Layout>
      <SEO 
        title="AI Lead Scoring Blog - Sales Automation Tips"
        description="Expert guides on AI lead scoring, sales automation, and lead generation. Learn how to convert more leads with AI-powered tools."
        keywords="AI lead scoring blog, sales automation tips, lead generation strategies"
      />

      <div className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold mb-4">LeadFlow Blog</h1>
        <p className="text-xl text-gray-600 mb-12">
          Expert insights on AI lead scoring, sales automation, and converting more customers.
        </p>

        <div className="space-y-8">
          {blogPosts.map((post) => (
            <article key={post.slug} className="border-b border-gray-200 pb-8">
              <Link href={`/blog/${post.slug}`} className="block group">
                <h2 className="text-2xl font-semibold text-gray-900 group-hover:text-blue-600 mb-2">
                  {post.title}
                </h2>
                <p className="text-gray-600 mb-3">{post.excerpt}</p>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span>{post.date}</span>
                  <span>•</span>
                  <span>{post.author}</span>
                  <span>•</span>
                  <span>{post.readTime} read</span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </Layout>
  )
}