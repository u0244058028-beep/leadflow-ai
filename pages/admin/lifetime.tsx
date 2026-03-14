// pages/admin/lifetime.tsx
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import Layout from '@/components/Layout'
import Link from 'next/link'

export default function AdminLifetime() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [generatedLink, setGeneratedLink] = useState('')
  const [codes, setCodes] = useState<any[]>([])
  const [price, setPrice] = useState('297')
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [debug, setDebug] = useState<any>(null)

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      // 1. Sjekk om bruker er logget inn
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.log('🚫 Ikke logget inn')
        router.push('/login?redirect=/admin/lifetime')
        return
      }

      console.log('✅ Logget inn som:', user.email)

      // 2. Hent profilen direkte
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('❌ Database error:', profileError)
        setErrorMsg('Database error: ' + profileError.message)
        setDebug({ profileError })
        setLoading(false)
        return
      }

      console.log('📊 Profil:', profile)
      setDebug({ profile })

      // 3. Sjekk admin-status
      if (profile?.is_admin === true) {
        console.log('✅ Admin bekreftet!')
        setIsAdmin(true)
        loadCodes()
      } else {
        console.log('⛔ Ikke admin. is_admin =', profile?.is_admin)
        setErrorMsg(`Du er ikke admin (is_admin = ${profile?.is_admin}). Kontakt support.`)
        setLoading(false)
      }

    } catch (error: any) {
      console.error('❌ Uventet feil:', error)
      setErrorMsg(error.message)
      setDebug({ error })
      setLoading(false)
    }
  }

  const loadCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('lifetime_codes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        setErrorMsg('Failed to load codes: ' + error.message)
        return
      }

      setCodes(data || [])
      setLoading(false)
    } catch (error: any) {
      setErrorMsg(error.message)
      setLoading(false)
    }
  }

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const randomPart = () => 
      Array(4).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('')
    return `MLA-${randomPart()}-${randomPart()}`
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setErrorMsg('')
    setSuccessMsg('')
    
    try {
      const code = generateCode()
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('lifetime_codes')
        .insert({
          code: code,
          used: false,
          created_by: user?.id,
          price_paid: parseFloat(price)
        })

      if (error) {
        setErrorMsg('Error generating code: ' + error.message)
      } else {
        setGeneratedLink(`${process.env.NEXT_PUBLIC_SITE_URL}/lifetime-signup/${code}`)
        setSuccessMsg('✅ Code generated successfully!')
        loadCodes()
      }
    } catch (error: any) {
      setErrorMsg(error.message)
    } finally {
      setGenerating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  // Vis loading
  if (loading) {
    return (
      <Layout>
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Sjekker admin-tilgang...</p>
        </div>
      </Layout>
    )
  }

  // Vis feilmelding (inkludert "ikke admin")
  if (errorMsg || !isAdmin) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto py-12 px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8">
            <h1 className="text-2xl font-bold text-red-700 mb-4">Access Denied</h1>
            <p className="text-gray-700 mb-4">{errorMsg || 'Du har ikke admin-tilgang.'}</p>
            
            {debug && (
              <div className="mt-4 p-4 bg-gray-100 rounded text-xs overflow-auto">
                <pre>{JSON.stringify(debug, null, 2)}</pre>
              </div>
            )}

            <Link 
              href="/dashboard"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  // Vis admin-panel
  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Admin: Lifetime Access Codes</h1>

        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 text-green-800 rounded-lg">
            {successMsg}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Generate New Lifetime Code</h2>
          
          <div className="flex gap-4 items-end mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price ($)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg"
                min="0"
                step="1"
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate New Code'}
            </button>
          </div>

          {generatedLink && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="font-medium mb-2">Your lifetime access link:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={generatedLink}
                  readOnly
                  className="flex-1 p-2 border rounded bg-white font-mono text-sm"
                />
                <button
                  onClick={() => copyToClipboard(generatedLink)}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Lifetime Codes</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Code</th>
                  <th className="px-4 py-2 text-left">Created</th>
                  <th className="px-4 py-2 text-left">Price</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {codes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-500">
                      No codes generated yet.
                    </td>
                  </tr>
                ) : (
                  codes.map((code) => (
                    <tr key={code.id} className="border-t">
                      <td className="px-4 py-2 font-mono text-sm">{code.code}</td>
                      <td className="px-4 py-2 text-sm">
                        {new Date(code.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2">${code.price_paid}</td>
                      <td className="px-4 py-2">
                        {code.used ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Used</span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Available</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}