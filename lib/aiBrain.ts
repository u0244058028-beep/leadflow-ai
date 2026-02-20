import type { Lead } from "@/types/lead"

export type AIAnalysis = {
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
      lead.status === "new" ? 25 :
      lead.status === "contacted" ? 50 :
      lead.status === "qualified" ? 75 :
      95

    const temperatureBoost =
      lead.lead_temperature === "hot" ? 20 :
      lead.lead_temperature === "warm" ? 10 :
      0

    const probability = Math.min(
      baseProbability + temperatureBoost,
      98
    )

    const urgency =
      lead.lead_temperature === "hot" ? 90 :
      lead.lead_temperature === "warm" ? 60 :
      30

    const expectedRevenue =
      (lead.potential_value || 0) * (probability / 100)

    const priorityScore =
      expectedRevenue + urgency

    const action =
      lead.status === "new"
        ? "Send intro email"
        : lead.status === "contacted"
        ? "Send follow-up"
        : lead.status === "qualified"
        ? "Push to close"
        : "Closed"

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