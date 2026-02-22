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

  useEffect(() => {
    if (slug) loadPage()
  }, [slug, preview])

  async function loadPage() {
    setLoading(true)
    
    let query = supabase
      .from('landing_pages')
      .select('*')
      .eq('slug', slug)

    // Hvis det er preview, kan vi vise selv om den ikke er publisert
    if (!preview) {
      query = query.eq('is_published', true)
    }

    const { data: pageData, error: pageError } = await query.single()

    if (pageError || !pageData) {
      router.push('/404')
      return
    }

    setPage(pageData)

    // Hent felt
    const { data: fieldsData } = await supabase
      .from('landing_page_fields')
      .select('*')
      .eq('landing_page_id', pageData.id)
      .order('sort_order')

    setFields(fieldsData || [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      // Oppdater views
      await supabase
        .from('landing_pages')
        .update({ views: (page.views || 0) + 1 })
        .eq('id', page.id)

      // Opprett lead i hovedtabellen
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

      // Hent IP og user agent via API
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

      // Send e-post til brukeren
      await fetch('/api/notify-new-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead: newLead,
          page: page,
          formData
        })
      })

      setSubmitted(true)
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Something went wrong. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!page) return null

  // Hent settings hvis de finnes (fra AI-genererte sider)
  const settings = page.settings || {}
  const benefits = settings.benefits || []
  const trustElements = settings.trustElements || [
    'No credit card required',
    '14-day free trial',
    'Cancel anytime'
  ]
  const cta = settings.cta || 'Get Started Now'
  const buttonText = settings.buttonText || 'Submit'

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      {/* Preview-banner hvis det er draft */}
      {preview && !page.is_published && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 text-sm z-50">
          ⚡ Preview mode – this page is not published yet
        </div>
      )}

      <div className="max-w-2xl mx-auto pt-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header med farge */}
          <div className="p-8" style={{ backgroundColor: '#f9fafb' }}>
            <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: page.primary_color }}>
              {page.title}
            </h1>
            {page.description && (
              <p className="text-xl text-gray-600 mb-6">{page.description}</p>
            )}

            {/* Benefits hvis de finnes */}
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

            {/* Form */}
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

            {/* Trust elements */}
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-gray-500">
              {trustElements.map((el: string, i: number) => (
                <span key={i}>🔒 {el}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}