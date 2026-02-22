import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/router'

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const ensureProfileExists = async () => {
      try {
        console.log('🔍 Checking user session...')
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error('❌ Auth error:', error)
        }

        if (user) {
          console.log('✅ User found:', user.id, user.email)
          
          // PRØV GJENTATTE GANGER å opprette profil
          let profile = null
          let attempts = 0
          const maxAttempts = 3
          
          while (!profile && attempts < maxAttempts) {
            attempts++
            console.log(`📋 Attempt ${attempts} to find/create profile...`)
            
            // Sjekk om profilen finnes
            const { data: existingProfile } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', user.id)
              .maybeSingle()
            
            if (existingProfile) {
              profile = existingProfile
              console.log('✅ Profile already exists')
              break
            }
            
            // Hvis ikke, opprett den!
            console.log('➕ Creating profile for user:', user.id)
            
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
                avatar_url: user.user_metadata?.avatar_url || null
              })

            if (insertError) {
              console.error('❌ Profile creation error:', insertError)
            } else {
              console.log('✅ Profile created successfully!')
              profile = { id: user.id } // Bare for å avslutte loopen
            }
          }
        } else {
          console.log('👤 No user logged in')
        }
      } catch (error) {
        console.error('❌ Unexpected error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    ensureProfileExists()
  }, [])

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