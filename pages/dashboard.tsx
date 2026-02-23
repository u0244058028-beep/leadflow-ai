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

      // Kjør alle databasekall parallelt
      const [
        { count: leads },
        { data: tasksData },
        { data: leadsData },
        { data: recentLogs },
        { data: pagesData }
      ] = await Promise.all([
        supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        
        (async () => {
          const today = new Date().toISOString().split('T')[0]
          return supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id)
            .eq('completed', false)
            .eq('due_date', today)
        })(),
        
        supabase
          .from('leads')
          .select('id, name, company, ai_score, status, created_at, title, industry, email')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('ai_activity_log')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10),
        
        supabase
          .from('landing_pages')
          .select('views, conversions')
          .eq('user_id', user.id)
      ])

      // Beregn statistikk
      const leadCount = leads || 0
      const tasksToday = tasksData?.length || 0
      
      const convertedLeads = leadsData?.filter(l => l.status === 'converted').length || 0
      const conversionRate = leadCount > 0 ? (convertedLeads / leadCount) * 100 : 0
      
      const hotLeads = leadsData?.filter(l => l.ai_score && l.ai_score >= 8).length || 0
      const warmLeads = leadsData?.filter(l => l.ai_score && l.ai_score >= 5 && l.ai_score < 8).length || 0
      const coldLeads = leadsData?.filter(l => l.ai_score && l.ai_score < 5).length || 0
      
      const topLeads = leadsData
        ?.filter(l => l.ai_score)
        ?.sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0))
        ?.slice(0, 5) || []

      // Nylige leads (siste 5)
      const recentLeads = leadsData?.slice(0, 5) || []

      // Landing pages statistikk
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
        recentLeads
      })

    } catch (error: any) {
      console.error('Error loading dashboard:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function deleteLead(leadId: string) {
    if (!confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
      return
    }

    setDeletingId(leadId)
    
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId)

      if (error) throw error
      
      // Last data på nytt
      await loadDashboardData()
      
    } catch (error: any) {
      console.error('Error deleting lead:', error)
      alert('Failed to delete lead: ' + error.message)
    } finally {
      setDeletingId(null)
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back! Here's your overview.</p>
      </div>
      
      {/* KPI-kort – 3 kolonner for bedre proporsjoner */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Total Leads</p>
            <span className="text-blue-600 bg-blue-100 p-2 rounded-lg">👥</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.leadCount}</p>
          <p className="text-xs text-gray-500 mt-2">All time</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Tasks Today</p>
            <span className="text-orange-600 bg-orange-100 p-2 rounded-lg">📋</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.tasksToday}</p>
          <p className="text-xs text-gray-500 mt-2">Due today</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
            <span className="text-green-600 bg-green-100 p-2 rounded-lg">📈</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.conversionRate.toFixed(1)}%</p>
          <p className="text-xs text-gray-500 mt-2">Of leads converted</p>
        </div>
      </div>

      {/* Lead Score Oversikt */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <p className="text-sm font-medium text-red-700">🔥 Hot Leads (8-10)</p>
          <p className="text-2xl font-bold text-red-800">{stats.hotLeads}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <p className="text-sm font-medium text-yellow-700">👍 Warm Leads (5-7)</p>
          <p className="text-2xl font-bold text-yellow-800">{stats.warmLeads}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm font-medium text-blue-700">❄️ Cold Leads (1-4)</p>
          <p className="text-2xl font-bold text-blue-800">{stats.coldLeads}</p>
        </div>
      </div>

      {/* Nylige Leads med Slett-knapp */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold">📋 Recent Leads</h2>
          <Link href="/leads" className="text-sm text-blue-600 hover:text-blue-800">
            View all →
          </Link>
        </div>
        
        {stats.recentLeads.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No leads yet. Create your first lead to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.recentLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/leads/${lead.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                        {lead.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lead.company || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lead.title || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {lead.ai_score ? (
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          lead.ai_score >= 8 ? 'bg-red-100 text-red-800' :
                          lead.ai_score >= 5 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {lead.ai_score}/10
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Not scored</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                        lead.status === 'contacted' ? 'bg-purple-100 text-purple-800' :
                        lead.status === 'qualified' ? 'bg-green-100 text-green-800' :
                        lead.status === 'converted' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => deleteLead(lead.id)}
                          disabled={deletingId === lead.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          {deletingId === lead.id ? '...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Topp 5 leads og Landing Pages */}
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
                  <div className="flex justify-between items-center">
                    <div>
                      <Link href={`/leads/${lead.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600">
                        {lead.name}
                      </Link>
                      <p className="text-xs text-gray-500">{lead.company || 'No company'}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      lead.ai_score >= 8 ? 'bg-red-100 text-red-800' :
                      lead.ai_score >= 5 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {lead.ai_score}/10
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Landing Pages */}
        <div className="bg-white p-6 rounded-lg shadow">
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
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:opacity-90"
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
                  <p className="text-2xl font-bold text-blue-600">{stats.pageViews}</p>
                  <p className="text-xs text-gray-500">Total Views</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-2xl font-bold text-green-600">{stats.pageConversions}</p>
                  <p className="text-xs text-gray-500">Conversions</p>
                </div>
              </div>
              <Link
                href="/landing-pages/ai-generate"
                className="block text-center mt-4 px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200"
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