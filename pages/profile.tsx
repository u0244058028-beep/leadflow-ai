import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import Layout from '@/components/Layout'
import { useSubscription } from '@/hooks/useSubscription'

export default function Profile() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })
  
  // Subscription hooks
  const subscription = useSubscription()
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  // 🟢 OPPDATERT: loadProfile med bedre feilhåndtering
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

      // Hent profilen med maybeSingle() i stedet for single()
      console.log('📊 Henter profil for userId:', user.id)
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
        
        // Opprett profil hvis den mangler
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: '',
            company_name: '',
            subscription_status: 'trial',
            trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
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

  // Håndter kansellering av abonnement
  async function handleCancelSubscription() {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to Pro features at the end of your billing period.')) {
      return
    }

    setCancelling(true)
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      if (!user) throw new Error('No user found')

      console.log('🔴 Kansellerer abonnement for user:', user.id)

      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })

      const data = await response.json()
      console.log('📦 Cancel response:', data)

      if (!response.ok) {
        throw new Error(data.message || 'Error cancelling subscription')
      }

      setMessage({
        type: 'success',
        text: 'Subscription cancelled successfully. You will have access until the end of your billing period.',
      })
    } catch (err: any) {
      console.error('❌ Cancel error:', err)
      setMessage({
        type: 'error',
        text: err.message || 'Error cancelling subscription',
      })
    } finally {
      setCancelling(false)
    }
  }

  // 🟢 OPPDATERT: Åpne Stripe Customer Portal med bedre feilhåndtering
  async function handleManageBilling() {
    try {
      setMessage({ type: '', text: '' })
      
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      console.log('🔍 Current user for billing:', { user, authError })
      
      if (authError) {
        throw new Error('Authentication error')
      }

      if (!user) {
        setMessage({ type: 'error', text: 'Please log in again' })
        router.push('/login')
        return
      }

      console.log('📤 Sending userId to portal:', user.id)

      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })

      const data = await response.json()
      console.log('📦 Portal response:', data)

      if (!response.ok) {
        throw new Error(data.message || 'Error opening billing portal')
      }

      console.log('✅ Redirecting to portal:', data.url)
      window.location.href = data.url
    } catch (err: any) {
      console.error('❌ Portal error:', err)
      setMessage({
        type: 'error',
        text: err.message || 'Error opening billing portal',
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

      // Logg ut etter sletting
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

          {/* Subscription Management */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Subscription</h2>
            
            {subscription.loading ? (
              <div className="text-center py-4 text-gray-500">Loading subscription details...</div>
            ) : (
              <div className="space-y-4">
                {/* Current Status */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Current Plan</p>
                    <p className="text-sm text-gray-600">
                      {subscription.isActive ? (
                        <span className="text-green-600">Pro Plan (Active)</span>
                      ) : subscription.isTrial ? (
                        <span className="text-blue-600">
                          Pro Plan (Trial - {subscription.daysLeft} days left)
                        </span>
                      ) : (
                        <span className="text-gray-600">No active subscription</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Trial Expiring Soon Warning */}
                {subscription.isTrial && subscription.daysLeft !== null && subscription.daysLeft <= 3 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800 text-sm font-medium">
                      ⚠️ Your trial ends in {subscription.daysLeft} days. 
                      Upgrade now to avoid interruption.
                    </p>
                  </div>
                )}

                {/* Trial Info & Actions */}
                {subscription.isTrial && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800 text-sm mb-3">
                      You're on a 14-day free trial. You won't be charged until your trial ends. 
                      Upgrade anytime to keep using Pro features.
                    </p>
                    <button
                      onClick={() => router.push('/pricing')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    >
                      Upgrade Now
                    </button>
                  </div>
                )}

                {/* Active Subscription Actions */}
                {subscription.isActive && (
                  <div className="space-y-3">
                    <button
                      onClick={handleManageBilling}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                    >
                      Update Payment Method
                    </button>

                    <button
                      onClick={handleCancelSubscription}
                      disabled={cancelling}
                      className="w-full px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-md hover:bg-red-100 disabled:opacity-50 text-sm"
                    >
                      {cancelling ? 'Processing...' : 'Cancel Subscription'}
                    </button>

                    <p className="text-xs text-gray-500 text-center">
                      Your subscription will remain active until the end of your current billing period.
                    </p>
                  </div>
                )}

                {/* No Subscription */}
                {!subscription.isActive && !subscription.isTrial && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                    <p className="text-gray-600 text-sm mb-3">
                      You don't have an active subscription.
                    </p>
                    <button
                      onClick={() => router.push('/pricing')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    >
                      View Plans
                    </button>
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