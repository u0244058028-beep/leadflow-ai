import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Head from 'next/head'

// VIKTIG: Dette kjører på SERVEREN hver gang, ingen caching!
export async function getServerSideProps(context: any) {
  const { slug, preview } = context.query
  
  try {
    console.log('🔵 [SERVER] Loading page with slug:', slug)
    console.log('🔵 [SERVER] Preview mode:', preview)

    let query = supabase
      .from('landing_pages')
      .select('*')
      .eq('slug', slug)

    if (!preview) {
      query = query.eq('is_published', true)
    }

    const { data: pageData, error: pageError } = await query.single()

    if (pageError || !pageData) {
      return {
        notFound: true
      }
    }

    // Hent felter
    const { data: fieldsData } = await supabase
      .from('landing_page_fields')
      .select('*')
      .eq('landing_page_id', pageData.id)
      .order('sort_order')

    // Returner data som props til komponenten
    return {
      props: {
        page: pageData,
        fields: fieldsData || [],
        slug,
        preview: preview || null
      }
    }
  } catch (error) {
    console.error('Error in getServerSideProps:', error)
    return {
      notFound: true
    }
  }
}

export default function PublicLandingPage({ page, fields: initialFields, slug, preview }: any) {
  const router = useRouter()
  const [fields, setFields] = useState(initialFields)
  const [formData, setFormData] = useState<any>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Hvis sidene ikke finnes (404), vises notFound-siden automatisk
  if (!page) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const email = formData['Email Address'] || formData.email
      if (!email) throw new Error('Email is required')

      const leadData = {
        name: formData['Full Name'] || formData.name || 'Lead from landing page',
        email: email,
        title: formData['Job Title (optional)'] || formData['Job Title'] || null,
        company: formData['Company (optional)'] || formData['Company'] || null,
        phone: formData['Phone (optional)'] || formData['Phone'] || null,
        industry: formData['Industry (optional)'] || formData['Industry'] || null,
        status: 'new',
        user_id: page.user_id,
        source: `landing_page_${page.slug}`
      }

      const response = await fetch('/api/create-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadData, pageId: page.id, formData })
      })

      if (!response.ok) throw new Error('Could not save your information')

      // Send bekreftelse
      await fetch('/api/send-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          name: leadData.name, 
          offer: page.settings?.offer || 'Free Resource' 
        })
      })

      // Oppdater statistikk
      await supabase
        .from('landing_pages')
        .update({ 
          views: (page.views || 0) + 1,
          conversions: (page.conversions || 0) + 1 
        })
        .eq('id', page.id)

      setSubmitted(true)
      
    } catch (error: any) {
      console.error('Submit error:', error)
      alert(error.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  // Hent ALLE data fra settings
  const settings = page.settings || {}
  const benefits = settings.benefits || settings.longBenefits || []
  const trustElements = settings.trustElements || ['No spam', 'We respect your privacy']
  const buttonText = settings.buttonText || 'Submit'
  const offer = settings.offer || ''
  const fullDescription = settings.fullDescription || page.description || ''
  const headline = settings.headline || page.title || ''
  const subheadline = settings.subheadline || page.description || ''

  return (
    <>
      <Head>
        <title>{headline} | LeadFlow</title>
        <meta name="description" content={subheadline} />
        <meta name="robots" content={preview ? 'noindex' : 'index, follow'} />
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
                  <p className="text-gray-600 mb-4">
                    We've received your request. You'll hear from us within 24 hours.
                  </p>
                  <p className="text-sm text-gray-500">
                    A confirmation email has been sent to your inbox.
                  </p>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: page.primary_color }}>
                    {headline}
                  </h1>
                  
                  {subheadline && (
                    <p className="text-xl text-gray-600 mb-6">{subheadline}</p>
                  )}

                  {fullDescription && (
                    <p className="text-gray-700 mb-8">{fullDescription}</p>
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

                  <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 shadow-md">
                    {fields.map((field: any) => (
                      <div key={field.id} className="mb-4">
                        <label className="block text-sm font-medium mb-1">
                          {field.label} 
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                          {!field.required && <span className="text-gray-400 text-xs ml-2">(optional)</span>}
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
                      className="w-full py-3 text-white rounded-lg font-medium transition hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: page.primary_color }}
                    >
                      {submitting ? 'Sending...' : buttonText}
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