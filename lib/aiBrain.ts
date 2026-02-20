// lib/aiBrain.ts

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
      lead.status === "new" ? 20 :
      lead.status === "contacted" ? 50 :
      lead.status === "qualified" ? 75 :
      lead.status === "closed" ? 100 :
      10

    const typeBoost =
      lead.lead_type === "enterprise" ? 15 :
      lead.lead_type === "hot" ? 25 :
      0

    const probability = Math.min(100, baseProbability + typeBoost)

    const urgency =
      lead.status === "new" ? 60 :
      lead.status === "contacted" ? 70 :
      lead.status === "qualified" ? 80 :
      0

    const expectedRevenue =
      (lead.potential_value || 0) * (probability / 100)

    // 🔥 CEO PRIORITY SCORE
    const priorityScore =
      expectedRevenue * 0.7 +
      urgency * 1.5 +
      probability * 1.2

    const action =
      lead.status === "new" ? "Make first contact" :
      lead.status === "contacted" ? "Send follow-up" :
      lead.status === "qualified" ? "Close deal" :
      "Monitor"

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