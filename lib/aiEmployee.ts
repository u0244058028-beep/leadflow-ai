import type { Lead } from "@/types/lead"
import { analyzeLeads } from "./aiBrain"

export interface AIMission {
  leadId: string
  title: string
  action: string
  priority: number
}

export function generateAIMissions(leads: Lead[]): AIMission[] {

  const analysis = analyzeLeads(leads)

  const missions: AIMission[] = []

  for (const ai of analysis) {

    if (ai.priorityScore > 85) {
      missions.push({
        leadId: ai.id,
        title: "🔥 Close High Value Deal",
        action: "Move to closed",
        priority: ai.priorityScore
      })
    }

    else if (ai.priorityScore > 65) {
      missions.push({
        leadId: ai.id,
        title: "⚡ High Priority Follow Up",
        action: "Contact immediately",
        priority: ai.priorityScore
      })
    }

    else if (ai.priorityScore > 40) {
      missions.push({
        leadId: ai.id,
        title: "📧 Nurture Lead",
        action: "Send follow-up email",
        priority: ai.priorityScore
      })
    }
  }

  return missions.sort((a, b) => b.priority - a.priority)
}