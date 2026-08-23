import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase'
import { ZUVA_SYSTEM_PROMPT } from '@/lib/zuva-system-prompt'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST() {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const [tasksRes, followUpsRes, fundingRes, sportsRes, liveEventsRes, activeCampaignsRes, revenueRes] = await Promise.all([
      supabaseAdmin
        .from('command_tasks')
        .select('*')
        .neq('status', 'Completed')
        .or(`priority.eq.Critical,due_date.lte.${today}`)
        .order('priority', { ascending: true })
        .limit(5),
      supabaseAdmin
        .from('command_prospects')
        .select('*')
        .lte('follow_up_due', today),
      supabaseAdmin.from('command_funding').select('*'),
      supabaseAdmin
        .from('command_sports_events')
        .select('*')
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(1),
      supabaseAdmin.from('command_sports_events').select('*').eq('status', 'Live'),
      supabaseAdmin.from('command_campaigns').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
      supabaseAdmin
        .from('command_campaigns')
        .select('revenue_usd')
        .in('status', ['Active', 'Completed'])
        .gte('created_at', startOfMonth.toISOString()),
    ])

    if (tasksRes.error) throw tasksRes.error
    if (followUpsRes.error) throw followUpsRes.error
    if (fundingRes.error) throw fundingRes.error
    if (sportsRes.error) throw sportsRes.error
    if (liveEventsRes.error) throw liveEventsRes.error
    if (activeCampaignsRes.error) throw activeCampaignsRes.error
    if (revenueRes.error) throw revenueRes.error

    const revenueThisMonth = (revenueRes.data ?? []).reduce((sum, r) => sum + Number(r.revenue_usd || 0), 0)

    const briefingData = {
      today,
      critical_or_overdue_tasks: tasksRes.data,
      follow_ups_due: followUpsRes.data,
      funding_pipeline: fundingRes.data,
      next_sports_event: sportsRes.data?.[0] ?? null,
      live_sports_events: liveEventsRes.data,
      active_campaigns_count: activeCampaignsRes.count ?? 0,
      revenue_this_month_usd: revenueThisMonth,
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: ZUVA_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Generate today's morning briefing for Dexter. Here is the current operational data as JSON:\n\n${JSON.stringify(briefingData, null, 2)}\n\nWrite a short, direct morning brief: what's urgent today, what's overdue, and the single most important thing to do first. No fluff, no long preamble. Use plain text with short headers, not markdown tables.`,
        },
      ],
    })

    const textBlock = response.content.find((block) => block.type === 'text')
    const brief = textBlock && textBlock.type === 'text' ? textBlock.text : ''

    return NextResponse.json({ brief })
  } catch (error) {
    console.error('AI brief error:', error)
    return NextResponse.json({ error: 'Could not generate the briefing' }, { status: 500 })
  }
}
