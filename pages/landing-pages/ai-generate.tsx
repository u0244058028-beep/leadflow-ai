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
    colorPreference: 'blue'
  })

  const goalOptions = [
    { value: 'collect-leads', label: 'Collect leads', icon: '📋' },
    { value: 'book-meeting', label: 'Book meetings', icon: '📅' },
    { value: 'sell-product', label: 'Sell product', icon: '🛍️' },
    { value: 'newsletter', label: 'Newsletter signup', icon: '📧' }
  ]

  const toneOptions = [
    { value: 'professional', label: 'Professional', icon: '👔' },
    { value: 'friendly', label: 'Friendly', icon: '😊' },
    { value: 'enthusiastic', label: 'Enthusiastic', icon: '🔥' },
    { value: 'minimal', label: 'Minimal', icon: '✨' }
  ]

  const colorOptions = [
    { value: 'blue', label: 'Blue', class: 'bg-blue-600' },
    { value: 'purple', label: 'Purple', class: 'bg-purple-600' },
    { value: 'green', label: 'Green', class: 'bg-green-600' },
    { value: 'red', label: 'Red', class: 'bg-red-600' },
    { value: 'orange', label: 'Orange', class: 'bg-orange-600' }
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

      // 🎯 AI genererer hele siden
      const prompt = `Create a high-converting landing page for a business.

      Business details:
      - Name: ${form.businessName || form.businessType}
      - Type: ${form.businessType}
      - Target audience: ${form.targetAudience}
      - Goal: ${goalOptions.find(g => g.value === form.goal)?.label}
      - Tone: ${form.tone}
      
      Return a JSON object with this exact format:
      {
        "title": "Catchy headline that grabs attention (max 8 words)",
        "subheadline": "Compelling subheadline that explains value (max 15 words)",
        "description": "A few sentences about the offer",
        "benefits": ["Benefit 1", "Benefit 2", "Benefit 3"],
        "fields": [
          { "type": "text", "label": "Full Name", "placeholder": "John Doe" },
          { "type": "email", "label": "Email Address", "placeholder": "john@company.com" }
        ],
        "buttonText": "Submit",
        "cta": "Get Started Now",
        "trustElements": ["No credit card required", "14-day free trial", "Cancel anytime"]
      }

      Make it compelling and conversion-optimized.`

      const response = await window.puter.ai.chat(prompt, {
        model: 'google/gemini-3-flash-preview',
        temperature: 0.7,
        max_tokens: 1500
      })

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
        // Fallback til default
        aiSuggestion = {
          title: `Get Started with ${form.businessType}`,
          subheadline: `The easiest way to ${goalOptions.find(g => g.value === form.goal)?.label.toLowerCase()}`,
          description: `Join thousands of satisfied customers who have already transformed their business.`,
          benefits: ['Save time', 'Increase conversions', 'Easy to use'],
          fields: [
            { type: 'text', label: 'Full Name', placeholder: 'John Doe' },
            { type: 'email', label: 'Email Address', placeholder: 'john@company.com' }
          ],
          buttonText: 'Submit',
          cta: 'Get Started Now',
          trustElements: ['No credit card required', '14-day free trial', 'Cancel anytime']
        }
      }

      // Legg til farge basert på brukerens valg
      const colorMap = {
        blue: '#3b82f6',
        purple: '#8b5cf6',
        green: '#10b981',
        red: '#ef4444',
        orange: '#f97316'
      }

      setGeneratedPage({
        ...aiSuggestion,
        primaryColor: colorMap[form.colorPreference as keyof typeof colorMap],
        template: form.tone === 'minimal' ? 'minimal' : 'modern',
        slug: form.businessName?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 
              form.businessType.toLowerCase().replace(/[^a-z0-9]/g, '-')
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
      
      // Opprett siden
      const { data: page, error: pageError } = await supabase
        .from('landing_pages')
        .insert({
          title: generatedPage.title,
          description: generatedPage.subheadline,
          primary_color: generatedPage.primaryColor,
          template: generatedPage.template,
          user_id: user?.id,
          slug: generatedPage.slug,
          is_published: false,
          settings: {
            benefits: generatedPage.benefits,
            trustElements: generatedPage.trustElements,
            cta: generatedPage.cta,
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
            required: true,
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

  const ColorDot = ({ color, selected }: { color: string; selected: boolean }) => (
    <button
      onClick={() => setForm({...form, colorPreference: color})}
      className={`w-8 h-8 rounded-full transition-all ${
        selected ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'
      }`}
      style={{ backgroundColor: color }}
    />
  )

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
              Tell us about your business, and our AI will create a high-converting landing page in seconds.
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
                <h3 className="font-semibold text-lg mb-4">✨ What you'll get</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 text-xl">✓</span>
                    <div>
                      <strong>High-converting headline</strong>
                      <p className="text-sm text-gray-600">Crafted to grab attention</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 text-xl">✓</span>
                    <div>
                      <strong>Persuasive copy</strong>
                      <p className="text-sm text-gray-600">Benefits and value propositions</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 text-xl">✓</span>
                    <div>
                      <strong>Optimized form fields</strong>
                      <p className="text-sm text-gray-600">Based on your goal</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 text-xl">✓</span>
                    <div>
                      <strong>Trust elements</strong>
                      <p className="text-sm text-gray-600">Social proof, guarantees</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 text-xl">✓</span>
                    <div>
                      <strong>Mobile responsive</strong>
                      <p className="text-sm text-gray-600">Looks great on all devices</p>
                    </div>
                  </li>
                </ul>

                <div className="mt-8 p-4 bg-white rounded-lg border">
                  <p className="text-xs text-gray-500 mb-2">Example:</p>
                  <p className="text-sm italic">
                    "Create a landing page for a <strong>SaaS company</strong> targeting <strong>small business owners</strong> who want to <strong>book demos</strong>."
                  </p>
                </div>
              </div>
            </div>
          </>
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
              <div className="mt-8 space-y-2 text-sm text-gray-400">
                <p>✓ Analyzing your requirements</p>
                <p>✓ Crafting compelling copy</p>
                <p>✓ Designing optimal form fields</p>
                <p>✓ Adding trust elements</p>
              </div>
            </div>
          </div>
        )}

        {step === 'preview' && generatedPage && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Preview your AI-generated page</h2>
            
            {/* Live Preview */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border">
              {/* Page preview */}
              <div className="p-8" style={{ backgroundColor: '#f9fafb' }}>
                <div className="max-w-2xl mx-auto">
                  <h1 className="text-4xl font-bold mb-4" style={{ color: generatedPage.primaryColor }}>
                    {generatedPage.title}
                  </h1>
                  <p className="text-xl text-gray-600 mb-6">{generatedPage.subheadline}</p>
                  <p className="text-gray-700 mb-8">{generatedPage.description}</p>

                  {/* Benefits */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {generatedPage.benefits.map((benefit: string, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-green-500 text-xl">✓</span>
                        <span className="text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  {/* Form */}
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

                  {/* Trust elements */}
                  <div className="mt-6 flex justify-center gap-4 text-xs text-gray-500">
                    {generatedPage.trustElements.map((el: string, i: number) => (
                      <span key={i}>🔒 {el}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
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