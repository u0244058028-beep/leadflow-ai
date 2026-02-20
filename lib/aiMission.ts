export type Lead = {
  id:string
  name:string
  status:string
  score:number
  next_followup_at?:string
  created_at:string
}

export type Mission = {
  type:string
  text:string
}

export function generateMission(leads:Lead[]):Mission[]{

  const missions:Mission[] = []

  const now = new Date()

  for(const lead of leads){

    // 🔥 Followup needed
    if(
      lead.score >= 30 &&
      lead.status !== "closed" &&
      lead.next_followup_at
    ){

      const followDate = new Date(lead.next_followup_at)

      if(followDate <= now){

        missions.push({
          type:"followup",
          text:`🔥 Follow up with ${lead.name}`
        })

      }

    }

    // ⚠️ Stagnant lead
    const created = new Date(lead.created_at)
    const diffDays = (now.getTime()-created.getTime())/(1000*3600*24)

    if(diffDays > 3 && lead.status === "contacted"){

      missions.push({
        type:"revive",
        text:`⚠️ Revive ${lead.name} (inactive)`
      })

    }

    // ⭐ Closing opportunity
    if(lead.status === "qualified" && lead.score >= 40){

      missions.push({
        type:"close",
        text:`⭐ Try closing ${lead.name}`
      })

    }

  }

  return missions

}