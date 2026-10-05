import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { recruitScore } from '@/lib/creators'
import { sanitizeCreatorFields, creatorConstraintMessage, errorMessage } from '@/lib/creatorInput'
import { logCreatorActivity } from '@/lib/creatorData'
import type { CommandCreator } from '@/lib/types'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const [creatorRes, activityRes] = await Promise.all([
      supabaseAdmin.from('command_creators').select('*').eq('id', id).single(),
      supabaseAdmin
        .from('command_creator_activity')
        .select('*')
        .eq('creator_id', id)
        .order('created_at', { ascending: false }),
    ])
    if (creatorRes.error || !creatorRes.data) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }
    return NextResponse.json({ creator: creatorRes.data, activity: activityRes.data ?? [] })
  } catch (error) {
    console.error('Creator fetch error:', error)
    return NextResponse.json({ error: `Could not load creator: ${errorMessage(error)}` }, { status: 500 })
  }
}

const SCORE_INPUTS = ['followers', 'audience_diaspora_pct', 'pain_signal'] as const

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = (await request.json()) as Record<string, unknown>
    const clean = sanitizeCreatorFields(body, true)
    if (!clean.ok) return NextResponse.json({ error: clean.error }, { status: 400 })
    const patch: Record<string, unknown> = { ...clean.fields, updated_at: new Date().toISOString() }

    const { data: before, error: beforeError } = await supabaseAdmin
      .from('command_creators')
      .select('*')
      .eq('id', id)
      .single()
    if (beforeError || !before) return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    const prev = before as CommandCreator

    // Score: a hand-set value sticks (recruit_score_manual); `recalculate`
    // clears that and goes back to the formula. Otherwise the score follows
    // its inputs whenever they change.
    let scoreReason: string | null = null
    if (body.recalculate === true) {
      patch.recruit_score = recruitScore({ ...prev, ...patch })
      patch.recruit_score_manual = false
      scoreReason = 'recalculated'
    } else if ('recruit_score' in patch) {
      patch.recruit_score_manual = true
      scoreReason = 'set by hand'
    } else if (!prev.recruit_score_manual && SCORE_INPUTS.some((f) => f in patch)) {
      patch.recruit_score = recruitScore({ ...prev, ...patch })
      scoreReason = 'inputs changed'
    }

    const { data, error } = await supabaseAdmin
      .from('command_creators')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) {
      const message = creatorConstraintMessage(error)
      if (message) return NextResponse.json({ error: message }, { status: 409 })
      throw error
    }

    if ('stage' in patch && patch.stage !== prev.stage) {
      await logCreatorActivity(id, 'stage_changed', `Stage changed from "${prev.stage}" to "${patch.stage}"`)
    }
    if (scoreReason && patch.recruit_score !== prev.recruit_score) {
      await logCreatorActivity(id, 'score_updated', `Recruit score changed from ${prev.recruit_score} to ${patch.recruit_score} (${scoreReason})`)
    }
    if ('proposed_tier' in patch && patch.proposed_tier !== prev.proposed_tier) {
      await logCreatorActivity(id, 'tier_changed', `Proposed tier changed from ${prev.proposed_tier} to ${patch.proposed_tier}`)
    }
    if ('notes' in patch && patch.notes !== prev.notes) {
      await logCreatorActivity(id, 'notes_updated', 'Notes updated')
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Creator update error:', error)
    return NextResponse.json({ error: `Could not update creator: ${errorMessage(error)}` }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { error } = await supabaseAdmin.from('command_creators').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Creator delete error:', error)
    return NextResponse.json({ error: `Could not delete creator: ${errorMessage(error)}` }, { status: 500 })
  }
}
