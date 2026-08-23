import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const ALLOWED_FIELDS = ['status', 'viewer_peak', 'notes', 'event_name', 'school_or_team', 'sport', 'venue', 'event_date']

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const updates = (await request.json()) as Record<string, unknown>

    const patch: Record<string, unknown> = {}
    for (const field of ALLOWED_FIELDS) {
      if (field in updates) patch[field] = updates[field]
    }

    const { data, error } = await supabaseAdmin
      .from('command_sports_events')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    if (!data) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Sports event update error:', error)
    return NextResponse.json({ error: 'Could not update event' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { error } = await supabaseAdmin.from('command_sports_events').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Sports event delete error:', error)
    return NextResponse.json({ error: 'Could not delete event' }, { status: 500 })
  }
}
