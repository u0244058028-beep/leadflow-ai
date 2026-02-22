import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function PublicLandingPage() {
  const router = useRouter()
  const { slug, preview } = router.query
  const [page, setPage] = useState<any>(null)
  const [fields, setFields] = useState<any[]>([])
  const [formData, setFormData] = useState<any>({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    let timeoutId: NodeJS.Timeout

    async function loadPage() {
      if (!slug) return

      // Timeout på 5 sekunder
      timeoutId = setTimeout(() => {
        if (isMounted) {
          setError('Loading timed out. Please refresh the page.')
          setLoading(false)
        }
      }, 5000)

      try {
        let query = supabase
          .from('landing_pages')
          .select('*')
          .eq('slug', slug)

        if (!preview) {
          query = query.eq('is_published', true)
        }

        const { data: pageData, error: pageError } = await query.single()

        if (pageError) throw new Error('Page not found')
        if (!pageData) throw new Error('Page not found')

        if (isMounted) {
          setPage(pageData)

          const { data: fieldsData } = await supabase
            .from('landing_page_fields')
            .select('*')
            .eq('landing_page_id', pageData.id)
            .order('sort_order')

          setFields(fieldsData || [])
          setLoading(false)
          clearTimeout(timeoutId)
        }
        
      } catch (err: any) {
        if (isMounted) {
          setError(err.message)
          setLoading(false)
          clearTimeout(timeoutId)
        }
      }
    }

    loadPage()

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
  }, [slug, preview])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading page...</p>
        </div>
      </div>
    )
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold mb-2">Page not found</h1>
          <p className="text-gray-600 mb-4">{error || 'The page you\'re looking for doesn\'t exist'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>
    )
  }

  // Resten av koden din (form, submit, etc) er uendret...
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      {preview && !page.is_published && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 text-sm z-50">
          ⚡ Preview mode – this page is not published yet
        </div>
      )}

      <div className="max-w-2xl mx-auto pt-8">
        {/* ... resten av din eksisterende JSX ... */}
      </div>
    </div>
  )
}