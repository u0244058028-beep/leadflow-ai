// I loadLeads-funksjonen, legg til timeout
async function loadLeads() {
  setLoading(true)
  setError('')
  
  try {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) {
      setError('You must be logged in to view leads')
      setLoading(false)
      return
    }

    // Sett timeout på 10 sekunder
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 10000)
    )

    const fetchPromise = supabase
      .from('leads')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any

    if (error) throw error
    setLeads(data || [])
    
  } catch (error: any) {
    console.error('Error loading leads:', error)
    setError(error.message || 'Failed to load leads')
  } finally {
    setLoading(false)
  }
}