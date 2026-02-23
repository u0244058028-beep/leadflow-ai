import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function AutoFollowup() {
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)

  const runFollowup = async () => {
    setRunning(true)
    setShowResults(true)
    setResults([{ type: 'info', message: 'Scanning for leads that need follow-up...' }])

    try {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) return

      const response = await fetch('/api/auto-followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })

      const data = await response.json()

      if (data.results) {
        setResults(data.results.map((r: any) => ({
          type: r.success ? 'success' : 'error',
          message: r.success 
            ? `✅ ${r.name}: ${r.type} follow-up sent (tracking pixel included)`
            : `❌ ${r.name}: Failed - ${r.error}`
        })))
      }

      if (data.results?.length === 0) {
        setResults([{ type: 'info', message: 'No leads need follow-up right now.' }])
      }

    } catch (error) {
      console.error('Error:', error)
      setResults([{ type: 'error', message: 'Failed to run auto-followup' }])
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
            Processing...
          </>
        ) : (
          'Run Auto Follow-up'
        )}
      </button>

      {showResults && results.length > 0 && (
        <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
          {results.map((r, i) => (
            <div 
              key={i} 
              className={`text-sm p-2 rounded ${
                r.type === 'success' ? 'bg-green-50 text-green-700' :
                r.type === 'error' ? 'bg-red-50 text-red-700' :
                'bg-blue-50 text-blue-700'
              }`}
            >
              {r.message}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500 border-t pt-4">
        <p>📸 <strong>Tracking:</strong> All emails include a tracking pixel to detect opens.</p>
        <p className="mt-1">Lead opens are logged in the database and visible in lead details.</p>
      </div>
    </div>
  )
}