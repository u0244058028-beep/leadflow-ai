import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/router'

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    let mounted = true

    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) throw error

        if (mounted) {
          // Publiske sider som ikke krever innlogging
          const publicPaths = ['/login', '/', '/s/']
          const isPublicPath = publicPaths.some(path => 
            router.pathname === path || router.pathname.startsWith('/s/')
          )

          if (!session && !isPublicPath) {
            console.log('No session, redirecting to login')
            router.push('/login')
            return
          }

          if (session) {
            // Sjekk om bruker har profil
            const { data: profile } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', session.user.id)
              .single()

            // Hvis ingen profil og ikke på onboarding, redirect
            if (!profile && router.pathname !== '/onboarding' && !isPublicPath) {
              router.push('/onboarding')
              return
            }
          }

          setAuthChecked(true)
          setIsLoading(false)
        }
      } catch (err) {
        console.error('Auth check error:', err)
        if (mounted) {
          setAuthChecked(true)
          setIsLoading(false)
        }
      }
    }

    checkAuth()

    // Lytt på auth-endringer
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event)
      
      if (event === 'SIGNED_OUT') {
        router.push('/login')
      } else if (event === 'SIGNED_IN') {
        // Sjekk profil ved innlogging
        const checkProfile = async () => {
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
        checkProfile()
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router])

  // Vis loading til auth er sjekket
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Initializing...</p>
        </div>
      </div>
    )
  }

  return <Component {...pageProps} />
}