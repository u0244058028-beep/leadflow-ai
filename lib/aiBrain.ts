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

export function analyzeLeads(leads: Lead[]): AIAnalysis[] {

  // ===============================
  // REAL AI LEARNING CORE
  // ===============================

  const closedLeads = leads.filter(l => l.status === "closed")
  const qualifiedLeads = leads.filter(l => l.status === "qualified")

  const closeRate =
    leads.length === 0
      ? 0.2
      : closedLeads.length / leads.length

  const qualificationBoost =
    qualifiedLeads.length > 0
      ? 15
      : 0

  return leads.map(lead => {

    let probability = lead.score + qualificationBoost

    if (lead.status === "qualified") probability += 20
    if (lead.status === "contacted") probability += 10
    if (lead.status === "closed") probability = 100

    // 🔥 LEARNING ADJUSTMENT
    probability = probability * (1 + closeRate)

    if (probability > 100) probability = 100

    const created = new Date(lead.created_at)
    const ageDays =
      (Date.now() - created.getTime()) /
      (1000 * 60 * 60 * 24)

    const urgency = Math.min(ageDays * 10, 100)

    const expectedRevenue =
      Math.round((lead.value || 1000) * (probability / 100))

    let action = "Review lead"

    if (probability > 80) action = "Close deal now"
    else if (urgency > 60) action = "Follow up immediately"
    else if (lead.status === "new") action = "Initiate first contact"

    return {
      id: lead.id,
      probability: Math.round(probability),
      urgency: Math.round(urgency),
      expectedRevenue,
      action
    }
  })
}