import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { CLOSED_CREATOR_STAGES } from '@/lib/creators'

// Powers the three Sidebar indicators (overdue follow-up badge, live-event
// dot, Gmail status dot) with one request instead of three separate ones.
export async function GET() {
  try {
    const today = new Date().toISOString().slice(0, 10)

    const [followUpsRes, liveEventRes, gmailRes, creatorDueRes] = await Promise.all([
      supabaseAdmin.from('command_prospects').select('*', { count: 'exact', head: true }).lte('follow_up_due', today),
      supabaseAdmin.from('command_sports_events').select('id').eq('status', 'Live').limit(1),
      supabaseAdmin.from('command_gmail_tokens').select('id').limit(1),
      supabaseAdmin
        .from('command_creators')
        .select('*', { count: 'exact', head: true })
        .lte('follow_up_due', today)
        .not('stage', 'in', `(${CLOSED_CREATOR_STAGES.map((s) => `"${s}"`).join(',')})`),
    ])

    return NextResponse.json({
      overdueFollowUps: followUpsRes.count ?? 0,
      liveSportsEvent: (liveEventRes.data?.length ?? 0) > 0,
      gmailConnected: (gmailRes.data?.length ?? 0) > 0,
      // 0 (not an error) if the creators migration hasn't been run yet.
      creatorFollowUpsDue: creatorDueRes.count ?? 0,
    })
  } catch (error) {
    console.error('Sidebar status error:', error)
    // Never let a failed status check break navigation — fall back to
    // the "nothing to show" state instead of a 500.
    return NextResponse.json({ overdueFollowUps: 0, creatorFollowUpsDue: 0, liveSportsEvent: false, gmailConnected: false })
  }
}
