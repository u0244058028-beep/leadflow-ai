export type Lead = {
  id:string
  name:string
  email:string
  status:string
  score:number
  created_at:string
  next_followup_at?:string
}

type Mission = {
  type:string
  text:string
  priority:number
}

export function generatePriorityMissions(leads:Lead[]):Mission[]{

  const missions:Mission[] = []

  const now = new Date()

  // ======================
  // FOLLOWUP URGENCY
  // ======================

  leads.forEach(lead=>{

    if(!lead.next_followup_at) return

    const followup = new Date(lead.next_followup_at)

    if(followup <= now && lead.status !== "closed"){

      missions.push({
        type:"followup",
        text:`🔥 Follow up with ${lead.name} now`,
        priority:100
      })
    }

  })

  // ======================
  // HOT LEADS
  // ======================

  leads
    .filter(l=>l.score >= 50 && l.status !== "closed")
    .forEach(l=>{
      missions.push({
        type:"hot",
        text:`⭐ High priority lead: ${l.name}`,
        priority:80
      })
    })

  // ======================
  // NEW LEADS TODAY
  // ======================

  const today = new Date()

  leads.forEach(l=>{

    const created = new Date(l.created_at)

    const sameDay =
      created.getDate() === today.getDate()

    if(sameDay){

      missions.push({
        type:"new",
        text:`🚀 New lead added: ${l.name}`,
        priority:60
      })
    }

  })

  // ======================
  // SORT BY PRIORITY
  // ======================

  return missions.sort((a,b)=>b.priority-a.priority)

}