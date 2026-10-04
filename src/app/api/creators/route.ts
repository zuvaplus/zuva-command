import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { recruitScore } from '@/lib/creators'
import { sanitizeCreatorFields, isDuplicateUrlError, errorMessage } from '@/lib/creatorInput'
import { buildDuplicateIndex, fetchAllCreators, isDuplicate, logCreatorActivity } from '@/lib/creatorData'

export async function GET() {
  try {
    return NextResponse.json({ creators: await fetchAllCreators() })
  } catch (error) {
    console.error('Creators fetch error:', error)
    return NextResponse.json({ error: `Could not load creators: ${errorMessage(error)}` }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>
    const clean = sanitizeCreatorFields(body, false)
    if (!clean.ok) return NextResponse.json({ error: clean.error }, { status: 400 })
    const fields = clean.fields as Record<string, unknown> & {
      display_name: string
      primary_platform: string
      profile_url: string | null
      followers: number | null
      audience_diaspora_pct: number | null
      pain_signal: boolean
    }

    const existing = await fetchAllCreators()
    if (isDuplicate(buildDuplicateIndex(existing), fields)) {
      return NextResponse.json(
        { error: `${fields.display_name} is already in Creators (same profile URL, or same name on ${fields.primary_platform}).` },
        { status: 409 }
      )
    }

    // Score is calculated unless the form sent a hand-set one.
    const manual = typeof fields.recruit_score === 'number'
    const { data, error } = await supabaseAdmin
      .from('command_creators')
      .insert({
        ...fields,
        recruit_score: manual ? fields.recruit_score : recruitScore(fields),
        recruit_score_manual: manual,
      })
      .select()
      .single()
    if (error) {
      if (isDuplicateUrlError(error)) {
        return NextResponse.json({ error: 'A creator with this profile URL already exists.' }, { status: 409 })
      }
      throw error
    }

    await logCreatorActivity(data.id, 'created', 'Added to Creators')
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Creator create error:', error)
    return NextResponse.json({ error: `Could not add creator: ${errorMessage(error)}` }, { status: 500 })
  }
}
