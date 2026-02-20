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

type LearningModel = {
  closeRate: number
  avgDaysToClose: number
  qualifiedToCloseRate: number
  contactedToQualifiedRate: number
}

function buildLearningModel(leads: Lead[]): LearningModel {

  const total = leads.length
  const closed = leads.filter(l => l.status === "closed")
  const qualified = leads.filter(l => l.status === "qualified")
  const contacted = leads.filter(l => l.status === "contacted")

  const closeRate =
    total === 0 ? 0.2 : closed.length / total

  const qualifiedToCloseRate =
    qualified.length === 0
      ? 0.2
      : closed.length / qualified.length

  const contactedToQualifiedRate =
    contacted.length === 0
      ? 0.2
      : qualified.length / contacted.length

  const daysToClose = closed.map(l => {
    const created = new Date(l.created_at)
    return (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)
  })

  const avgDaysToClose =
    daysToClose.length === 0
      ? 5
      : daysToClose.reduce((a, b) => a + b, 0) / daysToClose.length

  return {
    closeRate,
    avgDaysToClose,
    qualifiedToCloseRate,
    contactedToQualifiedRate
  }
}

export function analyzeLeads(leads: Lead[]): AIAnalysis[] {

  const model = buildLearningModel(leads)

  return leads.map(lead => {

    let probability = lead.score

    // Adaptive weights
    if (lead.status === "contacted")
      probability += 20 * model.contactedToQualifiedRate

    if (lead.status === "qualified")
      probability += 30 * model.qualifiedToCloseRate

    if (lead.status === "closed")
      probability = 100

    // Global performance boost
    probability = probability * (1 + model.closeRate)

    if (probability > 100) probability = 100

    const created = new Date(lead.created_at)
    const ageDays =
      (Date.now() - created.getTime()) /
      (1000 * 60 * 60 * 24)

    // Timing intelligence
    const urgency =
      ageDays > model.avgDaysToClose
        ? 80
        : Math.min(ageDays * 10, 70)

    const expectedRevenue =
      Math.round((lead.value || 1000) * (probability / 100))

    let action = "Monitor"

    if (probability > 85)
      action = "Close immediately"

    else if (urgency > 70)
      action = "Follow up urgently"

    else if (lead.status === "new")
      action = "Initiate first contact"

    return {
      id: lead.id,
      probability: Math.round(probability),
      urgency: Math.round(urgency),
      expectedRevenue,
      action
    }
  })
}