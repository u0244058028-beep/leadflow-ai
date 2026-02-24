async function generateWithAI() {
  if (!description.trim()) {
    alert('Please describe what you want to offer')
    return
  }

  setLoading(true)
  setStep('generating')
  
  try {
    console.log('🔍 TEST MODE - Sending to AI...')
    console.log('Description:', description)

    // Enkel test uten JSON-krav
    const testPrompt = `Based on this description: "${description}", 
    write a short headline and 3 benefits. Just plain text, no JSON.`

    const response = await window.puter.ai.chat(testPrompt, {
      model: "gpt-5-nano", // Enkleste modell
      temperature: 0.7,
      max_tokens: 200
    })

    console.log('📥 AI response:', response)
    alert('AI responded! Check console for result.')

    setStep('form')
    
  } catch (error: any) {
    console.error('❌ AI error:', error)
    alert('Error: ' + error.message)
  } finally {
    setLoading(false)
  }
}