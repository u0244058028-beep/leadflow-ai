import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import Layout from '@/components/Layout'

export default function AIGeneratePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'generating' | 'preview'>('form')
  const [generatedPage, setGeneratedPage] = useState<any>(null)
  
  const [form, setForm] = useState({
    businessName: '',
    businessType: '',
    targetAudience: '',
    goal: 'collect-leads',
    tone: 'professional',
    colorPreference: 'blue',
    offerType: 'guide' // NY: for å variere tilbudet
  })

  const goalOptions = [
    { value: 'collect-leads', label: 'Collect leads', icon: '📋' },
    { value: 'book-meeting', label: 'Book meetings', icon: '📅' },
    { value: 'sell-product', label: 'Sell product', icon: '🛍️' },
    { value: 'newsletter', label: 'Newsletter signup', icon: '📧' },
    { value: 'webinar', label: 'Webinar registration', icon: '🎥' },
    { value: 'demo', label: 'Request demo', icon: '🎯' }
  ]

  // NY: Ulike typer tilbud som AI kan velge mellom
  const offerTypes = [
    { value: 'guide', label: 'Guide / eBook', icon: '📚' },
    { value: 'checklist', label: 'Checklist', icon: '✅' },
    { value: 'template', label: 'Template', icon: '📝' },
    { value: 'webinar', label: 'Webinar', icon: '🎥' },
    { value: 'demo', label: 'Demo', icon: '🎯' },
    { value: 'consultation', label: 'Consultation', icon: '🤝' },
    { value: 'case-study', label: 'Case Study', icon: '📊' },
    { value: 'tool', label: 'Free Tool', icon: '🛠️' },
    { value: 'assessment', label: 'Assessment', icon: '📋' },
    { value: 'whitepaper', label: 'Whitepaper', icon: '📄' }
  ]

  const toneOptions = [
    { value: 'professional', label: 'Professional', icon: '👔' },
    { value: 'friendly', label: 'Friendly', icon: '😊' },
    { value: 'enthusiastic', label: 'Enthusiastic', icon: '🔥' },
    { value: 'minimal', label: 'Minimal', icon: '✨' },
    { value: 'authoritative', label: 'Authoritative', icon: '👑' }
  ]

  const colorOptions = [
    { value: 'blue', label: 'Blue', class: 'bg-blue-600' },
    { value: 'purple', label: 'Purple', class: 'bg-purple-600' },
    { value: 'green', label: 'Green', class: 'bg-green-600' },
    { value: 'red', label: 'Red', class: 'bg-red-600' },
    { value: 'orange', label: 'Orange', class: 'bg-orange-600' },
    { value: 'teal', label: 'Teal', class: 'bg-teal-600' }
  ]

  async function generateWithAI() {
    setLoading(true)
    setStep('generating')
    
    try {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) {
        alert('You must be logged in')
        return
      }

      // Finn valgt tilbudstype
      const selectedOffer = offerTypes.find(o => o.value === form.offerType)

      // 🎯 NY PROMPT med mye mer variasjon
      const prompt = `You are an expert copywriter specializing in lead generation pages.

Create a HIGH-CONVERTING lead capture page for:

BUSINESS DETAILS:
- Name: ${form.businessName || form.businessType}
- Type: ${form.businessType}
- Target audience: ${form.targetAudience || 'professionals'}
- Goal: ${goalOptions.find(g => g.value === form.goal)?.label}
- Tone: ${form.tone}
- Offer type: ${selectedOffer?.label || 'guide'}

IMPORTANT RULES:
1. This is a LEAD CAPTURE page - people give email to get something valuable
2. NEVER mention "free trial", "credit card", "pricing", "money", "payment"
3. The OFFER should be a ${selectedOffer?.label} that provides genuine value
4. The headline must be about the BENEFIT they'll get, not about your company
5. The CTA button must match the offer type

Examples of different offers:
- For GUIDE: "Free Guide: How to Double Your Conversion Rate"
- For CHECKLIST: "The Ultimate SEO Checklist (2025 Edition)"
- For TEMPLATE: "Free Sales Email Templates That Actually Work"
- For WEBINAR: "Join Our Free Webinar: 5 Strategies to Scale Your Business"
- For DEMO: "See Our Platform in Action – Free Personalized Demo"
- For CONSULTATION: "Book Your Free 30-Minute Strategy Session"
- For CASE STUDY: "How [Client] Generated 300% More Leads [Case Study]"
- For TOOL: "Try Our Free ROI Calculator"
- For ASSESSMENT: "Get Your Free Website Audit"
- For WHITEPAPER: "The State of [Industry] 2025 [Whitepaper]"

Return EXACTLY this JSON format (no other text):
{
  "title": "COMPELLING HEADLINE about the benefit/offer (max 12 words)",
  "subheadline": "Supporting line explaining the value (max 15 words)",
  "description": "2-3 sentences about what they'll get",
  "offer": "The specific free item (e.g., 'Free Guide: How to Generate More Leads')",
  "benefits": [
    "Specific outcome 1 they'll achieve",
    "Specific outcome 2 they'll achieve", 
    "Specific outcome 3 they'll achieve"
  ],
  "fields": [
    { "type": "text", "label": "Full Name", "placeholder": "John Doe" },
    { "type": "email", "label": "Email Address", "placeholder": "john@company.com" }
  ],
  "buttonText": "Get My [Offer] Now",
  "trustElements": [
    "No spam, unsubscribe anytime",
    "We respect your privacy"
  ]
}

Make it specific, compelling, and focused on the ${selectedOffer?.label} offer.`

      console.log('Sending prompt to Puter.ai...')

      const response = await window.puter.ai.chat(prompt, {
        model: 'google/gemini-3-flash-preview',
        temperature: 0.9, // Høyere temperatur = mer variasjon
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
        
        // 🎯 SMART FALLBACK basert på valgt offerType
        const offerType = form.offerType
        const businessType = form.businessType
        const audience = form.targetAudience || 'professionals'
        
        // Generer variert tilbud basert på type
        let offer = ''
        let buttonText = ''
        let title = ''
        let benefits = []
        
        switch(offerType) {
          case 'guide':
            offer = `Free ${businessType} Lead Generation Guide`
            buttonText = 'Get My Free Guide'
            title = `Free Guide: How ${businessType} Companies Generate More Leads`
            benefits = [
              `Proven strategies specifically for ${businessType}`,
              'Real-world examples and case studies',
              'Actionable templates you can use today'
            ]
            break
          case 'checklist':
            offer = `The Ultimate ${businessType} Checklist`
            buttonText = 'Get My Free Checklist'
            title = `Free Checklist: 10 Steps to ${audience} Success`
            benefits = [
              'Step-by-step actionable items',
              'Downloadable PDF format',
              'Used by 1000+ professionals'
            ]
            break
          case 'template':
            offer = `Free ${businessType} Templates Pack`
            buttonText = 'Download Templates'
            title = `Ready-to-Use ${businessType} Templates for ${audience}`
            benefits = [
              'Professionally designed templates',
              'Customizable for your needs',
              'Save hours of work'
            ]
            break
          case 'webinar':
            offer = 'Free Webinar: Proven Strategies That Work'
            buttonText = 'Save My Seat'
            title = `Join Our Free Webinar: How to Master ${businessType}`
            benefits = [
              'Live training from experts',
              'Q&A session included',
              'Recording sent after'
            ]
            break
          case 'demo':
            offer = 'Free Personalized Demo'
            buttonText = 'Book My Demo'
            title = `See How Our ${businessType} Solution Can Help You`
            benefits = [
              'Tailored to your needs',
              'See real results',
              'No obligation'
            ]
            break
          case 'consultation':
            offer = 'Free 30-Minute Strategy Session'
            buttonText = 'Book My Session'
            title = `Book Your Free ${businessType} Strategy Call`
            benefits = [
              'Personalized advice',
              'Actionable insights',
              'No sales pitch'
            ]
            break
          case 'case-study':
            offer = `Case Study: How [Client] Achieved 3x Growth`
            buttonText = 'Get Case Study'
            title = `Real Results: ${businessType} Success Story`
            benefits = [
              'Real data and metrics',
              'Proven methodology',
              'Learn from their journey'
            ]
            break
          case 'tool':
            offer = `Free ${businessType} ROI Calculator`
            buttonText = 'Calculate Now'
            title = `Try Our Free Tool: Calculate Your Potential Savings`
            benefits = [
              'Instant results',
              'No email required',
              'See your potential'
            ]
            break
          case 'assessment':
            offer = 'Free Website Audit'
            buttonText = 'Get My Audit'
            title = `Free ${businessType} Assessment for ${audience}`
            benefits = [
              'Comprehensive analysis',
              'Actionable recommendations',
              'Delivered to your inbox'
            ]
            break
          case 'whitepaper':
            offer = `The State of ${businessType} 2025 Whitepaper`
            buttonText = 'Download Whitepaper'
            title = `Industry Report: ${businessType} Trends for 2025`
            benefits = [
              'Latest industry data',
              'Expert predictions',
              'Strategic insights'
            ]
            break
          default:
            offer = `Free ${businessType} Resource`
            buttonText = 'Get Free Access'
            title = `Free ${businessType} Guide for ${audience}`
            benefits = [
              `Proven strategies for ${businessType}`,
              'Real-world examples',
              'Actionable templates'
            ]
        }
        
        aiSuggestion = {
          title: title,
          subheadline: `The ultimate resource for ${audience} looking to grow their business`,
          description: `Join thousands of satisfied ${businessType} professionals who have already transformed their results with our proven strategies.`,
          offer: offer,
          benefits: benefits,
          fields: [
            { type: 'text', label: 'Full Name', placeholder: 'John Doe' },
            { type: 'email', label: 'Email Address', placeholder: 'john@company.com' }
          ],
          buttonText: buttonText,
          trustElements: [
            'No spam, unsubscribe anytime',
            'We respect your privacy'
          ]
        }
      }

      // Legg til farge basert på brukerens valg
      const colorMap = {
        blue: '#3b82f6',
        purple: '#8b5cf6',
        green: '#10b981',
        red: '#ef4444',
        orange: '#f97316',
        teal: '#14b8a6'
      }

      setGeneratedPage({
        ...aiSuggestion,
        primaryColor: colorMap[form.colorPreference as keyof typeof colorMap],
        template: form.tone === 'minimal' ? 'minimal' : 'modern',
        slug: (form.businessName || form.businessType).toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
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

  // Resten av JSX-en (samme som før, men med ny offerType-selector)
  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
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
          <>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              🤖 AI Landing Page Generator
            </h1>
            <p className="text-gray-600 mb-8">
              Tell us about your offer, and our AI will create a high-converting lead capture page in seconds.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Form */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium mb-1">Business name</label>
                    <input
                      type="text"
                      value={form.businessName}
                      onChange={(e) => setForm({...form, businessName: e.target.value})}
                      className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., LeadFlow, Acme Inc"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Business type *</label>
                    <input
                      type="text"
                      value={form.businessType}
                      onChange={(e) => setForm({...form, businessType: e.target.value})}
                      className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., SaaS, Consulting, E-commerce"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Target audience</label>
                    <input
                      type="text"
                      value={form.targetAudience}
                      onChange={(e) => setForm({...form, targetAudience: e.target.value})}
                      className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Small business owners, Developers"
                    />
                  </div>

                  {/* NY: Offer type selector */}
                  <div>
                    <label className="block text-sm font-medium mb-2">What are you offering?</label>
                    <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
                      {offerTypes.map(option => (
                        <button
                          key={option.value}
                          onClick={() => setForm({...form, offerType: option.value})}
                          className={`p-2 border rounded-lg text-left transition ${
                            form.offerType === option.value
                              ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                              : 'hover:border-gray-400'
                          }`}
                        >
                          <span className="text-xl mb-1 block">{option.icon}</span>
                          <span className="text-xs font-medium">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Goal</label>
                    <div className="grid grid-cols-2 gap-2">
                      {goalOptions.map(option => (
                        <button
                          key={option.value}
                          onClick={() => setForm({...form, goal: option.value})}
                          className={`p-3 border rounded-lg text-left transition ${
                            form.goal === option.value
                              ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                              : 'hover:border-gray-400'
                          }`}
                        >
                          <span className="text-2xl mb-1 block">{option.icon}</span>
                          <span className="text-sm font-medium">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Tone</label>
                    <div className="grid grid-cols-2 gap-2">
                      {toneOptions.map(option => (
                        <button
                          key={option.value}
                          onClick={() => setForm({...form, tone: option.value})}
                          className={`p-3 border rounded-lg text-left transition ${
                            form.tone === option.value
                              ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                              : 'hover:border-gray-400'
                          }`}
                        >
                          <span className="text-2xl mb-1 block">{option.icon}</span>
                          <span className="text-sm font-medium">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Primary color</label>
                    <div className="flex gap-3">
                      {colorOptions.map(option => (
                        <button
                          key={option.value}
                          onClick={() => setForm({...form, colorPreference: option.value})}
                          className={`w-10 h-10 rounded-full transition-all ${
                            form.colorPreference === option.value
                              ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                              : 'hover:scale-105'
                          } ${option.class}`}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={generateWithAI}
                    disabled={!form.businessType}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
                  >
                    <span>✨</span>
                    Generate Landing Page
                  </button>
                </div>
              </div>

              {/* Preview/Info */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-8">
                <h3 className="font-semibold text-lg mb-4">✨ Choose your offer type</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Select what you want to offer in exchange for their email:
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 bg-white rounded border">📚 Guide / eBook</div>
                  <div className="p-2 bg-white rounded border">✅ Checklist</div>
                  <div className="p-2 bg-white rounded border">📝 Template</div>
                  <div className="p-2 bg-white rounded border">🎥 Webinar</div>
                  <div className="p-2 bg-white rounded border">🎯 Demo</div>
                  <div className="p-2 bg-white rounded border">🤝 Consultation</div>
                  <div className="p-2 bg-white rounded border">📊 Case Study</div>
                  <div className="p-2 bg-white rounded border">🛠️ Free Tool</div>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  The AI will create a page specifically for your chosen offer type.
                </p>
              </div>
            </div>
          </>
        )}

        {/* Generating og preview-seksjoner (samme som før) */}
        {step === 'generating' && (
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-24 w-24 border-8 border-gray-200 border-t-purple-600 mx-auto mb-8"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl">✨</span>
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2">AI is creating your {offerTypes.find(o => o.value === form.offerType)?.label} page...</h2>
              <p className="text-gray-500">This takes about 10 seconds</p>
            </div>
          </div>
        )}

        {step === 'preview' && generatedPage && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Preview your AI-generated page</h2>
            
            {/* Preview innhold (samme som før) */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border">
              <div className="p-8" style={{ backgroundColor: '#f9fafb' }}>
                <div className="max-w-2xl mx-auto">
                  <h1 className="text-4xl font-bold mb-4" style={{ color: generatedPage.primaryColor }}>
                    {generatedPage.title}
                  </h1>
                  <p className="text-xl text-gray-600 mb-6">{generatedPage.subheadline}</p>
                  <p className="text-gray-700 mb-8">{generatedPage.description}</p>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-center">
                    <span className="text-lg font-semibold text-blue-800">🎁 {generatedPage.offer}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {generatedPage.benefits.map((benefit: string, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-green-500 text-xl">✓</span>
                        <span className="text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white rounded-lg p-6 shadow-md">
                    {generatedPage.fields.map((field: any, i: number) => (
                      <div key={i} className="mb-4">
                        <label className="block text-sm font-medium mb-1">
                          {field.label} <span className="text-red-500">*</span>
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
                    {generatedPage.trustElements.map((el: string, i: number) => (
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