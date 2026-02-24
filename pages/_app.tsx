import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/router'

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkUserAndCreateProfile = async () => {
      try {
        console.log('🔍 [APP] Sjekker bruker...')
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error('❌ [APP] Auth-feil:', error)
        }

        // Publiske sider som ikke krever innlogging
        const publicPaths = ['/login', '/', '/s/', '/onboarding']
        const isPublicPath = publicPaths.some(path => 
          router.pathname === path || router.pathname.startsWith('/s/')
        )

        if (!user) {
          console.log('👤 [APP] Ingen bruker funnet')
          if (!isPublicPath) {
            router.push('/login')
          }
          setIsLoading(false)
          return
        }

        console.log('✅ [APP] Bruker funnet:', user.id, user.email)

        // Sjekk om profilen finnes i public.profiles
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, onboarding_completed')
          .eq('id', user.id)
          .maybeSingle()

        if (profileError) {
          console.error('❌ [APP] Profil-sjekk feil:', profileError)
        }

        console.log('📋 [APP] Profil finnes?', !!profile)
        console.log('📋 [APP] Onboarding fullført?', profile?.onboarding_completed)

        // Hvis profilen mangler, opprett den!
        if (!profile) {
          console.log('➕ [APP] Oppretter profil for:', user.id)
          
          const fullName = user.user_metadata?.full_name || 
                          user.user_metadata?.name || 
                          user.email?.split('@')[0] || 
                          'User'

          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              full_name: fullName,
              avatar_url: user.user_metadata?.avatar_url || null,
              onboarding_completed: false
            })

          if (insertError) {
            console.error('❌ [APP] Feil ved opprettelse av profil:', insertError)
          } else {
            console.log('✅ [APP] Profil opprettet!')
          }
        }

        // SJEKK OM BRUKER TRENGER ONBOARDING
        const { data: updatedProfile } = await supabase
          .from('profiles')
          .select('full_name, onboarding_completed')
          .eq('id', user.id)
          .single()

        // Hvis brukeren mangler navn eller ikke har fullført onboarding, og ikke allerede er på onboarding-siden
        const needsOnboarding = 
          (!updatedProfile?.full_name || updatedProfile.full_name === 'User' || !updatedProfile?.onboarding_completed) &&
          router.pathname !== '/onboarding'

        if (needsOnboarding) {
          console.log('🔄 [APP] Bruker trenger onboarding, redirecter...')
          router.push('/onboarding')
          return
        }

        // Hvis bruker er på login-siden og er innlogget, send til dashboard
        if (router.pathname === '/login') {
          router.push('/dashboard')
        }

      } catch (error) {
        console.error('❌ [APP] Uventet feil:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkUserAndCreateProfile()

    // Lytt på auth-endringer
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('📢 [APP] Auth state changed:', event)
      
      if (event === 'SIGNED_IN') {
        // Ved innlogging, sjekk og opprett profil
        const createProfileOnSignIn = async () => {
          if (session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', session.user.id)
              .maybeSingle()

            if (!profile) {
              await supabase.from('profiles').insert({
                id: session.user.id,
                email: session.user.email,
                full_name: session.user.user_metadata?.full_name || 
                          session.user.user_metadata?.name || 
                          session.user.email?.split('@')[0] || 
                          'User',
                avatar_url: session.user.user_metadata?.avatar_url || null,
                onboarding_completed: false
              })
              console.log('✅ [APP] Profil opprettet ved SIGNED_IN')
            }
            
            // Sjekk om bruker trenger onboarding
            const { data: newProfile } = await supabase
              .from('profiles')
              .select('onboarding_completed, full_name')
              .eq('id', session.user.id)
              .single()

            if (!newProfile?.onboarding_completed || newProfile.full_name === 'User') {
              router.push('/onboarding')
            } else {
              router.push('/dashboard')
            }
          }
        }
        createProfileOnSignIn()
      } else if (event === 'SIGNED_OUT') {
        router.push('/login')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  return <Component {...pageProps} />
}