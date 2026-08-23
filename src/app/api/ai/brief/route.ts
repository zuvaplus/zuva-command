import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase'
import { ZUVA_SYSTEM_PROMPT } from '@/lib/systemPrompt'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST() {
  try {
    const today = new Date().toISOString().slice(0, 10)

    const [tasksRes, followUpsRes, fundingRes, sportsRes] = await Promise.all([
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
    ])

    if (tasksRes.error) throw tasksRes.error
    if (followUpsRes.error) throw followUpsRes.error
    if (fundingRes.error) throw fundingRes.error
    if (sportsRes.error) throw sportsRes.error

    const briefingData = {
      today,
      critical_or_overdue_tasks: tasksRes.data,
      follow_ups_due: followUpsRes.data,
      funding_pipeline: fundingRes.data,
      next_sports_event: sportsRes.data?.[0] ?? null,
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
