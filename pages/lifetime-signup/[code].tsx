// pages/lifetime-signup/[code].tsx
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import Layout from '@/components/Layout'

type ActivationStatus = 'loading' | 'valid' | 'invalid' | 'used' | 'activating'

export default function LifetimeSignup() {
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

  const handleLifetimeSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('activating')
    setError('')

    try {
      // 1. Opprett bruker med RIKTIG metadata
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            signup_method: 'lifetime' // 🟢 VIKTIG: Merker at dette er lifetime
          }
        }
      })

      if (signUpError) throw signUpError
      if (!authData.user) throw new Error('Kunne ikke opprette bruker')

      // 2. OMGÅ standard profile-trigger ved å oppdatere DIREKTE
      // (vi venter 1 sekund for å la triggeren kjøre, så overskriver vi)
      setTimeout(async () => {
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
          .eq('id', authData.user?.id)

        if (profileError) {
          console.error('❌ Kunne ikke oppdatere til lifetime:', profileError)
        }
      }, 1000)

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

      // 4. Send bekreftelsesmail
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
              The lifetime access code you entered doesn't exist.
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
      <div className="min-h-[60vh] flex items-center justify-center py-12 px-4 bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-md w-full">
          {/* Lifetime badge */}
          <div className="text-center mb-6">
            <span className="inline-block px-4 py-2 bg-purple-600 text-white rounded-full text-sm font-semibold">
              ✨ LIFETIME ACCESS ✨
            </span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-purple-500">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🎁</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                You've Got Lifetime Access!
              </h1>
              <p className="text-gray-600">
                Create your account to activate your lifetime membership. <strong>Never pay again.</strong>
              </p>
            </div>

            <form onSubmit={handleLifetimeSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Your name"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="you@example.com"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Min. 6 characters"
                  minLength={6}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-800 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-sm text-purple-800">
                <p className="font-medium mb-2">✨ Your Lifetime Benefits:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>No recurring payments - ever</li>
                  <li>All Pro features included</li>
                  <li>Priority support</li>
                  <li>All future updates</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={status === 'activating'}
                className="w-full px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-semibold text-lg transition transform hover:scale-[1.02]"
              >
                {status === 'activating' ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    Activating...
                  </span>
                ) : (
                  '✓ Activate My Lifetime Account'
                )}
              </button>

              <p className="text-xs text-gray-500 text-center">
                By creating an account, you agree to our{' '}
                <Link href="/privacy" className="text-purple-600 hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </form>
          </div>

          {/* Code display */}
          <p className="text-center text-sm text-gray-500 mt-4">
            Activation code: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{code}</span>
          </p>
        </div>
      </div>
    </Layout>
  )
}