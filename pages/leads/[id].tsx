import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Layout from '@/components/Layout'
import TaskForm from '@/components/TaskForm'
import { Lead, Task, Note } from '@/types'

export default function LeadDetail() {
  const router = useRouter()
  const { id } = router.query
  const [lead, setLead] = useState<Lead | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState('')
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [generatedMessage, setGeneratedMessage] = useState('')
  const [loadingAI, setLoadingAI] = useState(false)

  useEffect(() => {
    if (id) loadData()
  }, [id])

  async function loadData() {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return

    // Hent lead
    const { data: leadData } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single()
    setLead(leadData)

    // Hent oppgaver
    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .eq('lead_id', id)
      .order('due_date', { ascending: true })
    setTasks(tasksData || [])

    // Hent notater
    const { data: notesData } = await supabase
      .from('notes')
      .select('*')
      .eq('lead_id', id)
      .order('created_at', { ascending: false })
    setNotes(notesData || [])
  }

  async function addNote() {
    if (!newNote.trim()) return
    const user = (await supabase.auth.getUser()).data.user
    if (!user || !lead) return
    await supabase.from('notes').insert([
      { lead_id: lead.id, content: newNote, user_id: user.id }
    ])
    setNewNote('')
    loadData()
  }

  async function toggleTask(task: Task) {
    await supabase
      .from('tasks')
      .update({ completed: !task.completed })
      .eq('id', task.id)
    loadData()
  }

  async function handleAddTask(taskData: Partial<Task>) {
    const user = (await supabase.auth.getUser()).data.user
    if (!user || !lead) return
    await supabase.from('tasks').insert([
      { ...taskData, user_id: user.id }
    ])
    setShowTaskForm(false)
    loadData()
  }

  async function generateFollowup() {
    setLoadingAI(true)
    try {
      const res = await fetch('/api/generate-followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadName: lead?.name, company: lead?.company }),
      })
      const data = await res.json()
      setGeneratedMessage(data.message)
    } catch (error) {
      console.error(error)
    } finally {
      setLoadingAI(false)
    }
  }

  if (!lead) return <Layout>Loading...</Layout>

  return (
    <Layout>
      <div className="mb-4">
        <button onClick={() => router.back()} className="text-blue-600 hover:underline">
          ← Back to leads
        </button>
      </div>
      <h1 className="text-2xl font-bold mb-4">{lead.name}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolonne 1: Detaljer og notater */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Details</h2>
            <p><span className="font-medium">Company:</span> {lead.company || '–'}</p>
            <p><span className="font-medium">Email:</span> {lead.email || '–'}</p>
            <p><span className="font-medium">Phone:</span> {lead.phone || '–'}</p>
            <p><span className="font-medium">Status:</span> {lead.status}</p>
            {lead.ai_score && (
              <p><span className="font-medium">AI Score:</span> {lead.ai_score}/10</p>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Notes</h2>
            <div className="space-y-3 mb-4">
              {notes.map(note => (
                <div key={note.id} className="p-3 bg-gray-50 rounded">
                  <p className="text-sm">{note.content}</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(note.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note..."
                className="flex-1 border border-gray-300 rounded-md p-2"
              />
              <button onClick={addNote} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Kolonne 2: Oppgaver og AI */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Tasks</h2>
              <button
                onClick={() => setShowTaskForm(true)}
                className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              >
                + Add
              </button>
            </div>
            {showTaskForm && (
              <div className="mb-4">
                <TaskForm
                  leadId={lead.id}
                  onSubmit={handleAddTask}
                  onCancel={() => setShowTaskForm(false)}
                />
              </div>
            )}
            <ul className="space-y-2">
              {tasks.map(task => (
                <li key={task.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task)}
                    className="rounded"
                  />
                  <span className={task.completed ? 'line-through text-gray-400' : ''}>
                    {task.title}
                  </span>
                  {task.due_date && (
                    <span className="text-xs text-gray-500 ml-auto">
                      Due: {new Date(task.due_date).toLocaleDateString()}
                    </span>
                  )}
                </li>
              ))}
              {tasks.length === 0 && <p className="text-sm text-gray-500">No tasks yet.</p>}
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">AI Assistant</h2>
            <button
              onClick={generateFollowup}
              disabled={loadingAI}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {loadingAI ? 'Generating...' : 'Generate follow-up message'}
            </button>
            {generatedMessage && (
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <p className="text-sm whitespace-pre-wrap">{generatedMessage}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}