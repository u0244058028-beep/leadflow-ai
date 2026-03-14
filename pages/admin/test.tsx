// pages/admin/test.tsx
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import Layout from '@/components/Layout'

export default function AdminTest() {
  const [status, setStatus] = useState('Laster...')
  const [userData, setUserData] = useState<any>(null)
  const [profileData, setProfileData] = useState<any>(null)

  useEffect(() => {
    runTests()
  }, [])

  const runTests = async () => {
    try {
      // Test 1: Hent session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      console.log('🔑 Session:', session)
      
      if (!session) {
        setStatus('❌ Ikke logget inn!')
        return
      }

      // Test 2: Hent user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      console.log('👤 User:', user)
      setUserData(user)

      if (userError || !user) {
        setStatus('❌ Kunne ikke hente bruker')
        return
      }

      // Test 3: Hent profil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      console.log('📊 Profile:', profile)
      console.log('❌ Profile error:', profileError)
      setProfileData(profile)

      if (profileError) {
        setStatus('❌ Databasefeil: ' + profileError.message)
        return
      }

      if (!profile) {
        setStatus('❌ Ingen profil funnet!')
        return
      }

      // Test 4: Sjekk admin
      if (profile.is_admin === true) {
        setStatus('✅ Du er ADMIN!')
      } else {
        setStatus('❌ Du er IKKE admin (is_admin = ' + profile.is_admin + ')')
      }

    } catch (error: any) {
      console.error('❌ Test feilet:', error)
      setStatus('❌ Feil: ' + error.message)
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-12 px-4">
        <h1 className="text-2xl font-bold mb-6">Admin Test Side</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Status</h2>
          <p className="text-xl">{status}</p>
        </div>

        {userData && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Brukerdata</h2>
            <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(userData, null, 2)}
            </pre>
          </div>
        )}

        {profileData && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Profildata</h2>
            <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(profileData, null, 2)}
            </pre>
          </div>
        )}

        <div className="flex gap-4">
          <Link 
            href="/admin/lifetime"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Gå til Admin Panel
          </Link>
          <button
            onClick={runTests}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Kjør tester på nytt
          </button>
        </div>
      </div>
    </Layout>
  )
}