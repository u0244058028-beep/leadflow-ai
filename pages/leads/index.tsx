import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Layout from '@/components/Layout'
import LeadForm from '@/components/LeadForm'
import Link from 'next/link'
import { Lead } from '@/types'
import { useDebounce } from '@/hooks/useDebounce'
import Button from '@/components/Button'
import { useToast } from '@/components/Toast'
import ErrorMessage from '@/components/ErrorMessage'

type SortField = 'name' | 'company' | 'status' | 'ai_score' | 'created_at' | 'potential_value'
type SortOrder = 'asc' | 'desc'

export default function LeadsPage() {
  const toast = useToast()
  const [leads, setLeads] = useState<Lead[]>([])
  const [showForm, setShowForm] = useState(false)
  const [scoringLead, setScoringLead] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterLoading, setFilterLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [scoreFilter, setScoreFilter] = useState<string>('all')
  const [favoriteFilter, setFavoriteFilter] = useState<boolean | null>(null)
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [togglingFavorite, setTogglingFavorite] = useState<string | null>(null)

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const statusOptions = ['all', 'new', 'contacted', 'qualified', 'converted', 'lost']
  const scoreOptions = ['all', 'high', 'medium', 'low', 'unscored']

  async function loadLeads() {
    setLoading(true)
    setError(null)
    
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
      
    } catch (error: any) {
      console.error('Error loading leads:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLeads()
  }, [])

  // Toggle favorite
  async function toggleFavorite(leadId: string, currentValue: boolean) {
    setTogglingFavorite(leadId)
    try {
      const { error } = await supabase
        .from('leads')
        .update({ is_favorite: !currentValue })
        .eq('id', leadId)

      if (error) throw error

      // Oppdater lokal state
      setLeads(leads.map(lead => 
        lead.id === leadId 
          ? { ...lead, is_favorite: !currentValue }
          : lead
      ))
      
      toast.success(currentValue ? 'Removed from favorites' : 'Added to favorites')
    } catch (error) {
      console.error('Error toggling favorite:', error)
      toast.error('Failed to update favorite')
    } finally {
      setTogglingFavorite(null)
    }
  }

  const filteredLeads = useMemo(() => {
    if (!leads.length) return []
    
    setFilterLoading(true)
    
    let filtered = [...leads]

    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase()
      filtered = filtered.filter(lead => 
        lead.name.toLowerCase().includes(term) ||
        (lead.company?.toLowerCase() || '').includes(term) ||
        (lead.email?.toLowerCase() || '').includes(term)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter)
    }

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

    if (favoriteFilter !== null) {
      filtered = filtered.filter(lead => lead.is_favorite === favoriteFilter)
    }

    filtered.sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]
      if (aValue === null || aValue === undefined) aValue = ''
      if (bValue === null || bValue === undefined) bValue = ''
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    setFilterLoading(false)
    return filtered
  }, [leads, debouncedSearchTerm, statusFilter, scoreFilter, favoriteFilter, sortField, sortOrder])

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchTerm, statusFilter, scoreFilter, favoriteFilter, sortField, sortOrder])

  async function handleCreateLead(leadData: Partial<Lead>) {
    try {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) {
        toast.error('You must be logged in')
        return
      }

      const { error } = await supabase.from('leads').insert([
        { 
          ...leadData, 
          user_id: user.id,
          created_at: new Date().toISOString(),
          is_favorite: false
        }
      ])

      if (error) throw error

      setShowForm(false)
      await loadLeads()
      toast.success('Lead created successfully')
    } catch (error: any) {
      console.error('Error creating lead:', error)
      toast.error('Failed to create lead: ' + error.message)
    }
  }

  async function rescoreLead(leadId: string) {
    if (!leadId) {
      toast.error('Invalid lead ID')
      return
    }
    
    setScoringLead(leadId)
    
    try {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) {
        toast.error('You must be logged in')
        setScoringLead(null)
        return
      }

      const lead = leads.find(l => l.id === leadId)
      
      const { data: notes } = await supabase
        .from('notes')
        .select('content')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(10)

      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('lead_id', leadId)

      const { data: emails } = await supabase
        .from('ai_activity_log')
        .select('*')
        .eq('lead_id', leadId)
        .eq('action_type', 'email_sent')

      const notesText = notes?.map(n => n.content).join('\n') || ''
      const taskCount = tasks?.length || 0
      const emailCount = emails?.length || 0

      const prompt = `Score this lead 1-10 based on:
- Title: ${lead?.title || 'none'} (CEO/Founder = +4, Manager = +2)
- Industry: ${lead?.industry || 'unknown'} (SaaS/Tech = +3, Consulting = +2)
- Notes count: ${notes?.length || 0} (+1 each, max +3)
- Tasks count: ${taskCount} (+1 each, max +2)
- Emails sent: ${emailCount} (+1 each, max +2)

Return ONLY a number between 1-10.`

      const response = await window.puter.ai.chat(prompt, {
        model: "gpt-5.1-codex"
      })

      let scoreText = ''
      if (typeof response === 'string') {
        scoreText = response
      } else if (response?.message?.content) {
        scoreText = response.message.content
      } else if (response?.choices?.[0]?.message?.content) {
        scoreText = response.choices[0].message.content
      }

      const scoreMatch = scoreText.match(/\d+/)
      const score = scoreMatch ? parseInt(scoreMatch[0]) : 5
      const finalScore = Math.min(10, Math.max(1, score))

      let reason = 'Score updated'
      if (lead?.title?.toLowerCase().includes('ceo') || lead?.title?.toLowerCase().includes('founder')) {
        reason = 'Decision maker with budget authority'
      } else if (lead?.title?.toLowerCase().includes('manager') || lead?.title?.toLowerCase().includes('head')) {
        reason = 'Manager with influence'
      } else if (lead?.industry?.toLowerCase().includes('saas') || lead?.industry?.toLowerCase().includes('tech')) {
        reason = 'In relevant industry'
      }

      await supabase
        .from('leads')
        .update({ 
          ai_score: finalScore,
          last_scored: new Date().toISOString(),
          score_reason: reason
        })
        .eq('id', leadId)

      await supabase.from('ai_activity_log').insert({
        user_id: user.id,
        lead_id: leadId,
        action_type: 'score_updated',
        description: `Lead scored ${finalScore}/10 - ${reason}`
      })

      await loadLeads()
      toast.success(`Lead scored ${finalScore}/10!`)
      
    } catch (error: any) {
      console.error('❌ Error scoring lead:', error)
      toast.error('Failed to score lead: ' + (error.message || 'Unknown error'))
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

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage)
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-gray-300 ml-1">↕️</span>
    return <span className="text-blue-600 ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
  }

  if (error) {
    return (
      <Layout>
        <div className="p-8 max-w-md mx-auto">
          <ErrorMessage 
            message={error} 
            onRetry={() => loadLeads()}
          />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Leads</h1>
        <Button
          onClick={() => setShowForm(true)}
          variant="primary"
        >
          + New Lead
        </Button>
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
        <div className="space-y-4">
          <div>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {filterLoading && (
                <div className="absolute right-3 top-2.5">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-600"></div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">AI Score</label>
              <select
                value={scoreFilter}
                onChange={(e) => setScoreFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All</option>
                <option value="high">High (8-10)</option>
                <option value="medium">Medium (5-7)</option>
                <option value="low">Low (1-4)</option>
                <option value="unscored">Not scored</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Favorites</label>
              <select
                value={favoriteFilter === null ? 'all' : favoriteFilter ? 'favorites' : 'non-favorites'}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === 'all') setFavoriteFilter(null)
                  else if (val === 'favorites') setFavoriteFilter(true)
                  else setFavoriteFilter(false)
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All</option>
                <option value="favorites">⭐ Favorites only</option>
                <option value="non-favorites">Non-favorites</option>
              </select>
            </div>
          </div>
        </div>

        {(searchTerm || statusFilter !== 'all' || scoreFilter !== 'all' || favoriteFilter !== null) && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-sm text-gray-500">Active filters:</span>
            {searchTerm && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                "{searchTerm}"
                <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-blue-600">×</button>
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                {statusFilter}
                <button onClick={() => setStatusFilter('all')} className="ml-1 hover:text-purple-600">×</button>
              </span>
            )}
            {scoreFilter !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                {scoreFilter}
                <button onClick={() => setScoreFilter('all')} className="ml-1 hover:text-green-600">×</button>
              </span>
            )}
            {favoriteFilter !== null && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                {favoriteFilter ? '⭐ Favorites' : 'Non-favorites'}
                <button onClick={() => setFavoriteFilter(null)} className="ml-1 hover:text-yellow-600">×</button>
              </span>
            )}
            <button
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setScoreFilter('all')
                setFavoriteFilter(null)
              }}
              className="text-xs text-red-600 hover:text-red-800"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600 mb-4"></div>
            <p className="text-gray-500">Loading leads...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 mb-4">
              {leads.length === 0 
                ? 'No leads yet. Create your first one!' 
                : 'No leads match your filters'}
            </p>
            {leads.length > 0 && (
              <Button
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setScoreFilter('all')
                  setFavoriteFilter(null)
                }}
                variant="secondary"
              >
                Clear filters
              </Button>
            )}
            {leads.length === 0 && (
              <Button
                onClick={() => setShowForm(true)}
                variant="primary"
              >
                + Create your first lead
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* MOBILVISNING */}
            <div className="block sm:hidden divide-y divide-gray-200">
              {paginatedLeads.map((lead) => (
                <div key={lead.id} className="p-4 hover:bg-gray-50">
                  <Link href={`/leads/${lead.id}`} className="block">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-blue-600">{lead.name}</p>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              toggleFavorite(lead.id, lead.is_favorite || false)
                            }}
                            disabled={togglingFavorite === lead.id}
                            className="text-lg"
                          >
                            {lead.is_favorite ? '⭐' : '☆'}
                          </button>
                        </div>
                        {lead.title && <p className="text-xs text-gray-500">{lead.title}</p>}
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                      <div>
                        <span className="text-xs text-gray-400">Company</span>
                        <p className="truncate">{lead.company || '—'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400">Value</span>
                        <p className="truncate font-medium text-green-600">
                          {lead.potential_value ? `$${lead.potential_value.toLocaleString()}` : '—'}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400">Email</span>
                        <p className="truncate">{lead.email || '—'}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      {lead.ai_score ? (
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getScoreColor(lead.ai_score)}`}>
                            Score: {lead.ai_score}/10
                          </span>
                          {lead.score_reason && (
                            <span className="text-xs text-gray-500 truncate max-w-[150px]" title={lead.score_reason}>
                              {lead.score_reason}
                            </span>
                          )}
                        </div>
                      ) : (
                        <Button
                          onClick={(e) => {
                            e.preventDefault()
                            rescoreLead(lead.id)
                          }}
                          disabled={scoringLead === lead.id}
                          variant="secondary"
                          size="sm"
                        >
                          {scoringLead === lead.id ? 'Scoring...' : '🤖 Get AI score'}
                        </Button>
                      )}
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                </div>
              ))}
            </div>

            {/* DESKTOPVISNING */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ⭐
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700" onClick={() => handleSort('name')}>
                      Name <SortIcon field="name" />
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700" onClick={() => handleSort('company')}>
                      Company <SortIcon field="company" />
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700" onClick={() => handleSort('potential_value')}>
                      Value <SortIcon field="potential_value" />
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700" onClick={() => handleSort('status')}>
                      Status <SortIcon field="status" />
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700" onClick={() => handleSort('ai_score')}>
                      AI Score <SortIcon field="ai_score" />
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleFavorite(lead.id, lead.is_favorite || false)}
                          disabled={togglingFavorite === lead.id}
                          className="text-xl focus:outline-none"
                        >
                          {lead.is_favorite ? '⭐' : '☆'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link href={`/leads/${lead.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                          {lead.name}
                        </Link>
                        {lead.title && (
                          <p className="text-xs text-gray-500 mt-1">{lead.title}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900">{lead.company || '—'}</p>
                        {lead.industry && (
                          <p className="text-xs text-gray-500 mt-1">{lead.industry}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lead.email || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {lead.potential_value ? (
                          <span className="font-medium text-green-600">
                            ${lead.potential_value.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {lead.ai_score ? (
                          <div className="flex flex-col">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getScoreColor(lead.ai_score)}`}>
                              {lead.ai_score}/10
                            </span>
                            {lead.score_reason && (
                              <span className="text-xs text-gray-500 mt-1 italic max-w-[200px]" title={lead.score_reason}>
                                {lead.score_reason}
                              </span>
                            )}
                          </div>
                        ) : (
                          <Button
                            onClick={() => rescoreLead(lead.id)}
                            disabled={scoringLead === lead.id}
                            variant="secondary"
                            size="sm"
                          >
                            {scoringLead === lead.id ? 'Scoring...' : 'Get AI score'}
                          </Button>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link href={`/leads/${lead.id}`} className="text-blue-600 hover:text-blue-900">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginering */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredLeads.length)} of {filteredLeads.length}
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="border border-gray-300 rounded-md text-sm px-2 py-1"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
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
                <span className="px-3 py-1 text-sm">Page {currentPage} of {totalPages}</span>
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