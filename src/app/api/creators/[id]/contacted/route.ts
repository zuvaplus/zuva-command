import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { CREATOR_FOLLOW_UP_DAYS, DM_TYPES, DM_VARIANTS } from '@/lib/creators'
import { errorMessage } from '@/lib/creatorInput'
import { logCreatorActivity } from '@/lib/creatorData'

// "Mark as contacted" after a DM has been sent by hand (nothing is sent from
// here). Sets last_contact to today, follow_up_due to +5 days, and logs the
// message. The stage moves to Contacted only from Identified, so a
// post-reply DM to a creator already at Replied / Call Booked / etc. never
// pushes them backwards.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { message, dm_type, variant } = (await request.json()) as {
      message?: string
      dm_type?: string
      variant?: string
    }

    const { data: before, error: beforeError } = await supabaseAdmin
      .from('command_creators')
      .select('stage')
      .eq('id', id)
      .single()
    if (beforeError || !before) return NextResponse.json({ error: 'Creator not found' }, { status: 404 })

    const now = new Date()
    const due = new Date(now)
    due.setDate(due.getDate() + CREATOR_FOLLOW_UP_DAYS)
    const followUpDue = due.toISOString().slice(0, 10)

    const patch: Record<string, unknown> = {
      last_contact: now.toISOString().slice(0, 10),
      follow_up_due: followUpDue,
      updated_at: now.toISOString(),
    }
    if (before.stage === 'Identified') patch.stage = 'Contacted'

    const { data, error } = await supabaseAdmin
      .from('command_creators')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error

    const typeLabel = DM_TYPES.find((t) => t.value === dm_type)?.label ?? 'Message'
    const variantLabel = DM_VARIANTS.find((v) => v.value === variant)?.label
    await logCreatorActivity(
      id,
      'contacted',
      `Contacted — ${typeLabel}${variantLabel ? ` (${variantLabel})` : ''}. Follow-up due ${followUpDue}`,
      { dm_type: dm_type ?? null, variant: variant ?? null, message: message?.slice(0, 2000) ?? null }
    )
    if (patch.stage) {
      await logCreatorActivity(id, 'stage_changed', 'Stage changed from "Identified" to "Contacted"')
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Creator contacted error:', error)
    return NextResponse.json({ error: `Could not mark as contacted: ${errorMessage(error)}` }, { status: 500 })
  }
}
