"use client"

export default function AIMission({ leads }: { leads:any[] }) {

  const highPriority = leads.filter(l =>
    l.urgency === "HIGH" || l.score > 70
  )

  return (

    <div className="bg-gradient-to-br from-indigo-900 to-purple-900 p-6 rounded-xl space-y-4">

      <h2 className="text-xl font-semibold">
        🤖 AI Mission
      </h2>

      <div>
        🔥 {highPriority.length} leads need attention
      </div>

      {highPriority.slice(0,3).map((lead:any)=>(
        <div key={lead.id} className="bg-black/40 p-3 rounded">
          <strong>{lead.name}</strong>
          <div className="text-sm opacity-70">
            {lead.next_action}
          </div>
        </div>
      ))}

    </div>
  )
}