import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Layout from '@/components/Layout'
import Link from 'next/link'
import AIActivityLog from '@/components/AIActivityLog'

interface DashboardStats {
  leadCount: number
  tasksToday: number
  topLeads: any[]
  recentActivity: any[]
  conversionRate: number
  hotLeads: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    setLoading(true)
    setError('')
    
    try {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) {
        setError('You must be logged in')
        setLoading(false)
        return
      }

      // Kjør alle databasekall parallelt for raskere lasting
      const [
        { count: leads },
        { data: tasksData },
        { data: leadsData },
        { data: recentLogs }
      ] = await Promise.all([
        // Total leads
        supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        
        // Tasks due today
        (async () => {
          const today = new Date().toISOString().split('T')[0]
          return supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id)
            .eq('completed', false)
            .eq('due_date', today)
        })(),
        
        // Alle leads for videre beregninger
        supabase
          .from('leads')
          .select('id, name, company, ai_score, status, created_at')
          .eq('user_id', user.id),
        
        // Nylig AI-aktivitet (siste 5)
        supabase
          .from('ai_activity_log')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5)
      ])

      // Beregn statistikk
      const leadCount = leads || 0
      const tasksToday = tasksData?.length || 0
      
      // Konverteringsrate
      const convertedLeads = leadsData?.filter(l => l.status === 'converted').length || 0
      const conversionRate = leadCount > 0 ? (convertedLeads / leadCount) * 100 : 0
      
      // Hot leads (score >= 8)
      const hotLeads = leadsData?.filter(l => l.ai_score && l.ai_score >= 8).length || 0
      
      // Topp 5 leads etter score
      const topLeads = leadsData
        ?.filter(l => l.ai_score)
        ?.sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0))
        ?.slice(0, 5) || []

      setStats({
        leadCount,
        tasksToday,
        topLeads,
        recentActivity: recentLogs || [],
        conversionRate,
        hotLeads
      })

    } catch (error: any) {
      console.error('Error loading dashboard:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mb-4"></div>
            <p className="text-gray-500">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !stats) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 mb-4">⚠️</div>
            <p className="text-gray-700 mb-4">{error || 'Failed to load dashboard'}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back! Here's your overview.</p>
      </div>
      
      {/* KPI-kort */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Total Leads</p>
            <span className="text-blue-600 bg-blue-100 p-2 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.leadCount}</p>
          <p className="text-xs text-gray-500 mt-2">Total leads all time</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Tasks Today</p>
            <span className="text-orange-600 bg-orange-100 p-2 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.tasksToday}</p>
          <p className="text-xs text-gray-500 mt-2">Tasks due today</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Hot Leads</p>
            <span className="text-red-600 bg-red-100 p-2 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
              </svg>
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.hotLeads}</p>
          <p className="text-xs text-gray-500 mt-2">Leads with score ≥ 8</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
            <span className="text-green-600 bg-green-100 p-2 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.conversionRate.toFixed(1)}%</p>
          <p className="text-xs text-gray-500 mt-2">Of all leads converted</p>
        </div>
      </div>

      {/* Topp leads og AI Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Topp 5 leads */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">🔥 Top 5 Hot Leads</h2>
            <Link href="/leads" className="text-sm text-blue-600 hover:text-blue-800">
              View all →
            </Link>
          </div>
          
          {stats.topLeads.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No scored leads yet</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {stats.topLeads.map((lead) => (
                <li key={lead.id} className="py-3">
                  <Link href={`/leads/${lead.id}`} className="flex justify-between items-center hover:bg-gray-50 px-2 -mx-2 rounded transition">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{lead.name}</p>
                      <p className="text-xs text-gray-500">{lead.company || 'No company'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        lead.ai_score >= 8 ? 'bg-green-100 text-green-800' :
                        lead.ai_score >= 5 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {lead.ai_score}/10
                      </span>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* AI Activity Log (siste 5) */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">🤖 Recent AI Activity</h2>
            <Link href="/reports" className="text-sm text-blue-600 hover:text-blue-800">
              View reports →
            </Link>
          </div>
          // Etter AI Activity Log, legg til:
<div className="mt-6">
  <AutoFollowup />
</div>
          {stats.recentActivity.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No AI activity yet</p>
          ) : (
            <ul className="space-y-3">
              {stats.recentActivity.map((activity) => (
                <li key={activity.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded transition">
                  <span className="text-xl">
                    {activity.action_type === 'followup_generated' && '✉️'}
                    {activity.action_type === 'score_updated' && '📊'}
                    {activity.action_type === 'email_sent' && '📨'}
                    {activity.action_type === 'booking_initiated' && '📅'}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">⚡ Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/leads?action=new"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition group"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition">
              <svg className="w-5 h-5 text-blue-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <p className="font-medium">Add New Lead</p>
              <p className="text-xs text-gray-500">Create a lead manually</p>
            </div>
          </Link>

          <Link
            href="/tasks"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:shadow-md transition group"
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-600 transition">
              <svg className="w-5 h-5 text-green-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="font-medium">View Tasks</p>
              <p className="text-xs text-gray-500">{stats.tasksToday} tasks due today</p>
            </div>
          </Link>

          <Link
            href="/reports"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-md transition group"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-600 transition">
              <svg className="w-5 h-5 text-purple-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="font-medium">View Reports</p>
              <p className="text-xs text-gray-500">Analytics & insights</p>
            </div>
          </Link>
        </div>
      </div>
    </Layout>
  )
}