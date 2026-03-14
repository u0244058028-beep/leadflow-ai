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
  const [message, setMessage] = useState('')
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        console.log('🔍 Sjekker admin-status...')
        
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        console.log('👤 Bruker:', user?.email)
        console.log('❌ Auth error:', authError)

        if (authError || !user) {
          console.log('🚫 Ikke logget inn, redirect til login')
          router.push('/login?redirect=/admin/lifetime')
          return
        }

        console.log('📡 Henter profil for user:', user.id)
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin, email, full_name')
          .eq('id', user.id)
          .maybeSingle()

        console.log('📦 Profil data:', profile)
        console.log('❌ Profil error:', profileError)

        if (profileError) {
          console.error('❌ Database error:', profileError)
          setMessage({ type: 'error', text: 'Database error: ' + profileError.message })
          setLoading(false)
          setAuthChecked(true)
          return
        }

        if (!profile) {
          console.log('⚠️ Ingen profil funnet for bruker')
          setMessage({ type: 'error', text: 'Profile not found. Try logging out and in again.' })
          setLoading(false)
          setAuthChecked(true)
          return
        }

        const hasAdminAccess = profile.is_admin === true
        console.log('🔑 Har admin-tilgang:', hasAdminAccess)

        setIsAdmin(hasAdminAccess)

        if (!hasAdminAccess) {
          console.log('⛔ Ikke admin, redirect til dashboard')
          router.push('/dashboard')
          return
        }

        console.log('✅ Admin bekreftet, laster koder...')
        await loadCodes()
        
      } catch (error) {
        console.error('❌ Uventet feil:', error)
        setMessage({ type: 'error', text: 'An unexpected error occurred' })
      } finally {
        setLoading(false)
        setAuthChecked(true)
      }
    }

    checkAdmin()
  }, [router])

  const loadCodes = async () => {
    try {
      console.log('📊 Laster lifetime codes...')
      
      const { data, error } = await supabase
        .from('lifetime_codes')
        .select(`
          *,
          profiles:used_by (
            email,
            full_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('❌ Feil ved lasting av koder:', error)
        setMessage({ type: 'error', text: 'Failed to load codes: ' + error.message })
        return
      }

      console.log(`✅ Lastet ${data?.length || 0} koder`)
      setCodes(data || [])
      
    } catch (error) {
      console.error('❌ Uventet feil ved lasting:', error)
      setMessage({ type: 'error', text: 'Failed to load codes' })
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
    setMessage({ type: '', text: '' })
    
    try {
      const code = generateCode()
      const { data: { user } } = await supabase.auth.getUser()

      console.log('🆕 Genererer ny kode:', code)

      const { error } = await supabase
        .from('lifetime_codes')
        .insert({
          code: code,
          used: false,
          created_by: user?.id,
          price_paid: parseFloat(price),
          expires_at: null
        })

      if (error) {
        console.error('❌ Feil ved lagring:', error)
        setMessage({ type: 'error', text: 'Error generating code: ' + error.message })
      } else {
        console.log('✅ Kode lagret:', code)
        setGeneratedLink(`${process.env.NEXT_PUBLIC_SITE_URL}/activate/${code}`)
        setMessage({ type: 'success', text: '✅ Code generated successfully!' })
        await loadCodes()
      }
    } catch (error: any) {
      console.error('❌ Uventet feil:', error)
      setMessage({ type: 'error', text: error.message })
    } finally {
      setGenerating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  // Debug-visning hvis noe er galt
  if (!authChecked) {
    return (
      <Layout>
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Sjekker admin-tilgang...</p>
        </div>
      </Layout>
    )
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto py-12 px-4 text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8">
            <h1 className="text-2xl font-bold text-red-700 mb-4">Access Denied</h1>
            <p className="text-gray-700 mb-4">
              You don't have admin privileges to access this page.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              If you believe this is a mistake, check that:
            </p>
            <ul className="text-sm text-left text-gray-600 mb-6 space-y-2">
              <li>✓ You are logged in with the correct account</li>
              <li>✓ Your profile has is_admin = true in the database</li>
              <li>✓ Try logging out and back in</li>
            </ul>
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

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Admin: Lifetime Access Codes</h1>

        {/* Melding */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Generate new code */}
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
              <p className="text-sm text-gray-500 mt-2">
                Send this link to the customer. It can only be used once.
              </p>
            </div>
          )}
        </div>

        {/* Existing codes */}
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
                  <th className="px-4 py-2 text-left">Used By</th>
                  <th className="px-4 py-2 text-left">Used At</th>
                </tr>
              </thead>
              <tbody>
                {codes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      No codes generated yet. Click "Generate New Code" to create your first lifetime access link.
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
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                            Used
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                            Available
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {code.profiles?.email || '-'}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {code.used_at ? new Date(code.used_at).toLocaleDateString() : '-'}
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