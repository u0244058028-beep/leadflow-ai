import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import Layout from '@/components/Layout'

export default function NewLandingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    template: 'modern',
    primary_color: '#3b82f6'
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const user = (await supabase.auth.getUser()).data.user
    
    // Generer slug fra title hvis ikke fylt ut
    const finalSlug = form.slug || form.title
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    const { error } = await supabase
      .from('landing_pages')
      .insert({
        title: form.title,
        slug: finalSlug,
        description: form.description,
        template: form.template,
        primary_color: form.primary_color,
        user_id: user?.id
      })

    if (!error) {
      router.push('/landing-pages')
    } else {
      alert('Error: ' + error.message)
    }
    setLoading(false)
  }

  return (
    <Layout>
      <div className="mb-4">
        <button 
          onClick={() => router.back()} 
          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          ← Back
        </button>
      </div>

      <h1 className="text-2xl font-bold mb-6">Create New Landing Page</h1>
      
      <form onSubmit={handleSubmit} className="max-w-2xl bg-white rounded-lg shadow p-6">
        <div className="space-y-4">
          {/* Page Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Page Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({...form, title: e.target.value})}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Book a Demo"
            />
          </div>

          {/* Page URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Page URL <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center">
              <span className="text-gray-500 bg-gray-100 px-3 py-2 rounded-l-md border border-r-0 border-gray-300">
                myleadassistant.com/
              </span>
              <input
                type="text"
                required
                value={form.slug}
                onChange={(e) => setForm({...form, slug: e.target.value})}
                className="flex-1 border border-gray-300 rounded-r-md p-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="my-company"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Your page will be available at: <strong>myleadassistant.com/s/{form.slug || 'your-page'}</strong>
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({...form, description: e.target.value})}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="What's this page about?"
            />
          </div>

          {/* Template */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template
            </label>
            <select
              value={form.template}
              onChange={(e) => setForm({...form, template: e.target.value})}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="modern">Modern</option>
              <option value="minimal">Minimal</option>
              <option value="professional">Professional</option>
            </select>
          </div>

          {/* Primary Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Primary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.primary_color}
                onChange={(e) => setForm({...form, primary_color: e.target.value})}
                className="w-12 h-10 border border-gray-300 rounded"
              />
              <span className="text-sm text-gray-600">{form.primary_color}</span>
            </div>
          </div>

          {/* Submit button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Page'}
            </button>
          </div>
        </div>
      </form>
    </Layout>
  )
}