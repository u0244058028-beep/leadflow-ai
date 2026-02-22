import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function PublicLandingPage() {
  const router = useRouter()
  const { slug } = router.query
  const [page, setPage] = useState<any>(null)
  const [fields, setFields] = useState<any[]>([])
  const [formData, setFormData] = useState<any>({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (slug) loadPage()
  }, [slug])

  async function loadPage() {
    // Hent side
    const { data: pageData } = await supabase
      .from('landing_pages')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single()

    if (!pageData) {
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
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Oppdater views
    await supabase
      .from('landing_pages')
      .update({ views: (page.views || 0) + 1 })
      .eq('id', page.id)

    // Opprett lead i hovedtabellen
    const { data: newLead } = await supabase
      .from('leads')
      .insert({
        name: formData.name || formData.full_name || 'Lead from landing page',
        email: formData.email,
        phone: formData.phone,
        status: 'new',
        user_id: page.user_id
      })
      .select()
      .single()

    // Lagre form-data
    await supabase
      .from('landing_page_leads')
      .insert({
        landing_page_id: page.id,
        lead_id: newLead.id,
        form_data: formData,
        ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        user_agent: req.headers['user-agent']
      })

    // Oppdater konverteringer
    await supabase
      .from('landing_pages')
      .update({ conversions: (page.conversions || 0) + 1 })
      .eq('id', page.id)

    // Send e-post til brukeren (via egen tjeneste)
    await fetch('/api/notify-new-lead', {
      method: 'POST',
      body: JSON.stringify({
        lead: newLead,
        page: page,
        formData
      })
    })

    setSubmitted(true)
  }

  if (!page) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {submitted ? (
            <div className="text-center">
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
              <h1 className="text-2xl font-bold mb-2" style={{ color: page.primary_color }}>
                {page.title}
              </h1>
              {page.description && (
                <p className="text-gray-600 mb-6">{page.description}</p>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {fields.map(field => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium mb-1">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    {field.field_type === 'textarea' ? (
                      <textarea
                        required={field.required}
                        placeholder={field.placeholder}
                        onChange={(e) => setFormData({...formData, [field.label]: e.target.value})}
                        className="w-full border border-gray-300 rounded-md p-2"
                        rows={4}
                      />
                    ) : (
                      <input
                        type={field.field_type}
                        required={field.required}
                        placeholder={field.placeholder}
                        onChange={(e) => setFormData({...formData, [field.label]: e.target.value})}
                        className="w-full border border-gray-300 rounded-md p-2"
                      />
                    )}
                  </div>
                ))}

                <button
                  type="submit"
                  className="w-full py-3 text-white rounded-md font-medium"
                  style={{ backgroundColor: page.primary_color }}
                >
                  Submit
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}