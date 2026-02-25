import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/router'
import OnboardingGuide from '@/components/OnboardingGuide'
import { ToastProvider } from '@/components/Toast'

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

        const publicPaths = ['/login', '/', '/s/', '/onboarding', '/pricing'] // 🆕 Legg til pricing som public
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

        // 🆕 Hent flere felt fra profiles inkludert abonnementsstatus
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, onboarding_completed, welcome_email_sent, subscription_status, trial_ends_at')
          .eq('id', user.id)
          .maybeSingle()

        if (profileError) {
          console.error('❌ [APP] Profil-sjekk feil:', profileError)
        }

        if (!profile) {
          console.log('➕ [APP] Oppretter profil for:', user.id)
          
          const fullName = user.user_metadata?.full_name || 
                          user.user_metadata?.name || 
                          user.email?.split('@')[0] || 
                          'User'

          // 🆕 Legg til trial_ends_at ved opprettelse
          const trialEndsAt = new Date()
          trialEndsAt.setDate(trialEndsAt.getDate() + 14) // 14 dagers trial

          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              full_name: fullName,
              avatar_url: user.user_metadata?.avatar_url || null,
              onboarding_completed: false,
              welcome_email_sent: false,
              subscription_status: 'trial', // 🆕
              trial_ends_at: trialEndsAt.toISOString() // 🆕
            })

          if (insertError) {
            console.error('❌ [APP] Feil ved opprettelse av profil:', insertError)
          } else {
            console.log('✅ [APP] Profil opprettet!')
            if (user.email) {
              await sendWelcomeEmail(user.email, fullName, user.id)
            }
          }
        }

        // 🆕 NY SEKSJON: Sjekk abonnementsstatus
        if (profile && !isPublicPath && router.pathname !== '/pricing') {
          const trialEnd = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null
          const now = new Date()
          
          // Hvis trial er utløpt og ingen aktivt abonnement
          if (trialEnd && trialEnd < now && profile.subscription_status !== 'active') {
            console.log('⚠️ [APP] Trial utløpt, redirect til pricing')
            router.push('/pricing')
            return
          }

          // Hvis abonnementet er kansellert eller utløpt
          if (profile.subscription_status === 'cancelled' || profile.subscription_status === 'past_due') {
            console.log('⚠️ [APP] Abonnement problem, redirect til pricing')
            router.push('/pricing')
            return
          }
        }

        // Hent oppdatert profil for onboarding-sjekk
        const { data: updatedProfile } = await supabase
          .from('profiles')
          .select('full_name, onboarding_completed')
          .eq('id', user.id)
          .single()

        const needsOnboarding = 
          (!updatedProfile?.full_name || updatedProfile.full_name === 'User' || !updatedProfile?.onboarding_completed) &&
          router.pathname !== '/onboarding'

        if (needsOnboarding) {
          console.log('🔄 [APP] Bruker trenger onboarding, redirecter...')
          router.push('/onboarding')
          return
        }

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('📢 [APP] Auth state changed:', event)
      
      if (event === 'SIGNED_IN') {
        const createProfileOnSignIn = async () => {
          if (session?.user) {
            // 🆕 Sjekk om profil finnes med abonnementsstatus
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, subscription_status')
              .eq('id', session.user.id)
              .maybeSingle()

            if (!profile) {
              const fullName = session.user.user_metadata?.full_name || 
                              session.user.user_metadata?.name || 
                              session.user.email?.split('@')[0] || 
                              'User'

              // 🆕 Sett trial ved ny profil
              const trialEndsAt = new Date()
              trialEndsAt.setDate(trialEndsAt.getDate() + 14)

              await supabase.from('profiles').insert({
                id: session.user.id,
                email: session.user.email,
                full_name: fullName,
                avatar_url: session.user.user_metadata?.avatar_url || null,
                onboarding_completed: false,
                welcome_email_sent: false,
                subscription_status: 'trial', // 🆕
                trial_ends_at: trialEndsAt.toISOString() // 🆕
              })
              console.log('✅ [APP] Profil opprettet ved SIGNED_IN')
              
              if (session.user.email) {
                await sendWelcomeEmail(
                  session.user.email, 
                  fullName,
                  session.user.id
                )
              }
            }
            
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

  async function sendWelcomeEmail(email: string, name: string, userId: string) {
    try {
      console.log('📧 [APP] Sender velkomst-e-post til:', email)
      
      const response = await fetch('/api/send-welcome-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name })
      })

      const data = await response.json()
      
      if (response.ok) {
        console.log('✅ [APP] Velkomst-e-post sendt!', data)
        await supabase
          .from('profiles')
          .update({ welcome_email_sent: true })
          .eq('id', userId)
      } else {
        console.error('❌ [APP] Feil ved sending:', data)
      }
    } catch (error) {
      console.error('❌ [APP] Kunne ikke sende velkomst-e-post:', error)
    }
  }

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

  return (
    <ToastProvider>
      <Component {...pageProps} />
      <OnboardingGuide />
    </ToastProvider>
  )
}