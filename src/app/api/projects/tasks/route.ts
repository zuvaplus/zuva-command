import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const PRIORITY_RANK: Record<string, number> = { Critical: 1, High: 2, Medium: 3, Low: 4 }

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('command_tasks')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) throw error

    // Supabase's .order() can't express the CASE-ordered priority ranking
    // the spec wants in a single query — sorted client-side instead,
    // same pattern already used by the Morning Brief's priority queue.
    const sorted = [...(data ?? [])].sort(
      (a, b) => (PRIORITY_RANK[a.priority] ?? 5) - (PRIORITY_RANK[b.priority] ?? 5)
    )

    return NextResponse.json({ tasks: sorted })
  } catch (error) {
    console.error('Tasks fetch error:', error)
    return NextResponse.json({ error: 'Could not load tasks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tab, task, status, priority, depends_on, notes, due_date } = body as {
      tab: string
      task: string
      status?: string
      priority?: string
      depends_on?: string | null
      notes?: string | null
      due_date?: string | null
    }

    if (!tab || !task) {
      return NextResponse.json({ error: 'tab and task are required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('command_tasks')
      .insert({
        tab,
        task,
        status: status || 'Not Started',
        priority: priority || 'Medium',
        depends_on: depends_on || null,
        notes: notes || null,
        due_date: due_date || null,
      })
      .select()
      .single()
    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Task create error:', error)
    return NextResponse.json({ error: 'Could not create task' }, { status: 500 })
  }
}
