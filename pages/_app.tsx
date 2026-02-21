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
      
      // Hvis ingen session og ikke på login-siden, redirect til login
      if (!session && router.pathname !== '/login') {
        router.push('/login')
      } else {
        setIsLoading(false)
      }
    }

    checkUser()

    // Lytt på auth-endringer
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login')
      } else if (event === 'SIGNED_IN' && router.pathname === '/login') {
        router.push('/')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Laster...</div>
  }

  return <Component {...pageProps} />
}