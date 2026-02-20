export type Lead = {
  id:string
  name:string
  email:string
  status:string
  score:number
  created_at:string
  value?:number   // estimated deal value
}

export type AIAnalysis = {
  id:string
  probability:number
  urgency:number
  action:string
  expectedRevenue:number
}

export function analyzeLeads(leads:Lead[]):AIAnalysis[]{

  const now = new Date()

  return leads.map(lead=>{

    // ======================
    // DEAL PROBABILITY
    // ======================

    let probability = 20

    if(lead.status==="contacted") probability+=15
    if(lead.status==="qualified") probability+=35
    if(lead.score>=50) probability+=20
    if(lead.status==="closed") probability=100

    if(probability>100) probability=100

    // ======================
    // URGENCY
    // ======================

    const created = new Date(lead.created_at)

    const diffDays =
      (now.getTime()-created.getTime())/(1000*3600*24)

    let urgency = 0

    if(diffDays>3) urgency+=30
    if(diffDays>5) urgency+=50
    if(lead.status==="qualified") urgency+=20

    if(urgency>100) urgency=100

    // ======================
    // ACTION
    // ======================

    let action="Monitor lead"

    if(probability>=70 && lead.status!=="closed"){
      action="Try closing deal"
    } else if(urgency>=50){
      action="Send follow-up now"
    } else if(lead.status==="new"){
      action="Initiate first contact"
    }

    // ======================
    // REVENUE PREDICTION
    // ======================

    const value = lead.value ?? 1000   // default deal value
    const expectedRevenue =
      Math.round((probability/100)*value)

    return{
      id:lead.id,
      probability,
      urgency,
      action,
      expectedRevenue
    }

  })

}