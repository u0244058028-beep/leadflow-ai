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

  // Sjekk om bruker er admin
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login?redirect=/admin/lifetime')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, email')
        .eq('id', user.id)
        .single()

      if (!profile?.is_admin) {
        router.push('/dashboard')
        return
      }

      setIsAdmin(true)
      loadCodes()
    }

    checkAdmin()
  }, [])

  const loadCodes = async () => {
    const { data } = await supabase
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

    setCodes(data || [])
    setLoading(false)
  }

  const generateCode = () => {
    // Generer unik kode: MLA-2024-XXXX-XXXX
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const randomPart = () => 
      Array(4).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('')
    
    return `MLA-${randomPart()}-${randomPart()}`
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setMessage('')
    
    const code = generateCode()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('lifetime_codes')
      .insert({
        code: code,
        used: false,
        created_by: user?.id,
        price_paid: parseFloat(price),
        expires_at: null // Aldri utløper
      })

    if (!error) {
      setGeneratedLink(`${process.env.NEXT_PUBLIC_SITE_URL}/activate/${code}`)
      setMessage('✅ Code generated successfully!')
      loadCodes()
    } else {
      setMessage('❌ Error generating code: ' + error.message)
    }

    setGenerating(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  if (loading || !isAdmin) {
    return (
      <Layout>
        <div className="text-center py-20">Loading...</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Admin: Lifetime Access Codes</h1>

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

          {message && (
            <div className={`p-3 rounded-lg ${
              message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message}
            </div>
          )}

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
                {codes.map((code) => (
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}