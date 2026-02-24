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
  warmLeads: number
  coldLeads: number
  pageCount: number
  pageViews: number
  pageConversions: number
  recentLeads: any[]
  pipelineValue: number
  actualRevenue: number
  convertedLeads: any[]
  lostLeads: number
  previousMonthLeads: number
  previousMonthRevenue: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

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

      // Hent alle leads
      const { data: leadsData } = await supabase
        .from('leads')
        .select('id, name, company, ai_score, status, created_at, title, industry, email, potential_value')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // Hent tasks
      const today = new Date().toISOString().split('T')[0]
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', false)
        .eq('due_date', today)

      // Hent activity log
      const { data: recentLogs } = await supabase
        .from('ai_activity_log')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      // Hent landing pages
      const { data: pagesData } = await supabase
        .from('landing_pages')
        .select('views, conversions')
        .eq('user_id', user.id)

      // Beregn statistikk
      const leadCount = leadsData?.length || 0
      const tasksToday = tasksData?.length || 0
      
      const convertedLeads = leadsData?.filter(l => l.status === 'converted') || []
      const lostLeads = leadsData?.filter(l => l.status === 'lost').length || 0
      
      // Beregn forrige måneds data for trend
      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
      
      const previousMonthLeads = leadsData?.filter(l => 
        new Date(l.created_at) < oneMonthAgo
      ).length || 0

      const previousMonthRevenue = convertedLeads
        .filter(l => new Date(l.created_at) < oneMonthAgo)
        .reduce((sum, l) => sum + (l.potential_value || 0), 0)

      const actualRevenue = convertedLeads.reduce((sum, l) => sum + (l.potential_value || 0), 0)
      const conversionRate = leadCount > 0 ? (convertedLeads.length / leadCount) * 100 : 0
      
      const hotLeads = leadsData?.filter(l => l.ai_score && l.ai_score >= 8 && l.status !== 'converted' && l.status !== 'lost').length || 0
      const warmLeads = leadsData?.filter(l => l.ai_score && l.ai_score >= 5 && l.ai_score < 8 && l.status !== 'converted' && l.status !== 'lost').length || 0
      const coldLeads = leadsData?.filter(l => l.ai_score && l.ai_score < 5 && l.status !== 'converted' && l.status !== 'lost').length || 0
      
      const topLeads = leadsData
        ?.filter(l => l.ai_score && l.status !== 'converted' && l.status !== 'lost')
        ?.sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0))
        ?.slice(0, 5) || []

      const pipelineValue = leadsData?.reduce((sum, l) => {
        if (l.status === 'converted' || l.status === 'lost') return sum
        return sum + (l.potential_value || 0)
      }, 0) || 0

      const recentLeads = leadsData?.slice(0, 5) || []

      const pageCount = pagesData?.length || 0
      const pageViews = pagesData?.reduce((sum, p) => sum + (p.views || 0), 0) || 0
      const pageConversions = pagesData?.reduce((sum, p) => sum + (p.conversions || 0), 0) || 0

      setStats({
        leadCount,
        tasksToday,
        topLeads,
        recentActivity: recentLogs || [],
        conversionRate,
        hotLeads,
        warmLeads,
        coldLeads,
        pageCount,
        pageViews,
        pageConversions,
        recentLeads,
        pipelineValue,
        actualRevenue,
        convertedLeads,
        lostLeads,
        previousMonthLeads,
        previousMonthRevenue
      })

    } catch (error: any) {
      console.error('Error loading dashboard:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Hjelpefunksjon for trend-ikoner (uten lucide-react)
  function TrendIndicator({ current, previous }: { current: number; previous: number }) {
    const difference = current - previous
    const percentChange = previous > 0 ? Math.round((difference / previous) * 100) : 0

    if (difference > 0) {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <span className="text-sm">📈</span>
          <span className="text-xs font-medium">+{percentChange}%</span>
        </div>
      )
    } else if (difference < 0) {
      return (
        <div className="flex items-center gap-1 text-red-600">
          <span className="text-sm">📉</span>
          <span className="text-xs font-medium">{percentChange}%</span>
        </div>
      )
    } else {
      return (
        <div className="flex items-center gap-1 text-gray-400">
          <span className="text-sm">➡️</span>
          <span className="text-xs font-medium">0%</span>
        </div>
      )
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
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
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back! Here's your overview.</p>
      </div>
      
      {/* KPI-kort – 1 kolonne på mobil, 2 på tablet, 4 på desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Leads */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Total Leads</p>
            <span className="text-blue-600 bg-blue-100 p-2 rounded-lg text-lg">👥</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.leadCount}</p>
          <div className="flex items-center justify-between mt-2">
            <TrendIndicator current={stats.leadCount} previous={stats.previousMonthLeads} />
            <span className="text-xs text-gray-500">vs last month</span>
          </div>
        </div>
        
        {/* Tasks Today */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Tasks Today</p>
            <span className="text-orange-600 bg-orange-100 p-2 rounded-lg text-lg">📅</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.tasksToday}</p>
          <p className="text-xs text-gray-500 mt-2">Due today</p>
        </div>
        
        {/* Pipeline Value */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Pipeline Value</p>
            <span className="text-purple-600 bg-purple-100 p-2 rounded-lg text-lg">💰</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">
            ${stats.pipelineValue.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-2">Active opportunities</p>
        </div>
        
        {/* Actual Revenue */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Revenue</p>
            <span className="text-green-600 bg-green-100 p-2 rounded-lg text-lg">🏆</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-green-600">
            ${stats.actualRevenue.toLocaleString()}
          </p>
          <div className="flex items-center justify-between mt-2">
            <TrendIndicator current={stats.actualRevenue} previous={stats.previousMonthRevenue} />
            <span className="text-xs text-gray-500">vs last month</span>
          </div>
        </div>
      </div>

      {/* Lead Score Oversikt – 1 kolonne på mobil, 3 på desktop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <p className="text-sm font-medium text-red-700 mb-1">🔥 Hot Leads (8-10)</p>
          <p className="text-2xl font-bold text-red-800">{stats.hotLeads}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <p className="text-sm font-medium text-yellow-700 mb-1">👍 Warm Leads (5-7)</p>
          <p className="text-2xl font-bold text-yellow-800">{stats.warmLeads}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm font-medium text-blue-700 mb-1">❄️ Cold Leads (1-4)</p>
          <p className="text-2xl font-bold text-blue-800">{stats.coldLeads}</p>
        </div>
      </div>

      {/* Nylige konverteringer – mobilvennlig liste */}
      {stats.convertedLeads.length > 0 && (
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">💰 Recent Customers</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {stats.convertedLeads.slice(0, 5).map((lead) => (
              <div key={lead.id} className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <Link href={`/leads/${lead.id}`} className="font-medium text-blue-600 hover:underline">
                    {lead.name}
                  </Link>
                  <p className="text-sm text-gray-500">
                    {lead.company || '—'} • {lead.potential_value ? `$${lead.potential_value.toLocaleString()}` : 'No value'}
                  </p>
                </div>
                <span className="self-start sm:self-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  Converted
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Topp 5 leads og Landing Pages – 1 kolonne på mobil, 2 på desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Topp 5 leads */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">🔥 Top 5 Active Leads</h2>
            <Link href="/leads" className="text-sm text-blue-600 hover:text-blue-800">
              View all →
            </Link>
          </div>
          
          {stats.topLeads.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No active scored leads</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {stats.topLeads.map((lead) => (
                <li key={lead.id} className="py-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <div>
                      <Link href={`/leads/${lead.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600">
                        {lead.name}
                      </Link>
                      <p className="text-xs text-gray-500">{lead.company || 'No company'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {lead.potential_value && (
                        <span className="text-xs font-medium text-green-600">
                          ${lead.potential_value.toLocaleString()}
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        lead.ai_score >= 8 ? 'bg-red-100 text-red-800' :
                        lead.ai_score >= 5 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {lead.ai_score}/10
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Landing Pages */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">📄 Landing Pages</h2>
            <Link href="/landing-pages" className="text-sm text-blue-600 hover:text-blue-800">
              Manage →
            </Link>
          </div>
          
          {stats.pageCount === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No landing pages yet</p>
              <Link
                href="/landing-pages/ai-generate"
                className="inline-block px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:opacity-90 text-sm"
              >
                🤖 Generate with AI
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                You have <span className="font-semibold">{stats.pageCount}</span> active landing pages
              </p>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.pageViews}</p>
                  <p className="text-xs text-gray-500">Total Views</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.pageConversions}</p>
                  <p className="text-xs text-gray-500">Conversions</p>
                </div>
              </div>
              <Link
                href="/landing-pages/ai-generate"
                className="block text-center mt-4 px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 text-sm"
              >
                + Create New Page
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* AI Activity Log */}
      <div className="mt-6">
        <AIActivityLog />
      </div>
    </Layout>
  )
}