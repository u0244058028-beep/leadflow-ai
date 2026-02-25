import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import Layout from '@/components/Layout'
import { useSubscription } from '@/hooks/useSubscription' // 🆕 NY
import Button from '@/components/Button' // 🆕 NY (hvis du har Button-komponent)

export default function Profile() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })
  
  // 🆕 NY: Abonnementshooks
  const subscription = useSubscription()
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) {
      router.push('/login')
      return
    }

    setEmail(user.email || '')

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error loading profile:', error)
      return
    }

    if (data) {
      setFullName(data.full_name || '')
      setCompanyName(data.company_name || '')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) throw new Error('No user found')

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          company_name: companyName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      setMessage({
        type: 'success',
        text: 'Profile updated successfully!',
      })
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message,
      })
    } finally {
      setLoading(false)
    }
  }

  // 🆕 NY: Håndter kansellering av abonnement
  async function handleCancelSubscription() {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to Pro features at the end of your billing period.')) {
      return
    }

    setCancelling(true)
    try {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) throw new Error('No user found')

      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message)
      }

      setMessage({
        type: 'success',
        text: 'Subscription cancelled successfully. You will have access until the end of your billing period.',
      })
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Error cancelling subscription',
      })
    } finally {
      setCancelling(false)
    }
  }

  // 🆕 NY: Åpne Stripe Customer Portal
  async function handleManageBilling() {
    try {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) return

      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })

      const { url } = await response.json()
      window.location.href = url
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: 'Error opening billing portal',
      })
    }
  }

  async function handleDeleteAccount() {
    setDeleteLoading(true)
    setMessage({ type: '', text: '' })
    
    try {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) throw new Error('No user found')

      console.log('Sending delete request for user:', user.id)

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
      console.error('Delete error:', error)
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
          {/* Eksisterende profilskjema */}
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

          {/* 🆕 NY SEKSJON: Subscription Management */}
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
                  {!subscription.isActive && !subscription.isTrial && (
                    <button
                      onClick={() => router.push('/pricing')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    >
                      Upgrade Now
                    </button>
                  )}
                </div>

                {/* Subscription Actions */}
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

                {/* Trial Info */}
                {subscription.isTrial && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800 text-sm">
                      You're on a 14-day free trial. You won't be charged until your trial ends.
                    </p>
                    <button
                      onClick={() => router.push('/pricing')}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    >
                      Upgrade Now
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Danger Zone (din eksisterende) */}
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