useEffect(() => {
  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user && !window.location.pathname.includes('/onboarding')) {
      // Sjekk om profilen finnes
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()
      
      // Hvis ikke, opprett den!
      if (!profile) {
        await supabase.from('profiles').insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          avatar_url: user.user_metadata?.avatar_url || null
        })
      }
    }
  }
  
  checkUser()
}, [])