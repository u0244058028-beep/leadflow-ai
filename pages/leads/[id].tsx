async function generateFollowup() {
  setLoadingAI(true)
  try {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return

    const res = await fetch('/api/generate-followup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadName: lead?.name,
        company: lead?.company,
        leadId: lead?.id,
        userId: user.id,
      }),
    })
    const data = await res.json()
    setGeneratedMessage(data.message)
  } catch (error) {
    console.error(error)
  } finally {
    setLoadingAI(false)
  }
}