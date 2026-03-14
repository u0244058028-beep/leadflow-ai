import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/router'
import OnboardingGuide from '@/components/OnboardingGuide'
import { ToastProvider } from '@/components/Toast'
import { Analytics } from '@vercel/analytics/react'
import Script from 'next/script'
import Head from 'next/head'

const GA_MEASUREMENT_ID = 'G-17814229256'

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  // Google Analytics
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (typeof window !== 'undefined' && typeof window.gtag !== 'undefined') {
        window.gtag('config', GA_MEASUREMENT_ID, {
          page_path: url,
        })
      }
    }
    
    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])

  useEffect(() => {
    const checkUserAndCreateProfile = async () => {
      try {
        console.log('🔍 [APP] Sjekker bruker...')
        
        // 🟢 ADMIN-SJEKK SKAL VÆRE FØRST - INGEN UNNTAK!
        if (router.pathname.startsWith('/admin/')) {
          console.log('👑 [APP] Admin-side oppdaget - stopper ALL videre prosessering')
          setIsLoading(false)
          return
        }

        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error('❌ [APP] Auth-feil:', error)
        }

        const publicPaths = [
          '/login', 
          '/', 
          '/s/', 
          '/onboarding', 
          '/pricing',
          '/about',
          '/contact',
          '/privacy',
          '/signup',
          '/blog',
          '/blog/[slug]',
          '/comparisons',
          '/comparisons/[slug]',
          '/guides',
          '/guides/[slug]',
          '/ads/ai-lead-scoring',
          '/ads/ai-landing-pages',
          '/activate/[code]',
          '/lifetime-signup/[code]',
          '/ads/lead-followup'
        ]
        
        const isPublicPath = publicPaths.some(path => 
          router.pathname === path || 
          router.pathname.startsWith('/s/') || 
          router.pathname.startsWith('/ads/') ||
          router.pathname.startsWith('/blog/') ||
          router.pathname.startsWith('/comparisons/') ||
          router.pathname.startsWith('/guides/')
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

        // Hent profil
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, onboarding_completed, welcome_email_sent, subscription_status, trial_ends_at, has_active_purchase, purchase_expires_at, is_lifetime')
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

          const trialEndsAt = new Date()
          trialEndsAt.setDate(trialEndsAt.getDate() + 14)

          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              full_name: fullName,
              avatar_url: user.user_metadata?.avatar_url || null,
              onboarding_completed: false,
              welcome_email_sent: false,
              subscription_status: 'trial',
              trial_ends_at: trialEndsAt.toISOString(),
              has_active_purchase: false,
              purchase_expires_at: null,
              is_lifetime: false
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

        // Tilgangssjekk for vanlige brukere
        if (profile && !isPublicPath && router.pathname !== '/pricing') {
          
          const now = new Date()
          
          const isLifetime = profile.is_lifetime === true
          const trialEnd = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null
          const isInTrial = trialEnd && trialEnd > now && profile.subscription_status === 'trial'
          
          const purchaseExpires = profile.purchase_expires_at ? new Date(profile.purchase_expires_at) : null
          const hasActivePurchase = profile.has_active_purchase && purchaseExpires && purchaseExpires > now

          if (isLifetime) {
            console.log('✅ [APP] Lifetime bruker - gir tilgang')
          }
          else if (!isInTrial && !hasActivePurchase) {
            console.log('⚠️ [APP] Ingen aktiv tilgang, redirect til pricing')
            router.push('/pricing')
            return
          }
        }

        // Onboarding-sjekk (kun for vanlige brukere)
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
            const { data: profile } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', session.user.id)
              .maybeSingle()

            if (!profile) {
              const fullName = session.user.user_metadata?.full_name || 
                              session.user.user_metadata?.name || 
                              session.user.email?.split('@')[0] || 
                              'User'

              const trialEndsAt = new Date()
              trialEndsAt.setDate(trialEndsAt.getDate() + 14)

              await supabase.from('profiles').insert({
                id: session.user.id,
                email: session.user.email,
                full_name: fullName,
                avatar_url: session.user.user_metadata?.avatar_url || null,
                onboarding_completed: false,
                welcome_email_sent: false,
                subscription_status: 'trial',
                trial_ends_at: trialEndsAt.toISOString(),
                has_active_purchase: false,
                purchase_expires_at: null,
                is_lifetime: false
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
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <meta property="og:site_name" content="My Lead Assistant" />
        <meta property="twitter:site" content="@L30401My" />
        <link rel="canonical" href={`https://www.myleadassistant.com${router.pathname}`} />
      </Head>

      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>

      <ToastProvider>
        <Component {...pageProps} />
        <OnboardingGuide />
        <Analytics />
      </ToastProvider>
    </>
  )
}