import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

interface ImportTask {
  tab: string
  task: string
  status?: string
  priority?: string
  depends_on?: string | null
  notes?: string | null
}

export async function POST(request: NextRequest) {
  try {
    const { tasks } = (await request.json()) as { tasks: ImportTask[] }
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json({ error: 'tasks array is required' }, { status: 400 })
    }

    const rowsToInsert = tasks
      .filter((t) => t.tab && t.task)
      .map((t) => ({
        tab: t.tab,
        task: t.task,
        status: t.status || 'Not Started',
        priority: t.priority || 'Medium',
        depends_on: t.depends_on || null,
        notes: t.notes || null,
      }))

    if (rowsToInsert.length > 0) {
      const { error } = await supabaseAdmin.from('command_tasks').insert(rowsToInsert)
      if (error) throw error
    }

    return NextResponse.json({ imported: rowsToInsert.length, skipped: tasks.length - rowsToInsert.length })
  } catch (error) {
    console.error('Task import error:', error)
    return NextResponse.json({ error: 'Could not import tasks' }, { status: 500 })
  }
}
