import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('command_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ campaigns: data ?? [] })
  } catch (error) {
    console.error('Campaigns fetch error:', error)
    return NextResponse.json({ error: 'Could not load campaigns' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { advertiser_name, campaign_name, package_tier, status, start_date, end_date, budget_usd, notes } = body as {
      advertiser_name: string
      campaign_name: string
      package_tier?: string | null
      status?: string
      start_date?: string | null
      end_date?: string | null
      budget_usd?: number | null
      notes?: string | null
    }

    if (!advertiser_name || !campaign_name) {
      return NextResponse.json({ error: 'advertiser_name and campaign_name are required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('command_campaigns')
      .insert({
        advertiser_name,
        campaign_name,
        package_tier: package_tier || null,
        status: status || 'Pending',
        start_date: start_date || null,
        end_date: end_date || null,
        budget_usd: budget_usd ?? null,
        notes: notes || null,
      })
      .select()
      .single()
    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Campaign create error:', error)
    return NextResponse.json({ error: 'Could not create campaign' }, { status: 500 })
  }
}
