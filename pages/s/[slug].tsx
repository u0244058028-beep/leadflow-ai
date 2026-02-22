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
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null) // NY: for feilmelding uten dialog

  useEffect(() => {
    if (slug) {
      loadPage()
    }
  }, [slug, preview])

  async function loadPage() {
    setLoading(true)
    setError(null)

    try {
      console.log('🚀 Loading page with slug:', slug)

      let query = supabase
        .from('landing_pages')
        .select('*')
        .eq('slug', slug)

      if (!preview) {
        query = query.eq('is_published', true)
      }

      const { data: pageData, error: pageError } = await query.single()

      if (pageError) {
        console.error('❌ Page error:', pageError)
        throw new Error('Page not found')
      }

      if (!pageData) {
        throw new Error('Page not found')
      }

      console.log('✅ Page loaded:', pageData)
      setPage(pageData)

      // Hent felter
      console.log('📋 Loading fields for page:', pageData.id)
      
      const { data: fieldsData, error: fieldsError } = await supabase
        .from('landing_page_fields')
        .select('*')
        .eq('landing_page_id', pageData.id)
        .order('sort_order')

      if (fieldsError) {
        console.error('❌ Fields error:', fieldsError)
      }

      if (fieldsData && fieldsData.length > 0) {
        console.log('✅ Fields loaded:', fieldsData.length)
        setFields(fieldsData)
      } else {
        console.log('⚠️ No fields found, using defaults')
        setFields([
          {
            id: 'default-name',
            field_type: 'text',
            label: 'Full Name',
            placeholder: 'John Doe',
            required: true
          },
          {
            id: 'default-email',
            field_type: 'email',
            label: 'Email Address',
            placeholder: 'john@company.com',
            required: true
          }
        ])
      }
      
    } catch (err: any) {
      console.error('❌ Error loading page:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError(null) // Nullstill feilmelding
    
    try {
      console.log('📝 Form submitted with data:', formData)

      // Valider at vi har epost
      const email = formData['Email Address'] || formData.email
      if (!email) {
        throw new Error('Email is required')
      }

      // Forbered lead data
      const leadData = {
        name: formData['Full Name'] || formData.name || 'Lead from landing page',
        email: email,
        title: formData['Job Title'] || null,
        company: formData['Company'] || null,
        phone: formData['Phone'] || null,
        industry: formData['Industry'] || null,
        company_size: formData['Company Size'] || null,
        status: 'new',
        user_id: page.user_id,
        source: `landing_page_${page.slug}`
      }

      console.log('💾 Attempting to create lead:', leadData)

      // 1. Opprett lead
      const { data: newLead, error: leadError } = await supabase
        .from('leads')
        .insert(leadData)
        .select()
        .single()

      if (leadError) {
        console.error('❌ Lead creation error details:', {
          message: leadError.message,
          details: leadError.details,
          hint: leadError.hint,
          code: leadError.code
        })
        throw new Error('Could not save your information. Please try again.')
      }

      console.log('✅ Lead created successfully:', newLead)

      // 2. Hent IP og user agent
      let ipAddress = 'Unknown'
      let userAgent = 'Unknown'
      
      try {
        const ipResponse = await fetch('/api/get-client-info')
        const ipData = await ipResponse.json()
        ipAddress = ipData.ipAddress || 'Unknown'
        userAgent = ipData.userAgent || 'Unknown'
        console.log('🌐 Client info:', { ipAddress, userAgent })
      } catch (ipError) {
        console.error('⚠️ Could not get client info:', ipError)
      }

      // 3. Lagre landing page lead data
      const { error: formError } = await supabase
        .from('landing_page_leads')
        .insert({
          landing_page_id: page.id,
          lead_id: newLead.id,
          form_data: formData,
          ip_address: ipAddress,
          user_agent: userAgent
        })

      if (formError) {
        console.error('⚠️ Form data storage error:', formError)
        // Ikke kritisk, fortsett
      } else {
        console.log('✅ Landing page lead data saved')
      }

      // 4. Oppdater views og conversions
      const { error: updateError } = await supabase
        .from('landing_pages')
        .update({ 
          views: (page.views || 0) + 1,
          conversions: (page.conversions || 0) + 1 
        })
        .eq('id', page.id)

      if (updateError) {
        console.error('⚠️ Could not update page stats:', updateError)
      } else {
        console.log('✅ Page stats updated')
      }

      // 5. Send varsel (fire and forget)
      fetch('/api/notify-new-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          lead: newLead, 
          page: {
            id: page.id,
            title: page.title,
            user_id: page.user_id
          }, 
          formData 
        })
      }).catch(err => console.error('⚠️ Notification error:', err))

      console.log('🎉 All done! Redirecting to thank you page...')
      setSubmitted(true)
      
    } catch (error: any) {
      console.error('❌ Submit error:', error)
      // Vis feilmelding i UI i stedet for alert
      setSubmitError(error.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
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

  if (error || !page) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold mb-2">Page not found</h1>
          <p className="text-gray-600 mb-4">
            {error || 'The page you\'re looking for doesn\'t exist'}
          </p>
          <a href="/" className="text-blue-600 hover:underline">
            Go to LeadFlow
          </a>
        </div>
      </div>
    )
  }

  const settings = page.settings || {}
  const benefits = settings.benefits || []
  const trustElements = settings.trustElements || [
    'No spam, unsubscribe anytime',
    'We respect your privacy'
  ]
  const buttonText = settings.buttonText || 'Submit'
  const offer = settings.offer || ''

  return (
    <>
      <Head>
        <title>{page.title} | LeadFlow</title>
        <meta name="description" content={page.description || 'Landing page'} />
        <meta name="robots" content="index, follow" />
      </Head>

      <div className="min-h-screen bg-gray-50 py-12 px-4">
        {preview && !page.is_published && (
          <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 text-sm z-50">
            ⚡ Preview mode – this page is not published yet
          </div>
        )}

        <div className="max-w-2xl mx-auto">
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
                  <p className="text-gray-600">Check your inbox – we've sent you the {offer}.</p>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: page.primary_color }}>
                    {page.title}
                  </h1>
                  
                  {page.description && (
                    <p className="text-xl text-gray-600 mb-6">{page.description}</p>
                  )}

                  {offer && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-center">
                      <span className="text-lg font-semibold text-blue-800">🎁 {offer}</span>
                    </div>
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

                  {/* Feilmelding – vises uten dialogboks */}
                  {submitError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                      ⚠️ {submitError}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 shadow-md">
                    {fields.map((field) => (
                      <div key={field.id} className="mb-4">
                        <label className="block text-sm font-medium mb-1">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type={field.field_type}
                          required={field.required}
                          placeholder={field.placeholder}
                          value={formData[field.label] || ''}
                          onChange={(e) => setFormData({...formData, [field.label]: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={submitting}
                        />
                      </div>
                    ))}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 text-white rounded-lg font-medium transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      style={{ backgroundColor: page.primary_color }}
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Sending...
                        </>
                      ) : (
                        buttonText
                      )}
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