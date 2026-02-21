import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface Activity {
  id: string
  created_at: string
  action_type: string
  description: string
  metadata: any
  is_edited: boolean
}

export default function AIActivityLog({ leadId }: { leadId?: string }) {
  const [activities, setActivities] = useState<Activity[]>([])

  useEffect(() => {
    loadActivities()
  }, [leadId])

  async function loadActivities() {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return

    let query = supabase
      .from('ai_activity_log')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (leadId) {
      query = query.eq('lead_id', leadId)
    }

    const { data } = await query
    setActivities(data || [])
  }

  function getActionIcon(type: string) {
    switch (type) {
      case 'followup_generated': return '✉️'
      case 'score_updated': return '📊'
      case 'email_sent': return '📨'
      default: return '🤖'
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">AI Activity Log</h2>
      {activities.length === 0 ? (
        <p className="text-sm text-gray-500">No AI activity yet.</p>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
              <span className="text-xl">{getActionIcon(activity.action_type)}</span>
              <div className="flex-1">
                <p className="text-sm">{activity.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(activity.created_at).toLocaleString()}
                  {activity.is_edited && ' • Edited by user'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}