import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Layout from '@/components/Layout'
import Link from 'next/link'

export default function Dashboard() {
  const [leadCount, setLeadCount] = useState(0)
  const [tasksToday, setTasksToday] = useState(0)
  const [topLeads, setTopLeads] = useState<any[]>([])

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return

    const { count: leads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
    setLeadCount(leads || 0)

    const today = new Date().toISOString().split('T')[0]
    const { count: tasks } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('completed', false)
      .eq('due_date', today)
    setTasksToday(tasks || 0)

    const { data } = await supabase
      .from('leads')
      .select('id, name, company, ai_score')
      .eq('user_id', user.id)
      .not('ai_score', 'is', null)
      .order('ai_score', { ascending: false })
      .limit(5)
    setTopLeads(data || [])
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-700">Total Leads</h2>
          <p className="text-3xl font-bold text-blue-600">{leadCount}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-700">Tasks Due Today</h2>
          <p className="text-3xl font-bold text-orange-600">{tasksToday}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-700">AI Leads</h2>
          <p className="text-3xl font-bold text-green-600">{topLeads.length}</p>
        </div>
      </div>

      {topLeads.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Top 5 AI-scored leads</h2>
          <ul className="divide-y">
            {topLeads.map((lead) => (
              <li key={lead.id} className="py-2 flex justify-between">
                <Link href={`/leads/${lead.id}`} className="text-blue-600 hover:underline">
                  {lead.name} {lead.company && `(${lead.company})`}
                </Link>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">Score: {lead.ai_score}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Layout>
  )
}