import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { qualifyLead } from '@/lib/qualifyLead'
import { NEEDS_EMAIL_TAG } from '@/lib/prospectTags'

export async function GET() {
  try {
    const { data: prospects, error } = await supabaseAdmin
      .from('command_prospects')
      .select('*')
      .order('score', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) throw error

    // command_prospects.emails_sent is a maintained counter (incremented by
    // /api/gmail/send), but this cross-checks it against the real sent-email
    // count in command_emails so the list never drifts silently out of sync.
    const { data: emails, error: emailsError } = await supabaseAdmin
      .from('command_emails')
      .select('prospect_id')
      .not('sent_at', 'is', null)
    if (emailsError) throw emailsError

    const sentCountByProspect = new Map<string, number>()
    for (const row of emails ?? []) {
      if (!row.prospect_id) continue
      sentCountByProspect.set(row.prospect_id, (sentCountByProspect.get(row.prospect_id) ?? 0) + 1)
    }

    const enriched = (prospects ?? []).map((p) => ({
      ...p,
      emails_sent: sentCountByProspect.get(p.id) ?? p.emails_sent,
    }))

    return NextResponse.json({ prospects: enriched })
  } catch (error) {
    console.error('Prospects fetch error:', error)
    return NextResponse.json({ error: 'Could not load prospects' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { company, contact, email, industry, market, size, website, notes } = body as {
      company: string
      contact?: string | null
      email?: string | null
      industry?: string | null
      market?: string | null
      size?: string
      website?: string | null
      notes?: string | null
    }

    if (!company) {
      return NextResponse.json({ error: 'company is required' }, { status: 400 })
    }
    const cleanEmail = email?.trim() || null

    const score = qualifyLead(industry ?? '', market ?? '', size ?? 'SME')

    const { data, error } = await supabaseAdmin
      .from('command_prospects')
      .insert({
        company,
        contact: contact || null,
        email: cleanEmail,
        tags: cleanEmail ? null : [NEEDS_EMAIL_TAG],
        industry: industry || null,
        market: market || null,
        size: size || 'SME',
        website: website || null,
        notes: notes || null,
        score,
      })
      .select()
      .single()
    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Prospect create error:', error)
    return NextResponse.json({ error: 'Could not create prospect' }, { status: 500 })
  }
}
