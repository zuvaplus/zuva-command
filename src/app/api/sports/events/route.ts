import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('command_sports_events')
      .select('*')
      .order('event_date', { ascending: false })
    if (error) throw error
    return NextResponse.json({ events: data ?? [] })
  } catch (error) {
    console.error('Sports events fetch error:', error)
    return NextResponse.json({ error: 'Could not load events' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event_name, school_or_team, sport, venue, event_date, notes } = body as {
      event_name: string
      school_or_team?: string | null
      sport?: string | null
      venue?: string | null
      event_date: string
      notes?: string | null
    }

    if (!event_name || !event_date) {
      return NextResponse.json({ error: 'event_name and event_date are required' }, { status: 400 })
    }

    // No real Cloudflare Stream integration exists yet — this is an
    // obviously-fake placeholder (never a real, usable ingest key) so
    // Dexter can see the field populated without mistaking it for a
    // provisioned stream. Swap for a real client.stream.live.inputs.create()
    // call once Cloudflare Stream Live is wired up.
    const placeholderKey = `zuva-sports-placeholder-${randomBytes(8).toString('hex')}`

    const { data, error } = await supabaseAdmin
      .from('command_sports_events')
      .insert({
        event_name,
        school_or_team: school_or_team || null,
        sport: sport || null,
        venue: venue || null,
        event_date,
        notes: notes || null,
        cloudflare_stream_key: placeholderKey,
        status: 'Scheduled',
      })
      .select()
      .single()
    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Sports event create error:', error)
    return NextResponse.json({ error: 'Could not create event' }, { status: 500 })
  }
}
