export type Lead = {
  id: string
  name: string
  email: string
  status: string
  score: number
  created_at: string
}

export type AIAnalysis = {
  id: string
  probability: number
  urgency: number
  expectedRevenue: number
  action: string
  autopilotDecision?: string
}

export function analyzeLeads(leads: Lead[]): AIAnalysis[] {

  return leads.map((lead) => {

    let probability = 20

    if (lead.score >= 50) probability += 30
    if (lead.status === "qualified") probability += 25
    if (lead.status === "contacted") probability += 10

    const urgency = Math.min(100, probability + Math.random()*20)

    const expectedRevenue = Math.round(probability * 10)

    let action = "Make first contact"

    if (lead.status === "contacted") action = "Send followup"
    if (lead.status === "qualified") action = "Close deal"

    let autopilotDecision = ""

    if (probability > 70 && lead.status === "contacted")
      autopilotDecision = "qualified"

    if (probability > 90)
      autopilotDecision = "closed"

    return {
      id: lead.id,
      probability,
      urgency,
      expectedRevenue,
      action,
      autopilotDecision
    }
  })
}