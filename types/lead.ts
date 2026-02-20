export type Lead = {
  id: string
  name: string
  email: string

  status: "new" | "contacted" | "qualified" | "closed"

  score: number

  potential_value: number
  lead_type: "standard" | "enterprise" | "hot"

  user_id: string
  created_at?: string
}