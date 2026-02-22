import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'

export default function Onboarding() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const createProfileAndRedirect = async () => {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) {
        router.push('/login')
        return
      }

      // Sjekk om bruker allerede har en profil
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      // Hvis ikke, opprett profil automatisk!
      if (!profile) {
        await supabase.from('profiles').insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          avatar_url: user.user_metadata?.avatar_url || null
        })
      }

      // Ferdig! Send til dashboard
      router.push('/dashboard')
    }

    createProfileAndRedirect()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Setting up your account...</p>
      </div>
    </div>
  )
}