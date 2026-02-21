import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Layout from '@/components/Layout'
import LeadForm from '@/components/LeadForm'
import Link from 'next/link'
import { Lead } from '@/types'

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [showForm, setShowForm] = useState(false)
  const [scoringLead, setScoringLead] = useState<string | null>(null)

  useEffect(() => {
    loadLeads()
  }, [])

  async function loadLeads() {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return
    const { data } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setLeads(data || [])
  }

  async function handleCreateLead(leadData: Partial<Lead>) {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return
    await supabase.from('leads').insert([{ ...leadData, user_id: user.id }])
    setShowForm(false)
    loadLeads()
  }

  async function rescoreLead(leadId: string) {
    setScoringLead(leadId)
    
    const { data: notes } = await supabase
      .from('notes')
      .select('content')
      .eq('lead_id', leadId)
      .limit(10)
    
    const notesText = notes?.map(n => n.content).join(' ') || ''
    
    const user = (await supabase.auth.getUser()).data.user
    
    await fetch('/api/score-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId,
        notes: notesText,
        userId: user?.id,
      }),
    })
    
    setScoringLead(null)
    loadLeads()
  }

  function getScoreColor(score: number | null) {
    if (!score) return 'bg-gray-100 text-gray-800'
    if (score >= 8) return 'bg-green-100 text-green-800'
    if (score >= 5) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Leads</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {leads.map((lead) => (
            <li key={lead.id}>
              <Link href={`/leads/${lead.id}`} className="block hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-600 truncate">{lead.name}</p>
                      <p className="text-sm text-gray-500">{lead.company || '–'}</p>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex items-center gap-2">
                      <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getScoreColor(lead.ai_score)}`}>
                        {lead.status}
                      </p>
                      
                      {lead.ai_score ? (
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getScoreColor(lead.ai_score)}`}>
                          Score: {lead.ai_score}
                        </span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            rescoreLead(lead.id)
                          }}
                          disabled={scoringLead === lead.id}
                          className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full hover:bg-purple-200 disabled:opacity-50"
                        >
                          {scoringLead === lead.id ? 'Scoring...' : 'Get score'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
          {leads.length === 0 && (
            <li className="px-4 py-6 text-center text-gray-500">No leads yet. Create your first one!</li>
          )}
        </ul>
      </div>
    </Layout>
  )
}