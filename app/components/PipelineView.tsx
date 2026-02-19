"use client"

export default function PipelineView({
  leads,
  onSelect,
  onMove
}:{
  leads:any[],
  onSelect:(lead:any)=>void,
  onMove:(lead:any,newStatus:string)=>void
}){

  const columns = [
    "new",
    "contacted",
    "qualified",
    "proposal",
    "closed",
    "lost"
  ]

  return (

    <div className="grid grid-cols-6 gap-4 mt-6">

      {columns.map(status => {

        const filtered = leads.filter(l => l.status === status)

        return (

          <div key={status} className="bg-zinc-900 rounded p-3 space-y-3">

            <div className="font-semibold capitalize flex justify-between">
              {status}
              <span className="text-xs opacity-60">
                {filtered.length}
              </span>
            </div>

            <div className="space-y-2">

              {filtered.map(lead => (

                <div
                  key={lead.id}
                  className="bg-black/50 p-3 rounded cursor-pointer hover:bg-black/70 transition"
                >

                  <div onClick={()=>onSelect(lead)}>

                    <div className="font-semibold text-sm">
                      {lead.name}
                    </div>

                    <div className="text-xs opacity-70">
                      Score {lead.score}
                    </div>

                    <div className="text-xs mt-1">
                      {lead.urgency === "HIGH" && (
                        <span className="text-red-400">High urgency</span>
                      )}
                      {lead.urgency === "MEDIUM" && (
                        <span className="text-yellow-400">Medium</span>
                      )}
                      {lead.urgency === "LOW" && (
                        <span className="text-green-400">Low</span>
                      )}
                    </div>

                  </div>

                  <div className="mt-2 flex gap-1 text-xs">

                    {status !== "new" && (
                      <button
                        onClick={()=>onMove(lead,"new")}
                        className="px-2 py-1 bg-zinc-700 rounded"
                      >
                        ←
                      </button>
                    )}

                    {status !== "lost" && (
                      <button
                        onClick={()=>onMove(lead,nextStatus(status))}
                        className="px-2 py-1 bg-indigo-700 rounded"
                      >
                        →
                      </button>
                    )}

                  </div>

                </div>

              ))}

            </div>

          </div>

        )
      })}

    </div>
  )
}

function nextStatus(current:string){

  const order = [
    "new",
    "contacted",
    "qualified",
    "proposal",
    "closed",
    "lost"
  ]

  const index = order.indexOf(current)
  return order[index + 1] || current
}