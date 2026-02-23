import { useState } from 'react'
import Layout from '@/components/Layout'
import Reports from '@/components/Reports'

export default function ReportsPage() {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | '12m' | 'all'>('30d')

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header med tidsfilter – mobilvennlig */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Analytics & Reports</h1>
              <p className="text-sm text-gray-500 mt-1">
                Insights into your lead pipeline and performance
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-lg">
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
                    className={`px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition flex-1 sm:flex-none ${
                      timeframe === t.value
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              
              <button className="px-3 sm:px-4 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-xs sm:text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* KPI-kort – 2 kolonner på mobil, 5 på desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total Leads</p>
            <p className="text-xl sm:text-3xl font-bold text-gray-900">14</p>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Conversion</p>
            <p className="text-xl sm:text-3xl font-bold text-green-600">0.0%</p>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Pipeline</p>
            <p className="text-xl sm:text-3xl font-bold text-blue-600">$5.4k</p>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Avg Score</p>
            <p className="text-xl sm:text-3xl font-bold text-purple-600">2.3</p>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Time to Convert</p>
            <p className="text-xl sm:text-3xl font-bold text-orange-600">0d</p>
          </div>
        </div>

        {/* Graf – horisontal scroll på mobil */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm sm:text-md font-semibold">Leads Over Time</h3>
            <span className="text-xs text-gray-500">Monthly</span>
          </div>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="min-w-[600px] sm:min-w-0 h-64 px-4 sm:px-0">
              {/* Grafen kommer her */}
              <div className="w-full h-full bg-gray-50 rounded flex items-center justify-center text-gray-400">
                Chart placeholder
              </div>
            </div>
          </div>
        </div>

        {/* Resten av Reports-komponenten */}
        <Reports />
      </div>
    </Layout>
  )
}