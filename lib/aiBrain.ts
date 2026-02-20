export type AIAnalysis = {
  id:string
  probability:number
  urgency:number
  expectedRevenue:number
  action:string
}

import type { Lead } from "@/types/lead"

const STAGE_MULTIPLIER = {
  new:0.2,
  contacted:0.4,
  qualified:0.7,
  closed:1
}

export function analyzeLeads(leads:Lead[]):AIAnalysis[]{

return leads.map(l=>{

/* ======================
BASE DEAL VALUE
(simulated AI valuation)
====================== */

const baseValue = 1000 + (l.score * 20)

/* ======================
STAGE PROBABILITY
====================== */

const stageFactor =
STAGE_MULTIPLIER[l.status as keyof typeof STAGE_MULTIPLIER] ?? 0.1

const probability = Math.min(
Math.round(stageFactor * 100),
95
)

/* ======================
URGENCY (age based)
====================== */

const ageDays =
(Math.abs(Date.now() - new Date(l.created_at).getTime()) / 86400000)

const urgency = Math.min(Math.round(ageDays * 15),100)

/* ======================
EXPECTED REVENUE
====================== */

const expectedRevenue =
Math.round(baseValue * (probability/100))

/* ======================
NEXT ACTION (REAL AI FEEL)
====================== */

let action="Review lead"

if(l.status==="new"){
action="Initiate first contact"
}
else if(l.status==="contacted"){
action="Send follow-up"
}
else if(l.status==="qualified"){
action="Book closing call"
}
else if(l.status==="closed"){
action="Upsell / referral"
}

return{
id:l.id,
probability,
urgency,
expectedRevenue,
action
}

})

}