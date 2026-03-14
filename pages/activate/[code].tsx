// pages/activate/[code].tsx
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import Layout from '@/components/Layout'

type ActivationStatus = 'loading' | 'valid' | 'invalid' | 'used' | 'activating'

export default function ActivateLifetime() {
  const router = useRouter()
  const { code } = router.query
  const [status, setStatus] = useState<ActivationStatus>('loading')
  const [codeData, setCodeData] = useState<any>(null)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')

  useEffect(() => {
    if (code) {
      checkCode()
    }
  }, [code])

  const checkCode = async () => {
    if (!code || typeof code !== 'string') return

    const { data, error } = await supabase
      .from('lifetime_codes')
      .select('*')
      .eq('code', code)
      .maybeSingle()

    if (error || !data) {
      setStatus('invalid')
      return
    }

    setCodeData(data)

    if (data.used) {
      setStatus('used')
      return
    }

    setStatus('valid')
  }

  const handleSignupAndActivate = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('activating')
    setError('')

    try {
      // 1. Opprett bruker i Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      })

      if (signUpError) throw signUpError
      if (!authData.user) throw new Error('Kunne ikke opprette bruker')

      // 2. Oppdater profilen direkte (ikke vent på trigger)
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
        .eq('id', authData.user.id)

      if (profileError) throw profileError

      // 3. Merk koden som brukt
      const { error: codeError } = await supabase
        .from('lifetime_codes')
        .update({
          used: true,
          used_by: authData.user.id,
          used_at: new Date().toISOString()
        })
        .eq('code', code)

      if (codeError) throw codeError

      // 4. Send bekreftelsesmail (valgfritt)
      await fetch('/api/send-lifetime-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      }).catch(console.error)

      // 5. Logg inn brukeren
      await supabase.auth.signInWithPassword({
        email,
        password
      })

      router.push('/dashboard?lifetime=activated')

    } catch (err: any) {
      console.error('Activation error:', err)
      setError(err.message)
      setStatus('valid')
    }
  }

  if (status === 'loading') {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600" />
        </div>
      </Layout>
    )
  }

  if (status === 'invalid') {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-red-600 mb-2">Invalid Access Code</h1>
            <p className="text-gray-600 mb-6">
              The code you entered doesn't exist or has expired.
            </p>
            <Link href="/" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg">
              Go to Home
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  if (status === 'used') {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-yellow-600 mb-2">Code Already Used</h1>
            <p className="text-gray-600 mb-6">
              This lifetime access code has already been activated.
            </p>
            <Link href="/" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg">
              Go to Home
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎁</div>
            <h1 className="text-2xl font-bold text-green-600 mb-2">
              You Have Lifetime Access!
            </h1>
            <p className="text-gray-600">
              Create your account to activate your lifetime membership.
            </p>
          </div>

          <form onSubmit={handleSignupAndActivate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                minLength={6}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-800 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'activating'}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              {status === 'activating' ? 'Activating...' : '✓ Activate My Lifetime Account'}
            </button>

            <p className="text-xs text-gray-500 text-center">
              By creating an account, you agree to our{' '}
              <Link href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </Link>
            </p>
          </form>
        </div>
      </div>
    </Layout>
  )
}