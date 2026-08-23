import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Not explicitly listed in the original spec's API route list, but the
// funding page's "Add Funding Application" modal (Step 8) has nowhere
// else to send a new row to — supabaseAdmin (service role key) can only
// be called server-side, never from the client component that owns the
// modal, so this route is what actually performs the insert.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      program_name,
      organization,
      amount_requested,
      status,
      next_action,
      next_action_date,
      notes,
    } = body as {
      program_name: string
      organization: string
      amount_requested?: number | null
      status?: string
      next_action?: string | null
      next_action_date?: string | null
      notes?: string | null
    }

    if (!program_name || !organization) {
      return NextResponse.json({ error: 'program_name and organization are required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('command_funding')
      .insert({
        program_name,
        organization,
        amount_requested: amount_requested ?? null,
        status: status || 'Research',
        next_action: next_action || null,
        next_action_date: next_action_date || null,
        notes: notes || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Funding create error:', error)
    return NextResponse.json({ error: 'Could not create funding application' }, { status: 500 })
  }
}
