export type Lead = {

  id: string
  name: string
  email: string

  status: "new" | "contacted" | "qualified" | "closed"

  user_id: string
  created_at?: string

  score?: number

  // 🔥 AI SALES DATA

  potential_value?: number
  interest?: string

  lead_temperature?: "cold" | "warm" | "hot"

}