import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { X } from 'lucide-react'

export default function OnboardingGuide() {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(1)
  const router = useRouter()

  useEffect(() => {
    // Sjekk om bruker har sett onboarding før
    const hasSeenOnboarding = localStorage.getItem('leadflow-onboarding-completed')
    
    // Ikke vis på onboarding-siden (unngå loop)
    if (router.pathname === '/onboarding') return
    
    // Vis hvis ikke sett før
    if (!hasSeenOnboarding) {
      // Vent litt slik at siden lastes først
      setTimeout(() => setIsOpen(true), 1000)
    }
  }, [router.pathname])

  const completeOnboarding = () => {
    localStorage.setItem('leadflow-onboarding-completed', 'true')
    setIsOpen(false)
  }

  const nextStep = () => {
    if (step < 3) {
      setStep(step + 1)
    } else {
      completeOnboarding()
    }
  }

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full relative animate-fade-in">
        {/* Lukk-knapp */}
        <button
          onClick={completeOnboarding}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Innhold */}
        <div className="p-6">
          {/* Steg-indikator */}
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm font-medium text-blue-600">Step {step} of 3</span>
            <div className="flex gap-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-2 w-8 rounded-full transition ${
                    i === step ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Steg 1: Velkommen */}
          {step === 1 && (
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">👋</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">Welcome to LeadFlow!</h2>
              <p className="text-gray-600 mb-6">
                We'll help you get started in just 3 simple steps.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left mb-6">
                <p className="text-sm text-blue-800">
                  <strong>✨ What you'll learn:</strong>
                </p>
                <ul className="text-sm text-blue-700 mt-2 space-y-2">
                  <li className="flex items-center gap-2">
                    <span>1️⃣</span> Create your first lead
                  </li>
                  <li className="flex items-center gap-2">
                    <span>2️⃣</span> Generate an AI landing page
                  </li>
                  <li className="flex items-center gap-2">
                    <span>3️⃣</span> Score and qualify leads
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Steg 2: Opprett lead */}
          {step === 2 && (
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">📝</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">Create Your First Lead</h2>
              <p className="text-gray-600 mb-6">
                Click the "+ New Lead" button and fill in the details.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm font-medium mb-2">💡 Pro tip:</p>
                <p className="text-sm text-gray-600">
                  Fill in <strong>Job Title</strong> and <strong>Industry</strong> for better AI scoring.
                  CEO = +4 points, SaaS = +3 points!
                </p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-2">Quick example:</p>
                <div className="bg-white p-3 rounded border">
                  <p className="font-medium">Ola Nordmann</p>
                  <p className="text-xs text-gray-500">CEO • TechStart • SaaS</p>
                </div>
              </div>
            </div>
          )}

          {/* Steg 3: AI-landingsside */}
          {step === 3 && (
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🤖</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">Generate Landing Pages</h2>
              <p className="text-gray-600 mb-6">
                Describe what you offer, and AI creates a professional page.
              </p>
              
              <div className="bg-purple-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-purple-800 italic">
                  "A free guide about social media marketing for e-commerce stores"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div className="bg-gray-50 p-2 rounded">
                  <span className="block text-lg mb-1">🎯</span>
                  Lead scoring
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <span className="block text-lg mb-1">📧</span>
                  Email notifications
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <span className="block text-lg mb-1">💰</span>
                  Pipeline value
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <span className="block text-lg mb-1">📊</span>
                  Dashboard
                </div>
              </div>
            </div>
          )}

          {/* Navigasjonsknapper */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button
                onClick={prevStep}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                ← Back
              </button>
            )}
            <button
              onClick={nextStep}
              className={`flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition ${
                step === 1 ? 'w-full' : ''
              }`}
            >
              {step === 3 ? 'Get Started →' : 'Continue →'}
            </button>
          </div>

          {/* Hopp over (liten link) */}
          <button
            onClick={completeOnboarding}
            className="block text-center text-xs text-gray-400 hover:text-gray-600 mt-4 w-full"
          >
            Skip tutorial
          </button>
        </div>
      </div>
    </div>
  )
}