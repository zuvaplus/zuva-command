import { supabaseAdmin } from '@/lib/supabase'
import RevenueClient from '@/components/revenue/RevenueClient'
import type { CommandCampaign } from '@/lib/types'

export const dynamic = 'force-dynamic'

async function getCampaigns(): Promise<CommandCampaign[]> {
  const { data, error } = await supabaseAdmin
    .from('command_campaigns')
    .select('*')
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data
}

export default async function RevenuePage() {
  const campaigns = await getCampaigns()
  return <RevenueClient initialCampaigns={campaigns} />
}
