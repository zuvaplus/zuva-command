import { Suspense } from 'react'
import { supabaseAdmin } from '@/lib/supabase'
import CrmClient from '@/components/crm/CrmClient'
import type { CommandProspect } from '@/lib/types'

export const dynamic = 'force-dynamic'

async function getProspects(): Promise<CommandProspect[]> {
  const { data, error } = await supabaseAdmin
    .from('command_prospects')
    .select('*')
    .order('score', { ascending: false })
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data
}

async function getGmailConnected(): Promise<boolean> {
  const { data } = await supabaseAdmin.from('command_gmail_tokens').select('id').limit(1)
  return !!data && data.length > 0
}

export default async function CrmPage() {
  const [prospects, gmailConnected] = await Promise.all([getProspects(), getGmailConnected()])

  return (
    <Suspense fallback={<div className="h-screen" style={{ backgroundColor: '#0A0A0A' }} />}>
      <CrmClient initialProspects={prospects} gmailConnected={gmailConnected} />
    </Suspense>
  )
}
