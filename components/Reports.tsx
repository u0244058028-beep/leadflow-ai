import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'

interface ReportData {
  totalLeads: number
  conversionRate: number
  pipelineValue: number
  statusDistribution: { name: string; value: number }[]
  scoreDistribution: { range: string; count: number }[]
  leadsOverTime: { month: string; count: number }[]
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6b7280']

export default function Reports() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | '12m'>('30d')

  useEffect(() => {
    loadReportData()
  }, [timeframe])

  async function loadReportData() {
    setLoading(true)
    try {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) return

      // Hent alle leads for denne brukeren
      const { data: leads } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)

      if (!leads) return

      // 1. Total leads
      const totalLeads = leads.length

      // 2. Konverteringsrate (leads med status 'converted')
      const convertedLeads = leads.filter(l => l.status === 'converted').length
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0

      // 3. Pipeline-verdi (estimat – kan tilpasses senere)
      const pipelineValue = leads.reduce((sum, lead) => {
        // Antar at hver lead har en potensiell verdi basert på score
        const estimatedValue = lead.ai_score ? lead.ai_score * 1000 : 500
        return sum + estimatedValue
      }, 0)

      // 4. Status-fordeling
      const statusMap = new Map<string, number>()
      leads.forEach(lead => {
        statusMap.set(lead.status, (statusMap.get(lead.status) || 0) + 1)
      })
      const statusDistribution = Array.from(statusMap.entries()).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value
      }))

      // 5. Score-fordeling
      const scoreRanges = [
        { range: '1-3', min: 1, max: 3, count: 0 },
        { range: '4-6', min: 4, max: 6, count: 0 },
        { range: '7-8', min: 7, max: 8, count: 0 },
        { range: '9-10', min: 9, max: 10, count: 0 },
      ]
      
      leads.forEach(lead => {
        if (lead.ai_score) {
          const range = scoreRanges.find(r => lead.ai_score >= r.min && lead.ai_score <= r.max)
          if (range) range.count++
        }
      })
      
      const scoreDistribution = scoreRanges.map(r => ({ range: r.range, count: r.count }))

      // 6. Leads over tid (siste 12 måneder)
      const months: { [key: string]: number } = {}
      const now = new Date()
      
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        months[key] = 0
      }

      leads.forEach(lead => {
        const date = new Date(lead.created_at)
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (months[key] !== undefined) {
          months[key]++
        }
      })

      const leadsOverTime = Object.entries(months).map(([month, count]) => {
        const [year, monthNum] = month.split('-')
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        return {
          month: `${monthNames[parseInt(monthNum) - 1]} ${year}`,
          count
        }
      })

      setData({
        totalLeads,
        conversionRate,
        pipelineValue,
        statusDistribution,
        scoreDistribution,
        leadsOverTime
      })

    } catch (error) {
      console.error('Error loading report data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-center text-gray-500">Loading reports...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-center text-gray-500">No data available</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tidsfilter */}
      <div className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Analytics & Reports</h2>
        <div className="flex gap-2">
          {['7d', '30d', '90d', '12m'].map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t as any)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                timeframe === t
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* KPI-kort */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600 mb-1">Total Leads</p>
          <p className="text-3xl font-bold text-gray-900">{data.totalLeads}</p>
          <p className="text-xs text-gray-500 mt-2">All time</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600 mb-1">Conversion Rate</p>
          <p className="text-3xl font-bold text-green-600">{data.conversionRate.toFixed(1)}%</p>
          <p className="text-xs text-gray-500 mt-2">{data.statusDistribution.find(s => s.name === 'Converted')?.value || 0} converted</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600 mb-1">Pipeline Value</p>
          <p className="text-3xl font-bold text-blue-600">${data.pipelineValue.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-2">Estimated opportunity value</p>
        </div>
      </div>

      {/* Graf 1: Leads over tid */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-md font-semibold mb-4">Leads Over Time</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.leadsOverTime}>
              <defs>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#3b82f6" fillOpacity={1} fill="url(#colorLeads)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Graf 2 og 3: Fordelinger */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status-fordeling */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-md font-semibold mb-4">Leads by Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Score-fordeling */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-md font-semibold mb-4">Leads by AI Score</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detaljert tabell over leads */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-md font-semibold mb-4">Lead Details</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Value</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Her kan du legge til leads hvis du vil */}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}