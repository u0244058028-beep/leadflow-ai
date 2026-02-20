import { Lead } from "@/types/lead"

export type AIAnalysis = {
  id:string
  probability:number
  urgency:number
  expectedRevenue:number
  priorityScore:number
  action:string
}

export function analyzeLeads(leads:Lead[]):AIAnalysis[]{

return leads.map(lead=>{

let probability = 20

if(lead.status==="contacted") probability=40
if(lead.status==="qualified") probability=70
if(lead.lead_type==="hot") probability+=20

const urgency = Math.min(100, lead.score + (lead.potential_value/50))

const expectedRevenue =
lead.potential_value * (probability/100)

const priorityScore =
(probability*0.5)+(urgency*0.3)+(expectedRevenue/20)

let action="Follow up"

if(probability>80) action="Close deal now"
else if(probability>50) action="Book call"

return{
id:lead.id,
probability,
urgency,
expectedRevenue,
priorityScore,
action
}

})

}