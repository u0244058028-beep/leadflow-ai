import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'

export default function Onboarding() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    industry: '',
    targetAudience: '',
    defaultOffer: 'guide',
    phone: '',
    website: ''
  })

  const industryOptions = [
    'SaaS / Software',
    'E-commerce',
    'Consulting',
    'Marketing Agency',
    'Real Estate',
    'Financial Services',
    'Healthcare',
    'Education',
    'Other'
  ]

  const offerOptions = [
    { value: 'guide', label: 'Guide / eBook', icon: '📚' },
    { value: 'checklist', label: 'Checklist', icon: '✅' },
    { value: 'template', label: 'Template', icon: '📝' },
    { value: 'webinar', label: 'Webinar', icon: '🎥' },
    { value: 'demo', label: 'Demo', icon: '🎯' },
    { value: 'consultation', label: 'Consultation', icon: '🤝' }
  ]

  useEffect(() => {
    checkExistingProfile()
  }, [])

  async function checkExistingProfile() {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) {
      router.push('/login')
      return
    }

    // Sjekk om bruker allerede har fylt ut onboarding
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('full_name, company_name, industry, target_audience, default_offer, onboarding_completed')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error checking profile:', error)
      // Fortsett uansett – vi prøver å oppdatere
    }

    // Hvis allerede fylt ut, send til dashboard
    if (profile?.onboarding_completed) {
      router.push('/dashboard')
    }
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    
    try {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) throw new Error('No user found')

      console.log('Updating profile with:', formData)

      // Oppdater profilen med onboarding-data
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          company_name: formData.companyName || null,
          industry: formData.industry,
          target_audience: formData.targetAudience,
          default_offer: formData.defaultOffer,
          phone: formData.phone || null,
          website: formData.website || null,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        console.error('Update error:', error)
        throw error
      }

      console.log('Profile updated successfully')

      // Gå til dashboard
      router.push('/dashboard?welcome=true')
      
    } catch (error: any) {
      console.error('Onboarding error:', error)
      setError(error.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => setStep(step + 1)
  const prevStep = () => setStep(step - 1)

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-2xl mx-auto pt-16 px-4">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-blue-600">Step {step} of 4</span>
            <span className="text-sm text-gray-500">{step * 25}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${step * 25}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-3xl font-bold mb-2">Welcome to LeadFlow! 👋</h1>
            <p className="text-gray-600 mb-8">Let's get to know you better. This helps us create better landing pages for you.</p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  What's your full name? <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
                  placeholder="Ola Nordmann"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">This will appear in your AI-generated emails</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company name (optional)
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
                  placeholder="LeadFlow AS"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={nextStep}
                  disabled={!formData.fullName.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Continue →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Business Details */}
        {step === 2 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-2">Tell us about your business</h2>
            <p className="text-gray-600 mb-8">This helps AI understand your audience.</p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  What industry are you in? <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.industry}
                  onChange={(e) => setFormData({...formData, industry: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select industry...</option>
                  {industryOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Who is your target audience? <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({...formData, targetAudience: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Small business owners, Developers, Marketing managers"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Be specific – this improves AI-generated content</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website (optional)
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com"
                />
              </div>

              <div className="flex justify-between">
                <button
                  onClick={prevStep}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  ← Back
                </button>
                <button
                  onClick={nextStep}
                  disabled={!formData.industry || !formData.targetAudience}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Continue →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Default Offer */}
        {step === 3 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-2">What do you typically offer?</h2>
            <p className="text-gray-600 mb-8">Choose your most common lead magnet. You can change this later.</p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {offerOptions.map(offer => (
                <button
                  key={offer.value}
                  onClick={() => setFormData({...formData, defaultOffer: offer.value})}
                  className={`p-4 border rounded-lg text-center transition ${
                    formData.defaultOffer === offer.value
                      ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600'
                      : 'hover:border-gray-400'
                  }`}
                >
                  <span className="text-3xl mb-2 block">{offer.icon}</span>
                  <span className="font-medium">{offer.label}</span>
                </button>
              ))}
            </div>

            <div className="flex justify-between">
              <button
                onClick={prevStep}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                ← Back
              </button>
              <button
                onClick={nextStep}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">You're all set! 🎉</h2>
              <p className="text-gray-600">We've saved your preferences. Now let's create your first landing page!</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="font-semibold mb-4">Your profile summary:</h3>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs text-gray-500">Name</dt>
                  <dd className="font-medium">{formData.fullName}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Company</dt>
                  <dd className="font-medium">{formData.companyName || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Industry</dt>
                  <dd className="font-medium">{formData.industry}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Target audience</dt>
                  <dd className="font-medium">{formData.targetAudience}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Default offer</dt>
                  <dd className="font-medium">
                    {offerOptions.find(o => o.value === formData.defaultOffer)?.label}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="flex gap-4">
              <button
                onClick={prevStep}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                ← Edit
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Go to Dashboard →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}