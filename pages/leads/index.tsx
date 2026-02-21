async function rescoreLead(leadId: string) {
  if (!leadId) {
    alert('Invalid lead ID')
    return
  }
  
  setScoringLead(leadId)
  
  try {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) {
      alert('You must be logged in')
      setScoringLead(null)
      return
    }

    console.log('Scoring lead:', { leadId, userId: user.id })

    const { data: notes } = await supabase
      .from('notes')
      .select('content')
      .eq('lead_id', leadId)
      .limit(10)

    const notesText = notes?.map(n => n.content).join(' ') || ''

    const response = await fetch('/api/score-lead', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        leadId: leadId,        // Må være nøyaktig samme ID
        notes: notesText,
        userId: user.id,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Server response:', data)
      throw new Error(data.error || 'Failed to score lead')
    }

    console.log('Score success:', data)
    await loadLeads()
    
  } catch (error: any) {
    console.error('Error scoring lead:', error)
    alert('Failed to score lead: ' + error.message)
  } finally {
    setScoringLead(null)
  }
}