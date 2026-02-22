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
    offerType: 'guide'
  })

  const goalOptions = [
    { value: 'collect-leads', label: 'Collect leads', icon: '📋' },
    { value: 'book-meeting', label: 'Book meetings', icon: '📅' },
    { value: 'sell-product', label: 'Sell product', icon: '🛍️' },
    { value: 'newsletter', label: 'Newsletter signup', icon: '📧' },
    { value: 'webinar', label: 'Webinar registration', icon: '🎥' },
    { value: 'demo', label: 'Request demo', icon: '🎯' }
  ]

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

      const selectedOffer = offerTypes.find(o => o.value === form.offerType)

      const prompt = `...` // (din prompt, for korthets skyld utelatt her)

      const response = await window.puter.ai.chat(prompt, {
        model: 'google/gemini-3-flash-preview',
        temperature: 0.9,
        max_tokens: 2000
      })

      // Parse JSON (samme som før)
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
        // Fallback (samme som før)
        aiSuggestion = { ... } // (din fallback)
      }

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

  // 🎯 VIKTIG: savePage må være INNE i komponenten!
  async function savePage() {
    if (!generatedPage) return
    
    setLoading(true)
    try {
      const user = (await supabase.auth.getUser()).data.user
      
      // GENERER UNIK SLUG
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
      
      console.log('Using slug:', finalSlug)
      
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

  return (
    <Layout>
      {/* ... resten av JSX-en (uendret) ... */}
    </Layout>
  )
}