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

export interface CommandEmail {
  id: string
  prospect_id: string | null
  email_type: string
  subject: string | null
  body: string
  sent_at: string | null
  opened: boolean
  created_at: string
}

export interface CommandProspectActivity {
  id: string
  prospect_id: string
  activity_type: string
  description: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface CommandGmailToken {
  id: string
  access_token: string
  refresh_token: string
  expiry_date: number
  email: string
  created_at: string
  updated_at: string
}

export interface CommandCampaign {
  id: string
  advertiser_name: string
  campaign_name: string
  package_tier: string | null
  status: string
  start_date: string | null
  end_date: string | null
  budget_usd: number | null
  impressions_delivered: number
  clicks: number
  revenue_usd: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CommandSportsEvent {
  id: string
  event_name: string
  school_or_team: string | null
  sport: string | null
  venue: string | null
  event_date: string | null
  cloudflare_stream_key: string | null
  cloudflare_stream_uid: string | null
  status: string
  viewer_peak: number
  notes: string | null
  created_at: string
}

export interface HubSchoolStatus {
  camera: string
  avClub: string
  contact: string
}

export type HubSchoolsConfig = Record<string, HubSchoolStatus>
