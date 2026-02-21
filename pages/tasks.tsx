import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Layout from '@/components/Layout'
import Link from 'next/link'

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([])

  useEffect(() => {
    loadTasks()
  }, [])

  async function loadTasks() {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return
    const { data } = await supabase
      .from('tasks')
      .select('*, leads(name)')
      .eq('user_id', user.id)
      .eq('completed', false)
      .order('due_date', { ascending: true })
    setTasks(data || [])
  }

  async function toggleComplete(taskId: string, current: boolean) {
    await supabase
      .from('tasks')
      .update({ completed: !current })
      .eq('id', taskId)
    loadTasks()
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Open Tasks</h1>
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {tasks.map(task => (
            <li key={task.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleComplete(task.id, task.completed)}
                    className="rounded"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{task.title}</p>
                    <p className="text-sm text-gray-500">
                      Lead: {task.leads?.name || 'Unknown'} 
                      {task.due_date && ` • Due: ${new Date(task.due_date).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <Link href={`/leads/${task.lead_id}`} className="text-blue-600 hover:underline text-sm">
                  View lead
                </Link>
              </div>
            </li>
          ))}
          {tasks.length === 0 && (
            <li className="px-4 py-6 text-center text-gray-500">No open tasks. Good job!</li>
          )}
        </ul>
      </div>
    </Layout>
  )
}