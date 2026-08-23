export interface CommandTask {
  id: string
  tab: string
  task: string
  status: string
  priority: string
  depends_on: string | null
  notes: string | null
  due_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface CommandFunding {
  id: string
  program_name: string
  organization: string
  amount_requested: number | null
  amount_approved: number | null
  status: string
  submitted_at: string | null
  decision_date: string | null
  notes: string | null
  next_action: string | null
  next_action_date: string | null
  created_at: string
  updated_at: string
}

export interface CommandProspect {
  id: string
  company: string
  contact: string | null
  email: string
  industry: string | null
  market: string | null
  size: string
  website: string | null
  stage: string
  score: number
  notes: string | null
  emails_sent: number
  last_contact: string | null
  follow_up_due: string | null
  tags: string[] | null
  created_at: string
  updated_at: string
}
