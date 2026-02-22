import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Layout from '@/components/Layout'
import Link from 'next/link'

export default function LandingPages() {
  const [pages, setPages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [initialLoad, setInitialLoad] = useState(true)

  // Bruk useCallback for å unngå at funksjonen gjenopprettes
  const loadPages = useCallback(async () => {
    // Unngå å laste hvis allerede laster
    if (loading && !initialLoad) return
    
    try {
      setError(null)
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('Please log in to view your pages')
        setLoading(false)
        setInitialLoad(false)
        return
      }

      const { data, error: pagesError } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .timeout(10000) // 10 sekunders timeout

      if (pagesError) throw pagesError

      setPages(data || [])
      
    } catch (err: any) {
      console.error('Error loading pages:', err)
      setError(err?.message || 'Failed to load pages')
    } finally {
      setLoading(false)
      setInitialLoad(false)
    }
  }, []) // Tom avhengighetsliste = kjører bare én gang

  useEffect(() => {
    let isMounted = true
    let timeoutId: NodeJS.Timeout

    const loadWithTimeout = async () => {
      // Timeout på 5 sekunder – hvis ikke ferdig, vis feil
      timeoutId = setTimeout(() => {
        if (isMounted && loading) {
          setError('Loading timed out. Please try again.')
          setLoading(false)
          setInitialLoad(false)
        }
      }, 5000)

      await loadPages()
    }

    if (initialLoad) {
      loadWithTimeout()
    }

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
  }, [initialLoad, loadPages])

  async function togglePublish(pageId: string, current: boolean) {
    try {
      const { error } = await supabase
        .from('landing_pages')
        .update({ 
          is_published: !current,
          published_at: !current ? new Date().toISOString() : null
        })
        .eq('id', pageId)

      if (error) throw error
      
      // Oppdater lokal state – unngår ny innlasting
      setPages(prev => prev.map(p => 
        p.id === pageId ? { ...p, is_published: !current } : p
      ))
      
    } catch (err: any) {
      alert('Failed to update: ' + err.message)
    }
  }

  async function deletePage(pageId: string) {
    if (!confirm('Are you sure? This will delete the page and all its leads.')) return
    
    try {
      const { error } = await supabase
        .from('landing_pages')
        .delete()
        .eq('id', pageId)

      if (error) throw error
      
      // Fjern fra lokal state
      setPages(prev => prev.filter(p => p.id !== pageId))
      
    } catch (err: any) {
      alert('Failed to delete: ' + err.message)
    }
  }

  const openPreview = (slug: string, isPublished: boolean) => {
    const url = isPublished 
      ? `/s/${slug}`
      : `/s/${slug}?preview=true`
    window.open(url, '_blank')
  }

  // Vis loading med timeout-indikator
  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading your landing pages...</p>
            <p className="text-xs text-gray-400 mt-2">This should only take a few seconds</p>
          </div>
        </div>
      </Layout>
    )
  }

  // Vis feilmelding med retry-knapp
  if (error) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-red-600 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold mb-2">Could not load pages</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => {
                setLoading(true)
                setError(null)
                setInitialLoad(true)
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Try again
            </button>
          </div>
        </div>
      </Layout>
    )
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

      {pages.length === 0 ? (
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
            <div key={page.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{page.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
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
                    className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                      page.is_published
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {page.is_published ? 'Published' : 'Draft'}
                  </button>

                  <Link
                    href={`/landing-pages/${page.id}`}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200 transition"
                  >
                    Edit
                  </Link>

                  <button
                    onClick={() => openPreview(page.slug, page.is_published)}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-md text-sm hover:bg-purple-200 transition"
                  >
                    {page.is_published ? 'View' : 'Preview'}
                  </button>

                  <button
                    onClick={() => deletePage(page.id)}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200 transition"
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