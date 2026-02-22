import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Head from 'next/head'

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
      if (!slug || typeof slug !== 'string') {
        if (isMounted) {
          setError('Invalid page URL')
          setLoading(false)
        }
        return
      }

      // Timeout på 5 sekunder
      timeoutId = setTimeout(() => {
        if (isMounted) {
          setError('Loading timed out. Please refresh the page.')
          setLoading(false)
        }
      }, 5000)

      try {
        console.log('Loading page with slug:', slug)
        
        // Bygg query
        let query = supabase
          .from('landing_pages')
          .select('*')
          .eq('slug', slug)

        // Hvis ikke preview, må siden være publisert
        if (!preview) {
          query = query.eq('is_published', true)
        }

        const { data: pageData, error: pageError } = await query.single()

        if (pageError) {
          console.error('Page error:', pageError)
          throw new Error('Page not found')
        }

        if (!pageData) {
          throw new Error('Page not found')
        }

        console.log('Page loaded:', pageData)

        if (isMounted) {
          setPage(pageData)

          // Hent felter
          const { data: fieldsData, error: fieldsError } = await supabase
            .from('landing_page_fields')
            .select('*')
            .eq('landing_page_id', pageData.id)
            .order('sort_order')

          if (fieldsError) {
            console.error('Fields error:', fieldsError)
          }

          setFields(fieldsData || [])
          setLoading(false)
          clearTimeout(timeoutId)
        }
        
      } catch (err: any) {
        console.error('Error loading page:', err)
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // Oppdater views
      await supabase
        .from('landing_pages')
        .update({ views: (page.views || 0) + 1 })
        .eq('id', page.id)

      // Opprett lead
      const { data: newLead, error: leadError } = await supabase
        .from('leads')
        .insert({
          name: formData['Full Name'] || formData.name || 'Lead from landing page',
          email: formData['Email Address'] || formData.email || null,
          phone: formData['Phone Number'] || formData.phone || null,
          status: 'new',
          user_id: page.user_id
        })
        .select()
        .single()

      if (leadError) throw leadError

      // Hent IP og user agent
      const ipResponse = await fetch('/api/get-client-info')
      const { ipAddress, userAgent } = await ipResponse.json()

      // Lagre form-data
      await supabase
        .from('landing_page_leads')
        .insert({
          landing_page_id: page.id,
          lead_id: newLead.id,
          form_data: formData,
          ip_address: ipAddress,
          user_agent: userAgent
        })

      // Oppdater konverteringer
      await supabase
        .from('landing_pages')
        .update({ conversions: (page.conversions || 0) + 1 })
        .eq('id', page.id)

      // Send varsel
      await fetch('/api/notify-new-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead: newLead, page, formData })
      })

      setSubmitted(true)
      
    } catch (error: any) {
      console.error('Error:', error)
      alert('Something went wrong: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

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
          <a href="/" className="text-blue-600 hover:underline">Go home</a>
        </div>
      </div>
    )
  }

  // Hent settings fra AI-genererte sider
  const settings = page.settings || {}
  const benefits = settings.benefits || []
  const trustElements = settings.trustElements || [
    'No credit card required',
    '14-day free trial',
    'Cancel anytime'
  ]
  const buttonText = settings.buttonText || 'Submit'

  return (
    <>
      <Head>
        <title>{page.title} | LeadFlow</title>
        <meta name="description" content={page.description || 'Landing page'} />
      </Head>

      <div className="min-h-screen bg-gray-50 py-12 px-4">
        {preview && !page.is_published && (
          <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 text-sm z-50">
            ⚡ Preview mode – this page is not published yet
          </div>
        )}

        <div className="max-w-2xl mx-auto pt-8">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-8" style={{ backgroundColor: '#f9fafb' }}>
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
                  <p className="text-gray-600">We'll be in touch soon.</p>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: page.primary_color }}>
                    {page.title}
                  </h1>
                  {page.description && (
                    <p className="text-xl text-gray-600 mb-6">{page.description}</p>
                  )}

                  {benefits.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                      {benefits.map((benefit: string, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-green-500 text-xl">✓</span>
                          <span className="text-sm">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 shadow-md">
                    {fields.map(field => (
                      <div key={field.id} className="mb-4">
                        <label className="block text-sm font-medium mb-1">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        {field.field_type === 'textarea' ? (
                          <textarea
                            required={field.required}
                            placeholder={field.placeholder}
                            onChange={(e) => setFormData({...formData, [field.label]: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={4}
                          />
                        ) : (
                          <input
                            type={field.field_type}
                            required={field.required}
                            placeholder={field.placeholder}
                            onChange={(e) => setFormData({...formData, [field.label]: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        )}
                      </div>
                    ))}

                    <button
                      type="submit"
                      className="w-full py-3 text-white rounded-lg font-medium transition hover:opacity-90"
                      style={{ backgroundColor: page.primary_color }}
                    >
                      {buttonText}
                    </button>
                  </form>

                  <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-gray-500">
                    {trustElements.map((el: string, i: number) => (
                      <span key={i}>🔒 {el}</span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}