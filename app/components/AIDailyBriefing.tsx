"use client"

export default function AIDailyBriefing({ leads }: { leads:any[] }) {

  const high = leads.filter(l => l.urgency === "HIGH")
  const inactive = leads.filter(l => l.status === "new" && l.score > 70)

  return (

    <div className="bg-gradient-to-br from-purple-900 to-indigo-900 p-6 rounded-xl space-y-3">

      <h2 className="text-xl font-semibold">
        🤖 AI Daily Briefing
      </h2>

      <div>
        🔥 {high.length} high urgency leads
      </div>

      <div>
        ⚠ {inactive.length} hot leads not contacted yet
      </div>

      {high.slice(0,2).map(l=>(
        <div key={l.id} className="bg-black/40 p-2 rounded text-sm">
          Contact {l.name} — {l.next_action}
        </div>
      ))}

    </div>
  )
}