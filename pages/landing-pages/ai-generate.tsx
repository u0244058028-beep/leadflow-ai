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

      // 🎯 PROMPT MED KONTEKST OM TJENESTEN
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

Return EXACTLY this JSON format:
{
  "title": "Compelling headline about THEIR offer (max 10 words)",
  "subheadline": "Supporting line explaining the value to THEM",
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
        let benefits = [
          'Proven strategies that work',
          'Expert insights and tips',
          'Practical templates included'
        ]
        
        if (words.includes('consult') || words.includes('strategy')) {
          offer = 'Free Strategy Session'
          title = 'Book Your Free 30-Minute Strategy Call'
          benefits = [
            'Personalized advice for your business',
            'Actionable insights you can use today',
            'No sales pitch, just value'
          ]
        } else if (words.includes('demo')) {
          offer = 'Free Personalized Demo'
          title = 'See How Our Solution Can Help You'
          benefits = [
            'Tailored to your specific needs',
            'See real results in action',
            'Get answers to your questions'
          ]
        } else if (words.includes('webinar')) {
          offer = 'Free Webinar Access'
          title = 'Join Our Exclusive Free Webinar'
          benefits = [
            'Live training from experts',
            'Q&A session included',
            'Recording sent after'
          ]
        } else if (words.includes('checklist')) {
          offer = 'Free Ultimate Checklist'
          title = 'The Complete Checklist for Success'
          benefits = [
            'Step-by-step guide',
            'Downloadable PDF',
            'Used by 1000+ professionals'
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
          buttonText: `Get My ${offer}`,
          trustElements: [
            'No spam, unsubscribe anytime',
            'We respect your privacy'
          ]
        }
      }

      // Generer slug fra beskrivelsen
      const slug = description
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50)

      setGeneratedPage({
        ...aiSuggestion,
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

  // Resten av koden (savePage og JSX) er uendret
  // ...
}