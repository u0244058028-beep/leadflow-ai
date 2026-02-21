import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Layout from '@/components/Layout'
import TaskForm from '@/components/TaskForm'
import AIActivityLog from '@/components/AIActivityLog'
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
  
  // E-post states
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailContent, setEmailContent] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)

  useEffect(() => {
    if (id) loadData()
  }, [id])

  async function loadData() {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return

    const { data: leadData } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single()
    setLead(leadData)

    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .eq('lead_id', id)
      .order('due_date', { ascending: true })
    setTasks(tasksData || [])

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
    
    const { data: allNotes } = await supabase
      .from('notes')
      .select('content')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: false })
      .limit(5)
    
    const notesText = allNotes?.map(n => n.content).join(' ') || newNote
    
    fetch('/api/score-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId: lead.id,
        notes: notesText,
        userId: user.id,
      }),
    })
    
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
      const user = (await supabase.auth.getUser()).data.user
      if (!user || !lead) return

      const res = await fetch('/api/generate-followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadName: lead?.name,
          company: lead?.company,
          leadId: lead?.id,
          userId: user.id,
        }),
      })
      const data = await res.json()
      setGeneratedMessage(data.message)
    } catch (error) {
      console.error(error)
    } finally {
      setLoadingAI(false)
    }
  }

  async function sendEmail() {
    if (!lead?.email) {
      alert('This lead has no email address')
      return
    }
    
    setSendingEmail(true)
    try {
      const user = (await supabase.auth.getUser()).data.user
      if (!user || !lead) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, company_name')
        .eq('id', user.id)
        .single()

      let personalizedHtml = emailContent
        .replace(/{{lead_name}}/g, lead.name)
        .replace(/{{user_name}}/g, profile?.full_name || 'Your contact')
        .replace(/{{company_name}}/g, profile?.company_name || 'Our team')

      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: lead.email,
          subject: emailSubject,
          html: personalizedHtml,
          leadId: lead.id,
          userId: user.id,
        }),
      })

      if (!res.ok) throw new Error('Failed to send email')

      alert('Email sent successfully!')
      setShowEmailForm(false)
      setEmailSubject('')
      setEmailContent('')
      setGeneratedMessage('')
    } catch (error) {
      console.error(error)
      alert('Failed to send email')
    } finally {
      setSendingEmail(false)
    }
  }

  function getScoreColor(score: number | null) {
    if (!score) return 'bg-gray-100 text-gray-800'
    if (score >= 8) return 'bg-green-100 text-green-800'
    if (score >= 5) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
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
              <div className="mt-4 p-3 rounded-lg bg-gray-50">
                <p className="text-sm font-medium text-gray-700 mb-1">AI Lead Score</p>
                <div className="flex items-center gap-3">
                  <span className={`text-2xl font-bold px-3 py-1 rounded-full ${getScoreColor(lead.ai_score)}`}>
                    {lead.ai_score}/10
                  </span>
                  <p className="text-xs text-gray-600">
                    {lead.ai_score >= 8 ? '🔥 Hot lead - ready to convert' :
                     lead.ai_score >= 5 ? '👍 Warm lead - keep engaging' :
                     '❄️ Cold lead - needs nurturing'}
                  </p>
                </div>
              </div>
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

        {/* Kolonne 2: Oppgaver, AI og Activity Log */}
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
            
            {generatedMessage && !showEmailForm && (
              <div className="mt-4">
                <div className="p-3 bg-gray-50 rounded mb-3">
                  <p className="text-sm whitespace-pre-wrap">{generatedMessage}</p>
                </div>
                <button
                  onClick={() => {
                    setEmailContent(generatedMessage)
                    setEmailSubject(`Following up with ${lead.name}`)
                    setShowEmailForm(true)
                  }}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  ✉️ Send as email
                </button>
              </div>
            )}

            {showEmailForm && (
              <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                <h3 className="font-medium mb-3">Send email to {lead.email}</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subject</label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Message</label>
                    <textarea
                      rows={6}
                      value={emailContent}
                      onChange={(e) => setEmailContent(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2 font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Available placeholders: {'{{lead_name}}'}, {'{{user_name}}'}, {'{{company_name}}'}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={sendEmail}
                      disabled={sendingEmail}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {sendingEmail ? 'Sending...' : 'Send email'}
                    </button>
                    <button
                      onClick={() => setShowEmailForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6">
            <AIActivityLog leadId={lead.id} />
          </div>
        </div>
      </div>
    </Layout>
  )
}