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
    
    const { error } = await supabase
      .from('landing_pages')
      .insert({
        ...form,
        user_id: user?.id,
        slug: form.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-')
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
      <h1 className="text-2xl font-bold mb-6">Create New Landing Page</h1>
      
      <form onSubmit={handleSubmit} className="max-w-2xl bg-white rounded-lg shadow p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Page Title</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({...form, title: e.target.value})}
              className="w-full border rounded-md p-2"
              placeholder="e.g., Book a Demo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Page URL</label>
            <div className="flex items-center">
              <span className="text-gray-500 mr-2">leadflow.ai/</span>
              <input
                type="text"
                required
                value={form.slug}
                onChange={(e) => setForm({...form, slug: e.target.value})}
                className="flex-1 border rounded-md p-2"
                placeholder="my-company"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({...form, description: e.target.value})}
              className="w-full border rounded-md p-2"
              rows={3}
              placeholder="What's this page about?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Template</label>
            <select
              value={form.template}
              onChange={(e) => setForm({...form, template: e.target.value})}
              className="w-full border rounded-md p-2"
            >
              <option value="modern">Modern</option>
              <option value="minimal">Minimal</option>
              <option value="professional">Professional</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Primary Color</label>
            <input
              type="color"
              value={form.primary_color}
              onChange={(e) => setForm({...form, primary_color: e.target.value})}
              className="w-20 h-10"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Page'}
          </button>
        </div>
      </form>
    </Layout>
  )
}