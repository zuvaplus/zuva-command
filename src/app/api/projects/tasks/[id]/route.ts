import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const ALLOWED_FIELDS = ['tab', 'task', 'status', 'priority', 'depends_on', 'notes', 'due_date']

// A broader companion to the existing /api/tasks/[id] from Session 1
// (status-only, used by the Morning Brief's priority queue) — that route
// is left untouched per the "do not modify existing infrastructure"
// instruction. This one supports the full field set Project Command needs.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const updates = (await request.json()) as Record<string, unknown>

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const field of ALLOWED_FIELDS) {
      if (field in updates) patch[field] = updates[field]
    }
    if (updates.status === 'Completed') patch.completed_at = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('command_tasks')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    if (!data) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Task update error:', error)
    return NextResponse.json({ error: 'Could not update task' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { error } = await supabaseAdmin.from('command_tasks').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Task delete error:', error)
    return NextResponse.json({ error: 'Could not delete task' }, { status: 500 })
  }
}
