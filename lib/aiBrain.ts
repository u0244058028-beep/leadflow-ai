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
  previous_status?: string
}

type TransitionMatrix = {
  [from: string]: {
    [to: string]: number
  }
}

const pipeline = ["new","contacted","qualified","closed"]

function buildTransitionMatrix(leads: Lead[]): TransitionMatrix {

  const matrix: TransitionMatrix = {}

  for(const from of pipeline){
    matrix[from] = {}
    for(const to of pipeline){
      matrix[from][to] = 0
    }
  }

  leads.forEach(l => {

    if(!l.previous_status) return

    matrix[l.previous_status][l.status] += 1

  })

  // normalize probabilities
  Object.keys(matrix).forEach(from => {

    const total = Object.values(matrix[from]).reduce((a,b)=>a+b,0)

    if(total === 0) return

    Object.keys(matrix[from]).forEach(to => {
      matrix[from][to] =
        matrix[from][to] / total
    })
  })

  return matrix
}

function estimateProbability(
  lead: Lead,
  matrix: TransitionMatrix
){

  let probability = lead.score

  if(lead.status === "new")
    probability *= matrix.new.closed || 0.1

  if(lead.status === "contacted")
    probability *= matrix.contacted.closed || 0.2

  if(lead.status === "qualified")
    probability *= matrix.qualified.closed || 0.5

  if(probability > 100)
    probability = 100

  return probability
}

export function analyzeLeads(leads: Lead[]): AIAnalysis[] {

  const matrix = buildTransitionMatrix(leads)

  return leads.map(lead => {

    const probability =
      Math.round(estimateProbability(lead, matrix))

    const ageDays =
      (Date.now() -
      new Date(lead.created_at).getTime())
      / (1000*60*60*24)

    const urgency = Math.min(ageDays*12,100)

    const expectedRevenue =
      Math.round((lead.value || 1000) *
      (probability/100))

    let action = "Monitor"

    if(probability > 80)
      action = "Push to close"

    else if(urgency > 70)
      action = "Immediate follow-up"

    else if(lead.status === "new")
      action = "Make first contact"

    return {
      id: lead.id,
      probability,
      urgency: Math.round(urgency),
      expectedRevenue,
      action
    }

  })
}