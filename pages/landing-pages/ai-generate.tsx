async function savePage() {
  if (!generatedPage) return
  
  setLoading(true)
  try {
    const user = (await supabase.auth.getUser()).data.user
    
    // GENERER UNIK SLUG
    let baseSlug = generatedPage.slug
    let finalSlug = baseSlug
    let counter = 1
    
    // Sjekk om slugen finnes, og legg til tall hvis den gjør det
    while (true) {
      const { data: existing } = await supabase
        .from('landing_pages')
        .select('slug')
        .eq('slug', finalSlug)
        .maybeSingle()
      
      if (!existing) break // Slugen er ledig!
      
      // Hvis opptatt, prøv med tall (f.eks. "min-side-2", "min-side-3")
      finalSlug = `${baseSlug}-${counter}`
      counter++
    }
    
    console.log('Using slug:', finalSlug)
    
    // Opprett siden med den unike slugen
    const { data: page, error: pageError } = await supabase
      .from('landing_pages')
      .insert({
        title: generatedPage.title,
        description: generatedPage.subheadline,
        primary_color: generatedPage.primaryColor,
        template: generatedPage.template,
        user_id: user?.id,
        slug: finalSlug,  // ← BRUK DEN UNIKE SLUGEN
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