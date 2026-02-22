import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Layout from '@/components/Layout'
import Link from 'next/link'

export default function LandingPages() {
  const [pages, setPages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPages()
  }, [])

  async function loadPages() {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return

    const { data } = await supabase
      .from('landing_pages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setPages(data || [])
    setLoading(false)
  }

  async function togglePublish(pageId: string, current: boolean) {
    await supabase
      .from('landing_pages')
      .update({ 
        is_published: !current,
        published_at: !current ? new Date().toISOString() : null
      })
      .eq('id', pageId)
    loadPages()
  }

  async function deletePage(pageId: string) {
    if (!confirm('Are you sure? This will delete the page and all its leads.')) return
    await supabase.from('landing_pages').delete().eq('id', pageId)
    loadPages()
  }

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Landing Pages</h1>
        <div className="flex gap-2">
          <Link
            href="/landing-pages/ai-generate"
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:opacity-90 flex items-center gap-2"
          >
            🤖 AI Generate
          </Link>
          <Link
            href="/landing-pages/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + Create Manually
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading pages...</p>
        </div>
      ) : pages.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 mb-4">You haven't created any landing pages yet.</p>
          <div className="flex gap-2 justify-center">
            <Link
              href="/landing-pages/ai-generate"
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:opacity-90"
            >
              🤖 Generate with AI
            </Link>
            <Link
              href="/landing-pages/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create manually
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {pages.map(page => (
            <div key={page.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{page.title}</h3>
                  <p className="text-sm text-gray-500">
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                      myleadassistant.com/s/{page.slug}
                    </span>
                  </p>
                  <div className="flex gap-4 mt-2 text-sm text-gray-600">
                    <span>👁️ {page.views || 0} views</span>
                    <span>✓ {page.conversions || 0} conversions</span>
                    <span>📅 {new Date(page.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => togglePublish(page.id, page.is_published)}
                    className={`px-3 py-1 rounded-md text-sm ${
                      page.is_published
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {page.is_published ? 'Published' : 'Draft'}
                  </button>
                  <Link
                    href={`/landing-pages/${page.id}`}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => {
                      if (page.is_published) {
                        window.open(`https://myleadassistant.com/s/${page.slug}`, '_blank')
                      } else {
                        alert('Publish the page first to view it')
                      }
                    }}
                    className={`px-3 py-1 rounded-md text-sm ${
                      page.is_published
                        ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                    disabled={!page.is_published}
                  >
                    View
                  </button>
                  <button
                    onClick={() => deletePage(page.id)}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}