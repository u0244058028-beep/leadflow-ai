import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/router'

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      // Tillat landing page (/) og login-siden uten innlogging
      if (!session && router.pathname !== '/login' && router.pathname !== '/') {
        router.push('/login')
        return
      }

      // Hvis bruker er innlogget, sjekk om de har profil
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .single()

        // Hvis ingen profil og ikke allerede på onboarding, redirect til onboarding
        if (!profile && router.pathname !== '/onboarding') {
          router.push('/onboarding')
          return
        }
      }

      setIsLoading(false)
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login')
      } else if (event === 'SIGNED_IN') {
        // Ved innlogging, sjekk profil
        if (session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', session.user.id)
            .single()

          if (profile) {
            router.push('/dashboard')
          } else {
            router.push('/onboarding')
          }
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Laster...</div>
  }

  return <Component {...pageProps} />
}