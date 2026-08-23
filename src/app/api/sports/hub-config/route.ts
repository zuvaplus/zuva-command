import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import type { HubSchoolsConfig } from '@/lib/types'

export async function GET() {
  try {
    const { data } = await supabaseAdmin.from('command_sports_hub_config').select('*').limit(1).maybeSingle()
    return NextResponse.json({ config: (data?.config as HubSchoolsConfig) ?? {} })
  } catch (error) {
    console.error('Hub config fetch error:', error)
    return NextResponse.json({ error: 'Could not load hub school config' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { config } = (await request.json()) as { config: HubSchoolsConfig }
    if (!config) {
      return NextResponse.json({ error: 'config is required' }, { status: 400 })
    }

    const { data: existing } = await supabaseAdmin.from('command_sports_hub_config').select('id').limit(1).maybeSingle()

    if (existing) {
      const { error } = await supabaseAdmin
        .from('command_sports_hub_config')
        .update({ config, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
      if (error) throw error
    } else {
      const { error } = await supabaseAdmin.from('command_sports_hub_config').insert({ config })
      if (error) throw error
    }

    return NextResponse.json({ success: true, config })
  } catch (error) {
    console.error('Hub config update error:', error)
    return NextResponse.json({ error: 'Could not save hub school config' }, { status: 500 })
  }
}
