async function rescoreLead(leadId: string) {
  setScoringLead(leadId)
  
  try {
    const { data: notes } = await supabase
      .from('notes')
      .select('content')
      .eq('lead_id', leadId)
      .limit(10)

    const notesText = notes?.map(n => n.content).join(' ') || ''
    const user = (await supabase.auth.getUser()).data.user

    if (!user) {
      throw new Error('Not authenticated')
    }

    console.log('Sending scoring request for lead:', leadId)

    const response = await fetch('/api/score-lead', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        leadId,
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