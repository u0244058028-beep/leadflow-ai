import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import Layout from '@/components/Layout'

export default function AIGeneratePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'generating' | 'preview'>('form')
  const [generatedPage, setGeneratedPage] = useState<any>(null)
  const [description, setDescription] = useState('')
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return

    const { data } = await supabase
      .from('profiles')
      .select('full_name, company_name, industry, target_audience, default_offer')
      .eq('id', user.id)
      .single()

    if (data) {
      setProfile(data)
    }
  }

  async function generateWithAI() {
    if (!description.trim()) {
      alert('Please describe what you want to offer')
      return
    }

    setLoading(true)
    setStep('generating')
    
    try {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) {
        alert('You must be logged in')
        return
      }

      // Hent oppdatert profil hvis ikke allerede lastet
      let currentProfile = profile
      if (!currentProfile) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, company_name, industry, target_audience, default_offer')
          .eq('id', user.id)
          .single()
        currentProfile = data
      }

      // 🎯 PROMPT MED BRUKERKONTEKST – OPTIMERT FOR CLAUDE
      const prompt = `You are an expert copywriter specializing in high-converting landing pages.

CONTEXT:
- Business: ${currentProfile?.company_name || 'Unknown'}
- Industry: ${currentProfile?.industry || 'Unknown'}
- Target audience: ${currentProfile?.target_audience || 'professionals'}
- Your task: Create a landing page based on this request: "${description}"

REQUIREMENTS:
1. Create a compelling headline that grabs attention
2. Include a clear offer or lead magnet
3. List 3 specific benefits (not generic features)
4. Form should have: Full Name (required), Email (required), and 2-3 optional fields (Job Title, Company, Phone, Industry)
5. Button text should be action-oriented
6. Tone should be professional and trustworthy

Return ONLY valid JSON in this exact format:
{
  "title": "Headline (max 10 words)",
  "subheadline": "Supporting line explaining the value",
  "description": "2-3 sentences about what they'll get",
  "offer": "The specific thing they're offering (e.g., 'Free Guide', '14-Day Trial', 'Demo')",
  "benefits": ["Benefit 1", "Benefit 2", "Benefit 3"],
  "fields": [
    { "type": "text", "label": "Full Name", "placeholder": "John Doe", "required": true },
    { "type": "email", "label": "Email Address", "placeholder": "john@company.com", "required": true }
  ],
  "buttonText": "Get My [Offer] Now",
  "trustElements": ["No spam, unsubscribe anytime", "We respect your privacy"]
}`

      console.log('Calling Claude via Puter.ai...')
      
      const response = await window.puter.ai.chat(prompt, {
        model: 'claude-sonnet-4',  // 🔥 Claude-modellen!
        temperature: 0.7,
        max_tokens: 2000
      })

      console.log('Claude response:', response)

      // Parse JSON
      let aiSuggestion
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          aiSuggestion = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('No JSON found')
        }
      } catch (e) {
        console.error('Error parsing AI response:', e)
        
        // Intelligent fallback
        const words = description.toLowerCase()
        let offer = 'Free Guide'
        let title = 'Free Guide: How to Master Your Business'
        let buttonText = 'Get My Free Guide'
        let benefits = [
          'Proven strategies that work',
          'Expert insights and tips',
          'Practical templates included'
        ]
        
        if (words.includes('consult') || words.includes('strategy')) {
          offer = 'Free Strategy Session'
          title = 'Book Your Free 30-Minute Strategy Call'
          buttonText = 'Book My Free Session'
        } else if (words.includes('demo')) {
          offer = 'Free Personalized Demo'
          title = 'See How Our Solution Can Help You'
          buttonText = 'Get My Free Demo'
        } else if (words.includes('webinar')) {
          offer = 'Free Webinar Access'
          title = 'Join Our Exclusive Free Webinar'
          buttonText = 'Save My Seat'
        } else if (words.includes('checklist')) {
          offer = 'Free Ultimate Checklist'
          title = 'The Complete Checklist for Success'
          buttonText = 'Get My Free Checklist'
        } else if (words.includes('trial') || words.includes('14 days')) {
          offer = '14-Day Free Trial'
          title = 'Try Our Product Free for 14 Days'
          buttonText = 'Start My Free Trial'
        }
        
        aiSuggestion = {
          title: title,
          subheadline: `The ultimate resource for ${currentProfile?.target_audience || 'professionals'}`,
          description: `Get instant access and start seeing results today.`,
          offer: offer,
          benefits: benefits,
          fields: [
            { type: 'text', label: 'Full Name', placeholder: 'John Doe', required: true },
            { type: 'email', label: 'Email Address', placeholder: 'john@company.com', required: true },
            { type: 'text', label: 'Job Title (optional)', placeholder: 'e.g., CEO', required: false },
            { type: 'text', label: 'Company (optional)', placeholder: 'e.g., Acme Inc', required: false }
          ],
          buttonText: buttonText,
          trustElements: [
            'No spam, unsubscribe anytime',
            'We respect your privacy'
          ]
        }
      }

      // Sikre at alle nødvendige felt finnes
      const safePage = {
        title: aiSuggestion?.title || 'Free Resource',
        subheadline: aiSuggestion?.subheadline || 'Get access now',
        description: aiSuggestion?.description || 'Fill out the form to get instant access.',
        offer: aiSuggestion?.offer || 'Free Resource',
        benefits: Array.isArray(aiSuggestion?.benefits) ? aiSuggestion.benefits : [
          'Save time',
          'Expert insights',
          'Practical tips'
        ],
        fields: Array.isArray(aiSuggestion?.fields) ? aiSuggestion.fields : [
          { type: 'text', label: 'Full Name', placeholder: 'John Doe', required: true },
          { type: 'email', label: 'Email Address', placeholder: 'john@company.com', required: true }
        ],
        buttonText: aiSuggestion?.buttonText || 'Get Access',
        trustElements: Array.isArray(aiSuggestion?.trustElements) ? aiSuggestion.trustElements : [
          'No spam, unsubscribe anytime',
          'We respect your privacy'
        ]
      }

      // Generer slug fra beskrivelsen
      const slug = description
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50) || 'my-offer'

      setGeneratedPage({
        ...safePage,
        primaryColor: '#3b82f6',
        template: 'modern',
        slug: slug
      })

      setStep('preview')
      
    } catch (error: any) {
      console.error('AI generation error:', error)
      alert('Failed to generate page: ' + error.message)
      setStep('form')
    } finally {
      setLoading(false)
    }
  }

  async function savePage() {
    if (!generatedPage) return
    
    setLoading(true)
    try {
      const user = (await supabase.auth.getUser()).data.user
      
      // Generer unik slug
      let baseSlug = generatedPage.slug
      let finalSlug = baseSlug
      let counter = 1
      
      while (true) {
        const { data: existing } = await supabase
          .from('landing_pages')
          .select('slug')
          .eq('slug', finalSlug)
          .maybeSingle()
        
        if (!existing) break
        finalSlug = `${baseSlug}-${counter}`
        counter++
      }
      
      // Opprett siden
      const { data: page, error: pageError } = await supabase
        .from('landing_pages')
        .insert({
          title: generatedPage.title,
          description: generatedPage.subheadline,
          primary_color: generatedPage.primaryColor,
          template: generatedPage.template,
          user_id: user?.id,
          slug: finalSlug,
          is_published: false,
          settings: {
            benefits: generatedPage.benefits,
            trustElements: generatedPage.trustElements,
            offer: generatedPage.offer,
            buttonText: generatedPage.buttonText
          }
        })
        .select()
        .single()

      if (pageError) throw pageError

      // Opprett feltene
      for (let i = 0; i < generatedPage.fields.length; i++) {
        const field = generatedPage.fields[i]
        await supabase
          .from('landing_page_fields')
          .insert({
            landing_page_id: page.id,
            field_type: field.type,
            label: field.label,
            placeholder: field.placeholder,
            required: field.required !== false,
            sort_order: i
          })
      }

      router.push(`/landing-pages/${page.id}`)
      
    } catch (error: any) {
      console.error('Error saving page:', error)
      alert('Failed to save page: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <button 
            onClick={() => router.back()} 
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            ← Back to Pages
          </button>
          {step === 'preview' && (
            <button
              onClick={savePage}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                'Save Page'
              )}
            </button>
          )}
        </div>

        {step === 'form' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              🤖 AI Landing Page Generator
            </h1>
            <p className="text-gray-600 mb-8">
              Describe what you want to offer – our AI will create a high-converting lead capture page in seconds.
            </p>

            {profile && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  ✨ Using your profile: {profile.industry && `${profile.industry} • `}
                  targeting {profile.target_audience || 'professionals'}
                </p>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What are you offering? <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., A free guide about social media marketing, a demo of our SaaS product, a consultation for small business owners..."
                  className="w-full border border-gray-300 rounded-lg p-4 h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-2">✨ Examples</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>"Free eBook about email marketing for e-commerce stores"</li>
                  <li>"Personalized demo of our project management software"</li>
                  <li>"30-minute strategy session for real estate agents"</li>
                </ul>
              </div>

              <button
                onClick={generateWithAI}
                disabled={!description.trim()}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
              >
                Generate Landing Page
              </button>
            </div>
          </div>
        )}

        {step === 'generating' && (
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-bold mb-2">Claude is creating your page...</h2>
              <p className="text-gray-500">This takes about 10 seconds</p>
            </div>
          </div>
        )}

        {step === 'preview' && generatedPage && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Preview your page</h2>
            
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border">
              <div className="p-8" style={{ backgroundColor: '#f9fafb' }}>
                <div className="max-w-2xl mx-auto">
                  <h1 className="text-4xl font-bold mb-4 text-blue-600">
                    {generatedPage.title}
                  </h1>
                  <p className="text-xl text-gray-600 mb-6">{generatedPage.subheadline}</p>
                  <p className="text-gray-700 mb-8">{generatedPage.description}</p>

                  {generatedPage.offer && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-center">
                      <span className="text-lg font-semibold text-blue-800">🎁 {generatedPage.offer}</span>
                    </div>
                  )}

                  {generatedPage.benefits?.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                      {generatedPage.benefits.map((benefit: string, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-green-500 text-xl">✓</span>
                          <span className="text-sm">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-white rounded-lg p-6 shadow-md">
                    {generatedPage.fields?.map((field: any, i: number) => (
                      <div key={i} className="mb-4">
                        <label className="block text-sm font-medium mb-1">
                          {field.label} 
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                          {!field.required && <span className="text-gray-400 text-xs ml-2">(optional)</span>}
                        </label>
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          className="w-full border rounded-lg p-3"
                          disabled
                        />
                      </div>
                    ))}
                    <button
                      className="w-full py-3 text-white rounded-lg font-medium"
                      style={{ backgroundColor: '#3b82f6' }}
                    >
                      {generatedPage.buttonText}
                    </button>
                  </div>

                  <div className="mt-6 flex justify-center gap-4 text-xs text-gray-500">
                    {generatedPage.trustElements?.map((el: string, i: number) => (
                      <span key={i}>🔒 {el}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={() => setStep('form')}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                ← Regenerate
              </button>
              <button
                onClick={savePage}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Save & Edit Page →
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}