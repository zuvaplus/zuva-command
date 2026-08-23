import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const [prospectRes, emailsRes, activityRes] = await Promise.all([
      supabaseAdmin.from('command_prospects').select('*').eq('id', id).single(),
      supabaseAdmin.from('command_emails').select('*').eq('prospect_id', id).order('created_at', { ascending: false }),
      supabaseAdmin
        .from('command_prospect_activity')
        .select('*')
        .eq('prospect_id', id)
        .order('created_at', { ascending: false }),
    ])

    if (prospectRes.error || !prospectRes.data) {
      return NextResponse.json({ error: 'Prospect not found' }, { status: 404 })
    }

    return NextResponse.json({
      prospect: prospectRes.data,
      emails: emailsRes.data ?? [],
      activity: activityRes.data ?? [],
    })
  } catch (error) {
    console.error('Prospect fetch error:', error)
    return NextResponse.json({ error: 'Could not load prospect' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const updates = (await request.json()) as Record<string, unknown>

    // Only ever touch known columns — never blindly spread a client body
    // into a Supabase update.
    const ALLOWED_FIELDS = [
      'company', 'contact', 'email', 'industry', 'market', 'size', 'website',
      'stage', 'score', 'notes', 'follow_up_due', 'last_contact', 'tags',
    ]
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const field of ALLOWED_FIELDS) {
      if (field in updates) patch[field] = updates[field]
    }

    const { data: before } = await supabaseAdmin.from('command_prospects').select('stage, score').eq('id', id).single()

    const { data, error } = await supabaseAdmin
      .from('command_prospects')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    if (!data) {
      return NextResponse.json({ error: 'Prospect not found' }, { status: 404 })
    }

    if (before && 'stage' in updates && updates.stage !== before.stage) {
      await supabaseAdmin.from('command_prospect_activity').insert({
        prospect_id: id,
        activity_type: 'stage_changed',
        description: `Stage changed from "${before.stage}" to "${updates.stage}"`,
      })
    }
    if (before && 'score' in updates && updates.score !== before.score) {
      await supabaseAdmin.from('command_prospect_activity').insert({
        prospect_id: id,
        activity_type: 'score_updated',
        description: `Score changed from ${before.score} to ${updates.score}`,
      })
    }
    if ('notes' in updates) {
      await supabaseAdmin.from('command_prospect_activity').insert({
        prospect_id: id,
        activity_type: 'note_added',
        description: 'Notes updated',
      })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Prospect update error:', error)
    return NextResponse.json({ error: 'Could not update prospect' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { error } = await supabaseAdmin.from('command_prospects').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Prospect delete error:', error)
    return NextResponse.json({ error: 'Could not delete prospect' }, { status: 500 })
  }
}
