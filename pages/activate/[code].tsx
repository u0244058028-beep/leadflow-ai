// pages/activate/[code].tsx
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import Layout from '@/components/Layout'
import Button from '@/components/Button'

export default function ActivateLifetime() {
  const router = useRouter()
  const { code } = router.query
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'used' | 'activating'>('loading')
  const [user, setUser] = useState<any>(null)
  const [codeData, setCodeData] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const checkCode = async () => {
      if (!code) return

      // Sjekk om koden finnes og er ubrukt
      const { data, error } = await supabase
        .from('lifetime_codes')
        .select('*')
        .eq('code', code)
        .maybeSingle()

      if (error) {
        console.error('Error checking code:', error)
        setStatus('invalid')
        return
      }

      if (!data) {
        setStatus('invalid')
        return
      }

      setCodeData(data)

      if (data.used) {
        setStatus('used')
        return
      }

      setStatus('valid')
      
      // Hent innlogget bruker
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }

    checkCode()
  }, [code])

  const handleActivate = async () => {
    if (!user) {
      // Bruker må logge inn først
      router.push(`/login?redirect=/activate/${code}`)
      return
    }

    setStatus('activating')
    setError('')

    try {
      // Aktiver koden
      const { error: updateError } = await supabase
        .from('lifetime_codes')
        .update({ 
          used: true, 
          used_by: user.id,
          used_at: new Date().toISOString()
        })
        .eq('code', code)

      if (updateError) throw updateError

      // Oppdater brukerens konto til lifetime
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          subscription_status: 'lifetime',
          is_lifetime: true,
          lifetime_activated_at: new Date().toISOString(),
          lifetime_code_id: codeData.id,
          trial_ends_at: null,
          has_active_purchase: true,
          purchase_expires_at: null
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      // Send bekreftelsesmail (valgfritt)
      await fetch('/api/send-lifetime-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, code: code })
      })

      router.push('/dashboard?lifetime=activated')
    } catch (err: any) {
      console.error('Activation error:', err)
      setError(err.message)
      setStatus('valid')
    }
  }

  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          {status === 'loading' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Validating your lifetime access...</p>
            </div>
          )}

          {status === 'invalid' && (
            <div className="text-center">
              <div className="text-6xl mb-4">❌</div>
              <h1 className="text-2xl font-bold text-red-600 mb-2">Invalid Access Code</h1>
              <p className="text-gray-600 mb-6">
                The code you entered doesn't exist or has expired.
              </p>
              <Link 
                href="/"
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Go to Home
              </Link>
            </div>
          )}

          {status === 'used' && (
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-yellow-600 mb-2">Code Already Used</h1>
              <p className="text-gray-600 mb-6">
                This lifetime access code has already been activated.
              </p>
              <Link 
                href="/"
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Go to Home
              </Link>
            </div>
          )}

          {status === 'valid' && !user && (
            <div className="text-center">
              <div className="text-6xl mb-4">🎁</div>
              <h1 className="text-2xl font-bold text-green-600 mb-4">You Have Lifetime Access!</h1>
              <p className="text-gray-600 mb-6">
                Your lifetime access code is valid. Please log in or create an account to activate it.
              </p>
              <div className="space-y-3">
                <Link
                  href={`/login?redirect=/activate/${code}`}
                  className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Log In / Sign Up
                </Link>
                <p className="text-sm text-gray-500">
                  Code: <span className="font-mono">{code}</span>
                </p>
              </div>
            </div>
          )}

          {status === 'valid' && user && (
            <div className="text-center">
              <div className="text-6xl mb-4">✨</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Activate Lifetime Access</h1>
              <p className="text-gray-600 mb-4">
                You're about to activate lifetime access for:
              </p>
              <p className="font-semibold text-lg mb-6 bg-gray-50 p-3 rounded">
                {user.email}
              </p>
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left text-sm text-blue-800">
                <p className="font-medium mb-2">⚠️ Important:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>This will give you lifetime access to all Pro features</li>
                  <li>No recurring payments - ever</li>
                  <li>You'll keep access even if you delete your account</li>
                  <li>This action cannot be undone</li>
                </ul>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleActivate}
                  disabled={status === 'activating'}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {status === 'activating' ? 'Activating...' : '✓ Activate My Lifetime Account'}
                </button>
                <Link
                  href="/dashboard"
                  className="block text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancel and go to dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}