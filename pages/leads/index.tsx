import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Layout from '@/components/Layout'
import LeadForm from '@/components/LeadForm'
import Link from 'next/link'
import { Lead } from '@/types'
import { useDebounce } from '@/hooks/useDebounce'

type SortField = 'name' | 'company' | 'status' | 'ai_score' | 'created_at'
type SortOrder = 'asc' | 'desc'

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [showForm, setShowForm] = useState(false)
  const [scoringLead, setScoringLead] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterLoading, setFilterLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [scoreFilter, setScoreFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const statusOptions = ['all', 'new', 'contacted', 'qualified', 'converted', 'lost']
  const scoreOptions = ['all', 'high', 'medium', 'low', 'unscored']

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
  }, [leads, debouncedSearchTerm, statusFilter, scoreFilter, sortField, sortOrder])

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchTerm, statusFilter, scoreFilter, sortField, sortOrder])

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

  // 🎯 OPPDATERT AI-scoring med smart logikk (uten source)
  async function rescoreLead(leadId: string) {
    if (!leadId) {
      alert('Invalid lead ID')
      return
    }
    
    setScoringLead(leadId)
    
    try {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) {
        alert('You must be logged in')
        setScoringLead(null)
        return
      }

      // Hent ALLE data om leadet
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

      // 🎯 SMART PROMPT for lead-scoring (uten source)
      const prompt = `You are an expert B2B sales lead scorer. Score this lead 1-10 based on:

JOB TITLE SCORING:
- CEO/Founder/Director/Vice President/C-level = +4 points
- Manager/Head of = +2 points
- Individual contributor = +1 point
- No title = 0 points

INDUSTRY RELEVANCE:
- SaaS/Technology/Software/AI = +3 points
- Consulting/Professional Services/Marketing = +2 points
- Other industries = +1 point

ENGAGEMENT SCORING:
- Each note = +1 point (max +3)
- Each task = +1 point (max +2)
- Each email = +1 point (max +2)

LEAD DATA:
Name: ${lead?.name}
Title: ${lead?.title || 'Not specified'}
Company: ${lead?.company || 'Unknown'}
Industry: ${lead?.industry || 'Unknown'}

ENGAGEMENT METRICS:
Notes count: ${notes?.length || 0}
Tasks count: ${taskCount}
Emails sent: ${emailCount}

RECENT NOTES:
${notesText || 'No notes'}

Calculate the total score based on the criteria above. 
Start from 1 (cold) and add points based on the scoring guide.
Return ONLY a number between 1-10.`

      console.log('Scoring lead with prompt:', prompt)

      const response = await window.puter.ai.chat(prompt, {
        model: 'google/gemini-2.5-flash',
        temperature: 0.2,
        max_tokens: 5
      })

      console.log('Raw AI response:', response)

      // Ekstraher score
      let scoreText = '5'
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

      // Generer forklaring basert på data
      let reason = 'Score updated'
      
      if (lead?.title?.toLowerCase().includes('ceo') || lead?.title?.toLowerCase().includes('founder')) {
        reason = 'Decision maker with budget authority'
      } else if (lead?.title?.toLowerCase().includes('manager') || lead?.title?.toLowerCase().includes('head')) {
        reason = 'Manager with influence but may need approval'
      } else if (lead?.industry?.toLowerCase().includes('saas') || lead?.industry?.toLowerCase().includes('tech')) {
        reason = 'In relevant industry with potential for growth'
      } else if (notes?.length && notes.length > 0) {
        reason = 'Engaged through conversations and follow-ups'
      } else {
        const reasonPrompt = `Explain in one sentence why this lead scored ${finalScore}/10.
        Focus on the most important factor: title (${lead?.title || 'none'}), industry (${lead?.industry || 'unknown'}), or engagement (${notes?.length || 0} notes).
        Keep it concise and professional.`

        const reasonResponse = await window.puter.ai.chat(reasonPrompt, {
          model: 'google/gemini-2.5-flash',
          temperature: 0.3,
          max_tokens: 30
        })

        if (typeof reasonResponse === 'string') {
          reason = reasonResponse
        } else if (reasonResponse?.message?.content) {
          reason = reasonResponse.message.content
        }
      }

      // Oppdater lead i databasen
      const { error: updateError } = await supabase
        .from('leads')
        .update({ 
          ai_score: finalScore,
          last_scored: new Date().toISOString(),
          score_reason: reason
        })
        .eq('id', leadId)

      if (updateError) throw updateError

      // Logg aktivitet
      await supabase.from('ai_activity_log').insert({
        user_id: user.id,
        lead_id: leadId,
        action_type: 'score_updated',
        description: `Lead scored ${finalScore}/10 - ${reason}`,
        metadata: { 
          score: finalScore,
          reason,
          title: lead?.title,
          industry: lead?.industry,
          notes_count: notes?.length
        }
      })

      await loadLeads()
      alert(`Lead scored ${finalScore}/10!\n\n${reason}`)
      
    } catch (error: any) {
      console.error('Error scoring lead:', error)
      alert('Failed to score lead: ' + (error.message || 'Unknown error'))
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
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 text-4xl mb-4">⚠️</div>
            <p className="text-gray-700 mb-4">{error}</p>
            <button
              onClick={() => loadLeads()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Try again
            </button>
          </div>
        </div>
      </Layout>
    )
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {filterLoading && (
                <div className="absolute right-3 top-2.5">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-600"></div>
                </div>
              )}
            </div>
          </div>

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

        {(searchTerm || statusFilter !== 'all' || scoreFilter !== 'all') && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-sm text-gray-500">Active filters:</span>
            {searchTerm && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                Search: "{searchTerm}"
                <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-blue-600">×</button>
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                Status: {statusFilter}
                <button onClick={() => setStatusFilter('all')} className="ml-1 hover:text-purple-600">×</button>
              </span>
            )}
            {scoreFilter !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                Score: {scoreFilter}
                <button onClick={() => setScoreFilter('all')} className="ml-1 hover:text-green-600">×</button>
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
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div onClick={() => handleSort('name')} className="col-span-3 cursor-pointer hover:text-gray-700">
                Name <SortIcon field="name" />
              </div>
              <div onClick={() => handleSort('company')} className="col-span-2 cursor-pointer hover:text-gray-700">
                Company <SortIcon field="company" />
              </div>
              <div className="col-span-2">Contact</div>
              <div onClick={() => handleSort('status')} className="col-span-2 cursor-pointer hover:text-gray-700">
                Status <SortIcon field="status" />
              </div>
              <div onClick={() => handleSort('ai_score')} className="col-span-2 cursor-pointer hover:text-gray-700">
                AI Score <SortIcon field="ai_score" />
              </div>
              <div className="col-span-1">Actions</div>
            </div>

            <ul className="divide-y divide-gray-200">
              {paginatedLeads.map((lead) => (
                <li key={lead.id}>
                  <Link href={`/leads/${lead.id}`} className="block hover:bg-gray-50 transition">
                    <div className="px-4 py-4 grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-3">
                        <p className="text-sm font-medium text-blue-600 truncate">{lead.name}</p>
                        {lead.title && (
                          <p className="text-xs text-gray-500 truncate">{lead.title}</p>
                        )}
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-gray-500 truncate">{lead.company || '—'}</p>
                        {lead.industry && (
                          <p className="text-xs text-gray-400 truncate">{lead.industry}</p>
                        )}
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-gray-500 truncate">{lead.email || '—'}</p>
                      </div>
                      <div className="col-span-2">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(lead.status)}`}>
                          {lead.status}
                        </span>
                      </div>
                      <div className="col-span-2">
                        {lead.ai_score ? (
                          <div className="flex flex-col items-start">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getScoreColor(lead.ai_score)}`}>
                              {lead.ai_score}/10
                            </span>
                            {lead.score_reason && (
                              <span className="text-xs text-gray-500 mt-1 italic truncate max-w-[150px]" title={lead.score_reason}>
                                {lead.score_reason}
                              </span>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              rescoreLead(lead.id)
                            }}
                            disabled={scoringLead === lead.id}
                            className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full hover:bg-purple-200 transition disabled:opacity-50 flex items-center gap-1"
                          >
                            {scoringLead === lead.id ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-2 border-purple-800 border-t-transparent"></div>
                                Scoring...
                              </>
                            ) : (
                              '🤖 Get AI score'
                            )}
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