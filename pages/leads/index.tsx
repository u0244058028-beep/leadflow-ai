import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Layout from '@/components/Layout'
import LeadForm from '@/components/LeadForm'
import Link from 'next/link'
import { Lead } from '@/types'

type SortField = 'name' | 'company' | 'status' | 'ai_score' | 'created_at'
type SortOrder = 'asc' | 'desc'

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [showForm, setShowForm] = useState(false)
  const [scoringLead, setScoringLead] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Søk og filtrering state
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [scoreFilter, setScoreFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  // Hent unike statuser for filter
  const statusOptions = ['all', 'new', 'contacted', 'qualified', 'converted', 'lost']
  const scoreOptions = ['all', 'high', 'medium', 'low', 'unscored']

  useEffect(() => {
    loadLeads()
  }, [])

  useEffect(() => {
    // Filtrer og sorter leads når søk/filter endres
    let filtered = [...leads]

    // Tekstsøk
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(lead => 
        lead.name.toLowerCase().includes(term) ||
        (lead.company?.toLowerCase() || '').includes(term) ||
        (lead.email?.toLowerCase() || '').includes(term)
      )
    }

    // Status-filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter)
    }

    // Score-filter
    if (scoreFilter !== 'all') {
      switch (scoreFilter) {
        case 'high':
          filtered = filtered.filter(lead => lead.ai_score && lead.ai_score >= 8)
          break
        case 'medium':
          filtered = filtered.filter(lead => lead.ai_score && lead.ai_score >= 5 && lead.ai_score < 8)
          break
        case 'low':
          filtered = filtered.filter(lead => lead.ai_score && lead.ai_score < 5)
          break
        case 'unscored':
          filtered = filtered.filter(lead => !lead.ai_score)
          break
      }
    }

    // Sortering
    filtered.sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      // Håndter null/undefined
      if (aValue === null || aValue === undefined) aValue = ''
      if (bValue === null || bValue === undefined) bValue = ''

      // Sammenlign
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    setFilteredLeads(filtered)
    setCurrentPage(1) // Reset til første side ved nytt filter
  }, [leads, searchTerm, statusFilter, scoreFilter, sortField, sortOrder])

  async function loadLeads() {
    setLoading(true)
    setError('')
    
    try {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) {
        setError('You must be logged in to view leads')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setLeads(data || [])
      setFilteredLeads(data || [])
    } catch (error: any) {
      console.error('Error loading leads:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateLead(leadData: Partial<Lead>) {
    try {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) {
        alert('You must be logged in to create a lead')
        return
      }

      const { error } = await supabase.from('leads').insert([
        { 
          ...leadData, 
          user_id: user.id,
          created_at: new Date().toISOString()
        }
      ])

      if (error) throw error

      setShowForm(false)
      await loadLeads()
    } catch (error: any) {
      console.error('Error creating lead:', error)
      alert('Failed to create lead: ' + error.message)
    }
  }

  async function rescoreLead(leadId: string) {
    setScoringLead(leadId)
    
    try {
      const { data: notes } = await supabase
        .from('notes')
        .select('content')
        .eq('lead_id', leadId)
        .limit(10)

      const notesText = notes?.map(n => n.content).join(' ') || ''
      const user = (await supabase.auth.getUser()).data.user

      if (!user) {
        throw new Error('Not authenticated')
      }

      const response = await fetch('/api/score-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          notes: notesText,
          userId: user.id,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to score lead')
      }

      await loadLeads()
    } catch (error) {
      console.error('Error scoring lead:', error)
      alert('Failed to score lead')
    } finally {
      setScoringLead(null)
    }
  }

  function getScoreColor(score: number | null | undefined) {
    if (!score) return 'bg-gray-100 text-gray-800'
    if (score >= 8) return 'bg-green-100 text-green-800'
    if (score >= 5) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'contacted': return 'bg-purple-100 text-purple-800'
      case 'qualified': return 'bg-green-100 text-green-800'
      case 'converted': return 'bg-emerald-100 text-emerald-800'
      case 'lost': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Paginering
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage)
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Håndter sortering
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  // Sorteringsikon
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-gray-300 ml-1">↕️</span>
    return <span className="text-blue-600 ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Leads</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          + New Lead
        </button>
      </div>

      {showForm && (
        <div className="mb-6">
          <LeadForm
            onSubmit={handleCreateLead}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Søk og filter-seksjon */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Søkefelt */}
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, company or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Status-filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {statusOptions.map(status => (
                <option key={status} value={status}>
                  {status === 'all' ? 'All statuses' : status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Score-filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">AI Score</label>
            <select
              value={scoreFilter}
              onChange={(e) => setScoreFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All scores</option>
              <option value="high">High (8-10)</option>
              <option value="medium">Medium (5-7)</option>
              <option value="low">Low (1-4)</option>
              <option value="unscored">Not scored</option>
            </select>
          </div>
        </div>

        {/* Aktive filtre */}
        {(searchTerm || statusFilter !== 'all' || scoreFilter !== 'all') && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-sm text-gray-500">Active filters:</span>
            {searchTerm && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                Search: "{searchTerm}"
                <button
                  onClick={() => setSearchTerm('')}
                  className="ml-1 hover:text-blue-600"
                >
                  ×
                </button>
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                Status: {statusFilter}
                <button
                  onClick={() => setStatusFilter('all')}
                  className="ml-1 hover:text-purple-600"
                >
                  ×
                </button>
              </span>
            )}
            {scoreFilter !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                Score: {scoreFilter}
                <button
                  onClick={() => setScoreFilter('all')}
                  className="ml-1 hover:text-green-600"
                >
                  ×
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setScoreFilter('all')
              }}
              className="text-xs text-red-600 hover:text-red-800"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-800 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading leads...
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 mb-4">
              {leads.length === 0 
                ? 'No leads yet. Create your first one!' 
                : 'No leads match your filters'}
            </p>
            {leads.length > 0 && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setScoreFilter('all')
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Clear filters
              </button>
            )}
            {leads.length === 0 && (
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                + Create your first lead
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Header med sortering */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div 
                className="col-span-3 cursor-pointer hover:text-gray-700"
                onClick={() => handleSort('name')}
              >
                Name <SortIcon field="name" />
              </div>
              <div 
                className="col-span-2 cursor-pointer hover:text-gray-700"
                onClick={() => handleSort('company')}
              >
                Company <SortIcon field="company" />
              </div>
              <div className="col-span-2">Contact</div>
              <div 
                className="col-span-2 cursor-pointer hover:text-gray-700"
                onClick={() => handleSort('status')}
              >
                Status <SortIcon field="status" />
              </div>
              <div 
                className="col-span-2 cursor-pointer hover:text-gray-700"
                onClick={() => handleSort('ai_score')}
              >
                AI Score <SortIcon field="ai_score" />
              </div>
              <div className="col-span-1">Actions</div>
            </div>

            {/* Lead-liste */}
            <ul className="divide-y divide-gray-200">
              {paginatedLeads.map((lead) => (
                <li key={lead.id}>
                  <Link href={`/leads/${lead.id}`} className="block hover:bg-gray-50 transition">
                    <div className="px-4 py-4 grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-3">
                        <p className="text-sm font-medium text-blue-600 truncate">
                          {lead.name}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-gray-500 truncate">
                          {lead.company || '—'}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-gray-500 truncate">
                          {lead.email || '—'}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(lead.status)}`}>
                          {lead.status}
                        </span>
                      </div>
                      <div className="col-span-2">
                        {lead.ai_score ? (
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getScoreColor(lead.ai_score)}`}>
                            {lead.ai_score}/10
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              rescoreLead(lead.id)
                            }}
                            disabled={scoringLead === lead.id}
                            className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full hover:bg-purple-200 transition disabled:opacity-50"
                          >
                            {scoringLead === lead.id ? 'Scoring...' : 'Get score'}
                          </button>
                        )}
                      </div>
                      <div className="col-span-1">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Paginering */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredLeads.length)} of {filteredLeads.length} leads
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="ml-2 border border-gray-300 rounded-md text-sm px-2 py-1"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}