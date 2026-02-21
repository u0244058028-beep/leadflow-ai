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
  averageScore: number
  avgTimeToConversion: number
  statusDistribution: { name: string; value: number }[]
  scoreDistribution: { range: string; count: number }[]
  leadsOverTime: { month: string; count: number }[]
  conversionByMonth: { month: string; rate: number }[]
  topLeads: any[]
}

const COLORS = {
  new: '#3b82f6',
  contacted: '#8b5cf6',
  qualified: '#10b981',
  converted: '#059669',
  lost: '#6b7280'
}

const STATUS_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#059669', '#6b7280']

export default function Reports() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | '12m' | 'all'>('30d')
  const [exportLoading, setExportLoading] = useState(false)

  useEffect(() => {
    loadReportData()
  }, [timeframe])

  async function loadReportData() {
    setLoading(true)
    try {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) return

      // Hent alle leads for denne brukeren
      let query = supabase
        .from('leads')
        .select(`
          *,
          tasks(*),
          notes(*)
        `)
        .eq('user_id', user.id)

      // Filtrer basert på timeframe
      const now = new Date()
      if (timeframe !== 'all') {
        let days = 30
        if (timeframe === '7d') days = 7
        if (timeframe === '90d') days = 90
        if (timeframe === '12m') days = 365
        
        const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
        query = query.gte('created_at', cutoff.toISOString())
      }

      const { data: leads } = await query.order('created_at', { ascending: false })

      if (!leads) return

      // 1. Total leads
      const totalLeads = leads.length

      // 2. Konverteringsrate
      const convertedLeads = leads.filter(l => l.status === 'converted').length
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0

      // 3. Pipeline-verdi (estimat basert på score og status)
      const pipelineValue = leads.reduce((sum, lead) => {
        let value = 0
        if (lead.status === 'converted') value = 5000
        else if (lead.status === 'qualified') value = 3000
        else if (lead.status === 'contacted') value = 1000
        else if (lead.status === 'new') value = 500
        
        // Juster basert på score
        if (lead.ai_score) {
          value = value * (lead.ai_score / 5)
        }
        return sum + value
      }, 0)

      // 4. Gjennomsnittlig score
      const leadsWithScore = leads.filter(l => l.ai_score)
      const averageScore = leadsWithScore.length > 0
        ? leadsWithScore.reduce((sum, l) => sum + l.ai_score, 0) / leadsWithScore.length
        : 0

      // 5. Gjennomsnittlig tid til konvertering (dager)
      const convertedWithDates = leads.filter(l => 
        l.status === 'converted' && l.created_at && l.updated_at
      )
      const avgTimeToConversion = convertedWithDates.length > 0
        ? convertedWithDates.reduce((sum, l) => {
            const created = new Date(l.created_at)
            const converted = new Date(l.updated_at)
            const days = (converted.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
            return sum + days
          }, 0) / convertedWithDates.length
        : 0

      // 6. Status-fordeling
      const statusMap = new Map<string, number>()
      leads.forEach(lead => {
        statusMap.set(lead.status, (statusMap.get(lead.status) || 0) + 1)
      })
      const statusDistribution = Array.from(statusMap.entries()).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value
      }))

      // 7. Score-fordeling
      const scoreRanges = [
        { range: '1-3 (Cold)', min: 1, max: 3, count: 0 },
        { range: '4-6 (Warm)', min: 4, max: 6, count: 0 },
        { range: '7-8 (Hot)', min: 7, max: 8, count: 0 },
        { range: '9-10 (Ready)', min: 9, max: 10, count: 0 },
      ]
      
      leads.forEach(lead => {
        if (lead.ai_score) {
          const range = scoreRanges.find(r => lead.ai_score >= r.min && lead.ai_score <= r.max)
          if (range) range.count++
        }
      })
      
      const scoreDistribution = scoreRanges.map(r => ({ range: r.range, count: r.count }))

      // 8. Leads over tid
      const months: { [key: string]: number } = {}
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      
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
        return {
          month: `${monthNames[parseInt(monthNum) - 1]} ${year}`,
          count
        }
      })

      // 9. Konverteringsrate over tid
      const conversionByMonth = Object.entries(months).map(([month, total]) => {
        const [year, monthNum] = month.split('-')
        const startOfMonth = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
        const endOfMonth = new Date(parseInt(year), parseInt(monthNum), 0)
        
        const convertedThisMonth = leads.filter(l => 
          l.status === 'converted' &&
          new Date(l.updated_at) >= startOfMonth &&
          new Date(l.updated_at) <= endOfMonth
        ).length
        
        return {
          month: `${monthNames[parseInt(monthNum) - 1]} ${year}`,
          rate: total > 0 ? (convertedThisMonth / total) * 100 : 0
        }
      })

      // 10. Topp leads
      const topLeads = leads
        .filter(l => l.ai_score)
        .sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0))
        .slice(0, 5)
        .map(l => ({
          id: l.id,
          name: l.name,
          company: l.company,
          score: l.ai_score,
          status: l.status,
          value: l.status === 'converted' ? 5000 : l.ai_score * 500
        }))

      setData({
        totalLeads,
        conversionRate,
        pipelineValue,
        averageScore,
        avgTimeToConversion,
        statusDistribution,
        scoreDistribution,
        leadsOverTime,
        conversionByMonth,
        topLeads
      })

    } catch (error) {
      console.error('Error loading report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = async () => {
    setExportLoading(true)
    try {
      const user = (await supabase.auth.getUser()).data.user
      if (!user || !data) return

      const { data: leads } = await supabase
        .from('leads')
        .select('*, tasks(*), notes(*)')
        .eq('user_id', user.id)

      // Konverter til CSV
      const csvData = leads?.map(l => ({
        Name: l.name,
        Company: l.company || '',
        Email: l.email || '',
        Phone: l.phone || '',
        Status: l.status,
        'AI Score': l.ai_score || '',
        Created: new Date(l.created_at).toLocaleDateString(),
        'Task Count': l.tasks?.length || 0,
        'Note Count': l.notes?.length || 0
      }))

      if (!csvData) return

      // Lag CSV-streng
      const headers = Object.keys(csvData[0]).join(',')
      const rows = csvData.map(row => Object.values(row).join(','))
      const csv = [headers, ...rows].join('\n')

      // Last ned
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
    } catch (error) {
      console.error('Error exporting data:', error)
    } finally {
      setExportLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600 mb-4"></div>
          <p className="text-gray-500">Loading reports...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow p-12">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No data available for this period</p>
          <button
            onClick={() => setTimeframe('all')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            View all time
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header med tidsfilter og eksport */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-sm text-gray-500 mt-1">
            Insights into your lead pipeline and performance
          </p>
        </div>
        
        <div className="flex gap-2">
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            {[
              { value: '7d', label: '7D' },
              { value: '30d', label: '30D' },
              { value: '90d', label: '90D' },
              { value: '12m', label: '12M' },
              { value: 'all', label: 'All' }
            ].map((t) => (
              <button
                key={t.value}
                onClick={() => setTimeframe(t.value as any)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                  timeframe === t.value
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          
          <button
            onClick={exportToCSV}
            disabled={exportLoading}
            className="px-4 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {exportLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Exporting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI-kort med forklaringer */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Total Leads</p>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {timeframe === 'all' ? 'All time' : timeframe}
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{data.totalLeads}</p>
          <p className="text-xs text-gray-500 mt-2">All leads in selected period</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Conversion Rate</p>
          <p className="text-3xl font-bold text-green-600">{data.conversionRate.toFixed(1)}%</p>
          <p className="text-xs text-gray-500 mt-2">
            {data.statusDistribution.find(s => s.name === 'Converted')?.value || 0} converted
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Pipeline Value</p>
          <p className="text-3xl font-bold text-blue-600">${Math.round(data.pipelineValue).toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-2">Estimated opportunity value</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Avg. AI Score</p>
          <p className="text-3xl font-bold text-purple-600">{data.averageScore.toFixed(1)}/10</p>
          <p className="text-xs text-gray-500 mt-2">Across all scored leads</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Time to Convert</p>
          <p className="text-3xl font-bold text-orange-600">{Math.round(data.avgTimeToConversion)}d</p>
          <p className="text-xs text-gray-500 mt-2">Average days to conversion</p>
        </div>
      </div>

      {/* Graf 1: Leads over tid */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-semibold">Leads Over Time</h3>
          <div className="text-xs text-gray-500">Monthly new leads</div>
        </div>
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
              <Area type="monotone" dataKey="count" stroke="#3b82f6" fillOpacity={1} fill="url(#colorLeads)" name="New Leads" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Graf 2: Konverteringsrate over tid */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-semibold">Conversion Rate Over Time</h3>
          <div className="text-xs text-gray-500">Monthly conversion %</div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.conversionByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2} name="Conversion Rate %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Graf 3 og 4: Fordelinger */}
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
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
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
                <Bar dataKey="count" fill="#8b5cf6" name="Number of Leads" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Topp 5 leads */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-md font-semibold">Top 5 Leads by AI Score</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.topLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{lead.company || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      lead.status === 'converted' ? 'bg-green-100 text-green-800' :
                      lead.status === 'qualified' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-sm font-medium ${
                        lead.score >= 8 ? 'text-green-600' :
                        lead.score >= 5 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {lead.score}/10
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">${lead.value.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <a
                      href={`/leads/${lead.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View →
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Forklaring på KPI-er */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">📊 About these metrics</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-blue-700">
          <div>
            <span className="font-medium">Pipeline Value:</span> Estimated based on lead status and AI score. Converted leads = $5,000, Qualified = $3,000, Contacted = $1,000, New = $500.
          </div>
          <div>
            <span className="font-medium">AI Score:</span> 1-3 (Cold), 4-6 (Warm), 7-8 (Hot), 9-10 (Ready to convert). Updated automatically with new notes.
          </div>
          <div>
            <span className="font-medium">Time to Convert:</span> Average number of days from lead creation to status = "converted".
          </div>
        </div>
      </div>
    </div>
  )
}