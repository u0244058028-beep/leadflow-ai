async function addNote() {
  if (!newNote.trim()) return
  const user = (await supabase.auth.getUser()).data.user
  if (!user || !lead) return
  
  // Legg til notatet
  await supabase.from('notes').insert([
    { lead_id: lead.id, content: newNote, user_id: user.id }
  ])
  
  // Hent alle notater for å sende til scoring
  const { data: allNotes } = await supabase
    .from('notes')
    .select('content')
    .eq('lead_id', lead.id)
    .order('created_at', { ascending: false })
    .limit(5)
  
  const notesText = allNotes?.map(n => n.content).join(' ') || newNote
  
  // Kall score-api (fire and forget - vi venter ikke på svar)
  fetch('/api/score-lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      leadId: lead.id,
      notes: notesText,
      userId: user.id,
    }),
  })
  
  setNewNote('')
  loadData()
}