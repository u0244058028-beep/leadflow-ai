import type { Lead } from "@/types/lead"

export interface AIAnalysis {
  id: string
  probability: number
  urgency: number
  expectedRevenue: number
  priorityScore: number
  action: string
}

export function analyzeLeads(leads: Lead[]): AIAnalysis[] {

  return leads.map((lead) => {

    const baseProbability =
      lead.status === "new" ? 20 :
      lead.status === "contacted" ? 50 :
      lead.status === "qualified" ? 75 :
      95

    const probability =
      baseProbability + (lead.score ?? 0) * 0.3

    const urgency =
      lead.lead_type === "hot" ? 90 :
      lead.lead_type === "enterprise" ? 70 :
      40

    const expectedRevenue =
      (lead.potential_value ?? 0) * (probability / 100)

    const priorityScore =
      probability * 0.6 +
      urgency * 0.4

    let action = "Monitor"

    if (priorityScore > 80) action = "Close deal"
    else if (priorityScore > 60) action = "Follow up now"
    else if (priorityScore > 40) action = "Send email"

    return {
      id: String(lead.id),
      probability,
      urgency,
      expectedRevenue,
      priorityScore,
      action
    }
  })
}