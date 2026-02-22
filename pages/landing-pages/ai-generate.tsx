import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import Layout from '@/components/Layout'

export default function AIGeneratePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'generating' | 'preview'>('form')
  const [generatedPage, setGeneratedPage] = useState<any>(null)
  const [description, setDescription] = useState('')

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

      const prompt = `You are an expert copywriter specializing in lead generation pages for a SaaS platform called LeadFlow (myleadassistant.com).

ABOUT LEADFLOW:
LeadFlow is a SaaS platform that helps businesses capture and manage leads. Users can:
- Create AI-generated landing pages to capture leads
- Score and qualify leads automatically
- Send follow-up emails
- Track conversions

THE USER'S REQUEST:
"${description}"

YOUR TASK:
Create a lead capture page based on their request. The page should:
1. Offer something valuable in exchange for their email (guide, demo, consultation, checklist, etc.)
2. Be specific to their business/offer
3. Include 2-3 compelling benefits
4. Have a clear call-to-action

IMPORTANT: 
- NEVER mention "free trial" unless they specifically ask for it
- NEVER mention LeadFlow's features on their landing page
- Focus on THEIR offer, not the platform

Return EXACTLY this JSON format (NO OTHER TEXT):
{
  "title": "Compelling headline about THEIR offer (max 10 words)",
  "subheadline": "Supporting line explaining the value to THEM (max 15 words)",
  "description": "2 sentences about what THEY'LL get",
  "offer": "The specific thing THEY'RE offering (e.g., 'Free Guide to SaaS Growth')",
  "benefits": [
    "Specific benefit 1 for THEIR audience",
    "Specific benefit 2 for THEIR audience",
    "Specific benefit 3 for THEIR audience"
  ],
  "fields": [
    { "type": "text", "label": "Full Name", "placeholder": "John Doe", "required": true },
    { "type": "email", "label": "Email Address", "placeholder": "john@company.com", "required": true }
  ],
  "buttonText": "Get My [Offer] Now",
  "trustElements": [
    "No spam, unsubscribe anytime",
    "We respect your privacy"
  ]
}`

      const response = await window.puter.ai.chat(prompt, {
        model: 'google/gemini-3-flash-preview',
        temperature: 0.8,
        max_tokens: 2000
      })

      console.log('AI response:', response)

      // Parse JSON fra responsen
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
        
        // Intelligent fallback basert på beskrivelsen
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
          benefits = [
            'Personalized advice for your business',
            'Actionable insights you can use today',
            'No sales pitch, just value'
          ]
        } else if (words.includes('demo')) {
          offer = 'Free Personalized Demo'
          title = 'See How Our Solution Can Help You'
          buttonText = 'Get My Free Demo'
          benefits = [
            'Tailored to your specific needs',
            'See real results in action',
            'Get answers to your questions'
          ]
        } else if (words.includes('webinar')) {
          offer = 'Free Webinar Access'
          title = 'Join Our Exclusive Free Webinar'
          buttonText = 'Save My Seat'
          benefits = [
            'Live training from experts',
            'Q&A session included',
            'Recording sent after'
          ]
        } else if (words.includes('checklist')) {
          offer = 'Free Ultimate Checklist'
          title = 'The Complete Checklist for Success'
          buttonText = 'Get My Free Checklist'
          benefits = [
            'Step-by-step guide',
            'Downloadable PDF',
            'Used by 1000+ professionals'
          ]
        } else if (words.includes('trial') || words.includes('14 days')) {
          offer = '14-Day Free Trial'
          title = 'Try LeadFlow Free for 14 Days'
          buttonText = 'Start My Free Trial'
          benefits = [
            'Full access to all features',
            'No credit card required',
            'Cancel anytime'
          ]
        }
        
        aiSuggestion = {
          title: title,
          subheadline: `The ultimate resource for professionals`,
          description: `Get instant access to our proven strategies and start seeing results today.`,
          offer: offer,
          benefits: benefits,
          fields: [
            { type: 'text', label: 'Full Name', placeholder: 'John Doe', required: true },
            { type: 'email', label: 'Email Address', placeholder: 'john@company.com', required: true }
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
          {step === 'preview' && generatedPage && (
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

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What are you offering? <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., A free guide about social media marketing, a demo of our SaaS product, a consultation for small business owners, a webinar about AI tools..."
                  className="w-full border border-gray-300 rounded-lg p-4 h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  Be as specific as you want – the AI will understand and create the perfect page.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 mb-2">✨ Examples</h3>
                <ul className="space-y-2 text-sm text-blue-700">
                  <li>"Free eBook about email marketing for e-commerce stores"</li>
                  <li>"Personalized demo of our project management software"</li>
                  <li>"30-minute strategy session for real estate agents"</li>
                  <li>"Checklist for launching a successful podcast"</li>
                  <li>"Webinar about AI tools for small businesses"</li>
                </ul>
              </div>

              <button
                onClick={generateWithAI}
                disabled={!description.trim()}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
              >
                <span>✨</span>
                Generate Landing Page
              </button>
            </div>
          </div>
        )}

        {step === 'generating' && (
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-24 w-24 border-8 border-gray-200 border-t-purple-600 mx-auto mb-8"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl">✨</span>
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2">AI is creating your page...</h2>
              <p className="text-gray-500">This takes about 10 seconds</p>
            </div>
          </div>
        )}

        {step === 'preview' && generatedPage && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Preview your AI-generated page</h2>
            
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border">
              <div className="p-8" style={{ backgroundColor: '#f9fafb' }}>
                <div className="max-w-2xl mx-auto">
                  <h1 className="text-4xl font-bold mb-4" style={{ color: generatedPage.primaryColor }}>
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
                      style={{ backgroundColor: generatedPage.primaryColor }}
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
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? 'Saving...' : 'Save & Edit Page →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}