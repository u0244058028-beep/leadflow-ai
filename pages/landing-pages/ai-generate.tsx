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

      // 🎯 PROMPT MED VALGFRIE FELT FOR BEDRE SCORING
      const prompt = `You are an expert copywriter helping users of LeadFlow create high-converting landing pages.

THE USER'S OFFER:
"${description}"

FORM REQUIREMENTS:
The form MUST include:
- Full Name (required)
- Email Address (required)
- PLUS 3-4 OPTIONAL fields that help qualify the lead for BETTER SCORING

GOOD OPTIONAL FIELDS (choose based on their offer):
- Job Title (helps determine decision maker status)
- Company Name (helps identify company size/relevance)
- Phone Number (shows higher intent)
- Industry (helps qualify relevance)
- Company Size (helps determine potential value)
- Website URL (helps research the lead)

SCORING BENEFITS:
- Job Title = +4 points if CEO/Founder
- Industry = +3 points if relevant
- Company = +2 points for known companies
- Phone = +1 point for engagement

Return EXACTLY this JSON format:
{
  "title": "Compelling headline about THEIR offer",
  "subheadline": "Supporting line explaining value",
  "description": "2-3 sentences about what they'll get",
  "offer": "The specific thing they're offering",
  "benefits": ["Benefit 1", "Benefit 2", "Benefit 3"],
  "fields": [
    { "type": "text", "label": "Full Name", "placeholder": "John Doe", "required": true },
    { "type": "email", "label": "Email Address", "placeholder": "john@company.com", "required": true },
    { "type": "text", "label": "Job Title (optional)", "placeholder": "e.g., CEO, Marketing Manager", "required": false },
    { "type": "text", "label": "Company (optional)", "placeholder": "e.g., Acme Inc", "required": false },
    { "type": "tel", "label": "Phone (optional)", "placeholder": "+1 234 567 890", "required": false },
    { "type": "text", "label": "Industry (optional)", "placeholder": "e.g., SaaS, Consulting", "required": false }
  ],
  "buttonText": "Get My [Offer] Now",
  "trustElements": [
    "No spam, unsubscribe anytime",
    "We respect your privacy"
  ]
}

Make the optional fields genuinely useful for lead qualification without making the form intimidating.`

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
        
        // Intelligent fallback med valgfrie felt
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
          subheadline: `The ultimate resource for professionals`,
          description: `Get instant access and start seeing results today.`,
          offer: offer,
          benefits: benefits,
          fields: [
            { type: 'text', label: 'Full Name', placeholder: 'John Doe', required: true },
            { type: 'email', label: 'Email Address', placeholder: 'john@company.com', required: true },
            { type: 'text', label: 'Job Title (optional)', placeholder: 'e.g., CEO', required: false },
            { type: 'text', label: 'Company (optional)', placeholder: 'e.g., Acme Inc', required: false },
            { type: 'tel', label: 'Phone (optional)', placeholder: '+1 234 567 890', required: false },
            { type: 'text', label: 'Industry (optional)', placeholder: 'e.g., SaaS', required: false }
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
          { type: 'email', label: 'Email Address', placeholder: 'john@company.com', required: true },
          { type: 'text', label: 'Job Title (optional)', placeholder: 'e.g., CEO', required: false },
          { type: 'text', label: 'Company (optional)', placeholder: 'e.g., Acme Inc', required: false }
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

  // Resten av koden (savePage og JSX) er uendret fra forrige versjon
  // ...
}