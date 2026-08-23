import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const ALLOWED_FIELDS = [
  'advertiser_name', 'campaign_name', 'package_tier', 'status',
  'start_date', 'end_date', 'budget_usd', 'impressions_delivered',
  'clicks', 'revenue_usd', 'notes',
]

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const updates = (await request.json()) as Record<string, unknown>

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const field of ALLOWED_FIELDS) {
      if (field in updates) patch[field] = updates[field]
    }

    const { data, error } = await supabaseAdmin
      .from('command_campaigns')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    if (!data) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Campaign update error:', error)
    return NextResponse.json({ error: 'Could not update campaign' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { error } = await supabaseAdmin.from('command_campaigns').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Campaign delete error:', error)
    return NextResponse.json({ error: 'Could not delete campaign' }, { status: 500 })
  }
}
