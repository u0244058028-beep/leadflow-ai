import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import Layout from '@/components/Layout'
import { usePurchase } from '@/hooks/usePurchase'

export default function Profile() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })
  
  // 🟢 Bruk purchase hook i stedet for subscription
  const purchase = usePurchase()

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      console.log('🔍 loadProfile starter...')
      
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      console.log('👤 Hent bruker:', { user, authError })

      if (authError) {
        console.error('❌ Auth error:', authError)
        setMessage({ type: 'error', text: 'Authentication error' })
        return
      }

      if (!user) {
        console.log('🚫 Ingen bruker funnet, redirect til login')
        router.push('/login')
        return
      }

      setEmail(user.email || '')
      console.log('📧 Email satt til:', user.email)

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      console.log('📦 Profil data:', data)
      console.log('❌ Profil error:', error)

      if (error) {
        console.error('❌ Error loading profile:', error)
        setMessage({ type: 'error', text: 'Failed to load profile' })
        return
      }

      if (!data) {
        console.log('⚠️ Ingen profil funnet, oppretter ny...')
        
        const trialEndsAt = new Date()
        trialEndsAt.setDate(trialEndsAt.getDate() + 14)

        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: '',
            company_name: '',
            subscription_status: 'trial',
            trial_ends_at: trialEndsAt.toISOString(),
            has_active_purchase: false,
            purchase_expires_at: null,
          })

        if (insertError) {
          console.error('❌ Kunne ikke opprette profil:', insertError)
          setMessage({ type: 'error', text: 'Could not create profile' })
        } else {
          console.log('✅ Profil opprettet, laster siden på nytt')
          window.location.reload()
        }
        return
      }

      console.log('✅ Profil lastet:', data)
      setFullName(data.full_name || '')
      setCompanyName(data.company_name || '')
      
    } catch (err) {
      console.error('❌ Uventet feil:', err)
      setMessage({ type: 'error', text: 'An unexpected error occurred' })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      if (!user) throw new Error('No user found')

      console.log('💾 Oppdaterer profil for user:', user.id)

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          company_name: companyName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      console.log('✅ Profil oppdatert')
      setMessage({
        type: 'success',
        text: 'Profile updated successfully!',
      })
    } catch (err: any) {
      console.error('❌ Update error:', err)
      setMessage({
        type: 'error',
        text: err.message,
      })
    } finally {
      setLoading(false)
    }
  }

  // 🟢 Ny funksjon for å kjøpe tilgang
  async function handlePurchase() {
    try {
      setMessage({ type: '', text: '' })
      
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      if (!user) {
        router.push('/login')
        return
      }

      console.log('🛒 Starter kjøp for user:', user.id)

      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.id,
          email: user.email 
        }),
      })

      const data = await response.json()
      console.log('📦 Checkout response:', data)

      if (!response.ok) {
        throw new Error(data.message || 'Error starting purchase')
      }

      window.location.href = data.url
    } catch (err: any) {
      console.error('❌ Purchase error:', err)
      setMessage({
        type: 'error',
        text: err.message || 'Error starting purchase',
      })
    }
  }

  async function handleDeleteAccount() {
    setDeleteLoading(true)
    setMessage({ type: '', text: '' })
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      if (!user) throw new Error('No user found')

      console.log('🗑️ Sending delete request for user:', user.id)

      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to delete account')
      }

      await supabase.auth.signOut()
      router.push('/login?deleted=true')
      
    } catch (error: any) {
      console.error('❌ Delete error:', error)
      setMessage({
        type: 'error',
        text: 'Failed to delete account: ' + error.message
      })
    } finally {
      setDeleteLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Your Profile</h1>

        <div className="bg-white rounded-lg shadow p-6">
          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                disabled
                value={email}
                className="mt-1 block w-full border border-gray-300 rounded-md bg-gray-50 p-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Full name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Company name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>

            {message.text && (
              <div className={`p-3 rounded-md ${
                message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {message.text}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>

          {/* 🟢 Access Management - Ny versjon for engangskjøp */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Access & Billing</h2>
            
            {purchase.loading ? (
              <div className="text-center py-4 text-gray-500">Loading access details...</div>
            ) : (
              <div className="space-y-4">
                {/* Current Status */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Current Status</p>
                    <p className="text-sm text-gray-600">
                      {purchase.hasAccess ? (
                        <span className="text-green-600">
                          Active - {purchase.daysLeft} days remaining
                        </span>
                      ) : (
                        <span className="text-orange-600">No active access</span>
                      )}
                    </p>
                    {purchase.expiresAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Expires: {purchase.expiresAt.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Purchase Info & Actions */}
                {!purchase.hasAccess ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800 text-sm mb-3">
                      Get 30 days of full access to all Pro features for just $29.
                    </p>
                    <button
                      onClick={handlePurchase}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    >
                      Purchase Access - $29
                    </button>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 text-sm">
                      You have active access until {purchase.expiresAt?.toLocaleDateString()}.
                      {purchase.daysLeft && purchase.daysLeft <= 3 && (
                        <span className="block mt-2 text-orange-600 font-medium">
                          ⚠️ Your access expires soon. Purchase again to continue.
                        </span>
                      )}
                    </p>
                    {purchase.daysLeft && purchase.daysLeft <= 3 && (
                      <button
                        onClick={handlePurchase}
                        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                      >
                        Purchase Again - $29
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Danger Zone */}
          <div className="mt-8 pt-6 border-t border-red-200">
            <h2 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h2>
            <p className="text-sm text-gray-600 mb-4">
              Once you delete your account, there is no going back. All your leads, landing pages, and data will be permanently removed.
            </p>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete account
              </button>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 font-medium mb-3">
                  Are you absolutely sure? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    {deleteLoading ? 'Deleting...' : 'Yes, delete my account'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}