import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Layout from '@/components/Layout'
import LeadForm from '@/components/LeadForm'
import Link from 'next/link'
import { Lead } from '@/types'

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [showForm, setShowForm] = useState(false)

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
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {lead.status}
                      </p>
                      {lead.ai_score && (
                        <p className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          Score: {lead.ai_score}
                        </p>
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