export type Lead = {
 id: string
 name: string
 email: string
 status: string

 // AI signals
 score: number

 // business data
 potential_value: number
 lead_type: string

 user_id: string
 created_at: string
}