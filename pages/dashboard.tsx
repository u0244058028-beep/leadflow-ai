import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Layout from '@/components/Layout'
import Link from 'next/link'
import AIActivityLog from '@/components/AIActivityLog'
import AutoFollowup from '@/components/AutoFollowup'  // ← LEGG TIL DENNE IMPORTERINGEN!

interface DashboardStats {
  leadCount: number
  tasksToday: number
  topLeads: any[]
  recentActivity: any[]
  conversionRate: number
  hotLeads: number
  pageCount: number
  pageViews: number
  pageConversions: number
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

      // Kjør alle databasekall parallelt
      const [
        { count: leads },
        { data: tasksData },
        { data: leadsData },
        { data: recentLogs },
        { data: pagesData }
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
        
        // Nylig AI-aktivitet
        supabase
          .from('ai_activity_log')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
        
        // Landing pages data
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
      
      const topLeads = leadsData
        ?.filter(l => l.ai_score)
        ?.sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0))
        ?.slice(0, 5) || []

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
        pageCount,
        pageViews,
        pageConversions
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
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
            <p className="text-sm font-medium text-gray-600">Hot Leads</p>
            <span className="text-red-600 bg-red-100 p-2 rounded-lg">🔥</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.hotLeads}</p>
          <p className="text-xs text-gray-500 mt-2">Score ≥ 8</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Landing Pages</p>
            <span className="text-purple-600 bg-purple-100 p-2 rounded-lg">📄</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.pageCount}</p>
          <p className="text-xs text-gray-500 mt-2">{stats.pageViews} views • {stats.pageConversions} leads</p>
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
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      lead.ai_score >= 8 ? 'bg-green-100 text-green-800' :
                      lead.ai_score >= 5 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {lead.ai_score}/10
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Nylige landing pages */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">📄 Recent Landing Pages</h2>
            <Link href="/landing-pages" className="text-sm text-blue-600 hover:text-blue-800">
              Manage pages →
            </Link>
          </div>
          
          {stats.pageCount === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No landing pages yet</p>
              <Link
                href="/landing-pages/new"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create your first page
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 text-center py-4">
                You have {stats.pageCount} active landing pages with {stats.pageConversions} total conversions
              </p>
              <div className="flex gap-2">
                <Link
                  href="/landing-pages"
                  className="flex-1 text-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  View all pages
                </Link>
                <Link
                  href="/landing-pages/new"
                  className="flex-1 text-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  + New page
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Activity Log */}
      <div className="mt-6">
        <AIActivityLog />
      </div>

      {/* Auto Followup Component */}
      <div className="mt-6">
        <AutoFollowup />
      </div>
    </Layout>
  )
}