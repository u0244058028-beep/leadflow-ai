export type AIAnalysis = {
  id: string
  probability: number
  urgency: number
  expectedRevenue: number
  action: string
}

type Lead = {
  id: string
  status: string
  score: number
  created_at: string
  value?: number
}

type StageWeights = {
  newWeight: number
  contactedWeight: number
  qualifiedWeight: number
}

function initializeWeights(): StageWeights {
  return {
    newWeight: 1,
    contactedWeight: 1.2,
    qualifiedWeight: 1.5
  }
}

function updateWeights(leads: Lead[], weights: StageWeights): StageWeights {

  const closed = leads.filter(l => l.status === "closed")
  const stagnated = leads.filter(l => {
    const age =
      (Date.now() - new Date(l.created_at).getTime()) /
      (1000 * 60 * 60 * 24)
    return age > 7 && l.status !== "closed"
  })

  let reward = closed.length * 1
  let penalty = stagnated.length * 0.2

  const adjustment = reward - penalty

  return {
    newWeight: Math.max(0.5, weights.newWeight + adjustment * 0.01),
    contactedWeight: Math.max(0.5, weights.contactedWeight + adjustment * 0.02),
    qualifiedWeight: Math.max(0.5, weights.qualifiedWeight + adjustment * 0.03)
  }
}

export function analyzeLeads(leads: Lead[]): AIAnalysis[] {

  let weights = initializeWeights()

  // reinforcement update
  weights = updateWeights(leads, weights)

  return leads.map(lead => {

    let base = lead.score

    if (lead.status === "new")
      base *= weights.newWeight

    if (lead.status === "contacted")
      base *= weights.contactedWeight

    if (lead.status === "qualified")
      base *= weights.qualifiedWeight

    if (lead.status === "closed")
      base = 100

    if (base > 100) base = 100

    const ageDays =
      (Date.now() - new Date(lead.created_at).getTime()) /
      (1000 * 60 * 60 * 24)

    const urgency = Math.min(ageDays * 10, 100)

    const expectedRevenue =
      Math.round((lead.value || 1000) * (base / 100))

    let action = "Monitor"

    if (base > 85)
      action = "Close aggressively"

    else if (urgency > 70)
      action = "Immediate follow-up"

    else if (lead.status === "new")
      action = "Initiate contact"

    return {
      id: lead.id,
      probability: Math.round(base),
      urgency: Math.round(urgency),
      expectedRevenue,
      action
    }
  })
}