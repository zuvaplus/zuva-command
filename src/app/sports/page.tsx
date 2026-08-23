import { supabaseAdmin } from '@/lib/supabase'
import SportsClient from '@/components/sports/SportsClient'
import type { CommandSportsEvent, HubSchoolsConfig } from '@/lib/types'

export const dynamic = 'force-dynamic'

async function getEvents(): Promise<CommandSportsEvent[]> {
  const { data, error } = await supabaseAdmin
    .from('command_sports_events')
    .select('*')
    .order('event_date', { ascending: false })
  if (error || !data) return []
  return data
}

async function getHubConfig(): Promise<HubSchoolsConfig> {
  const { data } = await supabaseAdmin.from('command_sports_hub_config').select('config').limit(1).maybeSingle()
  return (data?.config as HubSchoolsConfig) ?? {}
}

async function getGmailConnected(): Promise<boolean> {
  const { data } = await supabaseAdmin.from('command_gmail_tokens').select('id').limit(1)
  return !!data && data.length > 0
}

export default async function SportsPage() {
  const [events, hubConfig, gmailConnected] = await Promise.all([getEvents(), getHubConfig(), getGmailConnected()])
  return <SportsClient initialEvents={events} initialHubConfig={hubConfig} gmailConnected={gmailConnected} />
}
