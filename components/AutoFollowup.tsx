import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function AutoFollowup() {
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<any[]>([])

  const runFollowup = async () => {
    setRunning(true)
    setResults([])

    try {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) return

      // Hent leads som trenger oppfølging
      const twoDaysAgo = new Date()
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

      const { data: leads } = await supabase
        .from('leads')
        .select('*')
        .in('status', ['new', 'contacted'])
        .lt('last_contacted', twoDaysAgo.toISOString())
        .eq('user_id', user.id)
        .limit(5)

      if (!leads || leads.length === 0) {
        alert('No leads need followup')
        setRunning(false)
        return
      }

      const newResults = []

      for (const lead of leads) {
        try {
          // 🎯 BRUK PUTER.JS I NETTLESEREN – fungerer!
          const followupText = await window.puter.ai.chat(
            `Write a short, friendly follow-up email to ${lead.name} from ${lead.company || 'a company'}.
            They haven't responded in 2 days. Keep it warm, not pushy.
            Include a question to encourage response.`,
            { 
              model: 'google/gemini-2.5-flash',
              temperature: 0.7 
            }
          )

          // Send e-post via din egen API
          const emailRes = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: lead.email,
              subject: `Following up, ${lead.name}`,
              html: followupText.replace(/\n/g, '<br>'),
              leadId: lead.id,
              userId: user.id
            })
          })

          // Oppdater last_contacted
          await supabase
            .from('leads')
            .update({ last_contacted: new Date().toISOString() })
            .eq('id', lead.id)

          newResults.push({
            leadId: lead.id,
            name: lead.name,
            success: true,
            emailSent: emailRes.ok
          })

        } catch (error: any) {
          newResults.push({
            leadId: lead.id,
            name: lead.name,
            success: false,
            error: error.message
          })
        }
      }

      setResults(newResults)

    } catch (error) {
      console.error('Auto-followup error:', error)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">🤖 Auto Follow-up</h2>
      
      <button
        onClick={runFollowup}
        disabled={running}
        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
      >
        {running ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            Running follow-up...
          </>
        ) : (
          'Run Auto Follow-up'
        )}
      </button>

      {results.length > 0 && (
        <div className="mt-4">
          <h3 className="font-medium mb-2">Results:</h3>
          <ul className="space-y-2">
            {results.map((r, i) => (
              <li key={i} className={`text-sm p-2 rounded ${
                r.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {r.name}: {r.success ? '✅ Follow-up sent' : `❌ Failed: ${r.error}`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}