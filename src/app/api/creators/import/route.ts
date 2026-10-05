import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import {
  CONTACT_METHODS,
  CONTENT_CATEGORIES,
  CREATOR_PLATFORMS,
  CREATOR_STAGES,
  CREATOR_TIERS,
  parseCount,
  recruitScore,
  validateContactDetail,
} from '@/lib/creators'
import { normalizeMarket, OTHER_MARKET } from '@/lib/markets'
import { parseCreatorCsv } from '@/lib/creatorCsv'
import { errorMessage } from '@/lib/creatorInput'
import { addToIndex, buildDuplicateIndex, fetchAllCreators, isDuplicate } from '@/lib/creatorData'

const PLATFORM_ALIASES: Record<string, string> = { yt: 'YouTube', ig: 'Instagram', fb: 'Facebook', twitter: 'X', 'x (twitter)': 'X' }

function matchOption(list: readonly string[], value: string): string | null {
  const v = value.trim().toLowerCase()
  return list.find((o) => o.toLowerCase() === v) ?? null
}

function matchCategory(value: string): string | null {
  const v = value.trim().toLowerCase()
  const c = CONTENT_CATEGORIES.find((c) => c.value === v.replace(/[\s&-]+/g, '_') || c.label.toLowerCase() === v)
  return c?.value ?? null
}

export async function POST(request: NextRequest) {
  try {
    const { csv_text } = (await request.json()) as { csv_text: string }
    if (!csv_text || !csv_text.trim()) {
      return NextResponse.json({ error: 'The CSV is empty — paste some rows or choose a file.' }, { status: 400 })
    }

    const parsed = parseCreatorCsv(csv_text)
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })

    // Same index covers creators already in the CRM and rows earlier in
    // this file, so both kinds of duplicate are caught by one check.
    const existing = await fetchAllCreators()
    const index = buildDuplicateIndex(existing)

    const rowsToInsert: Record<string, unknown>[] = []
    let duplicates = 0
    let missingName = 0
    let contactRemoved = 0
    const unrecognized: Record<string, Set<string>> = { platform: new Set(), country: new Set(), category: new Set(), stage: new Set() }

    for (const row of parsed.rows) {
      if (!row.display_name) {
        missingName++
        continue
      }

      const notes: string[] = row.notes ? [row.notes] : []

      let platform = matchOption(CREATOR_PLATFORMS, row.primary_platform) ?? PLATFORM_ALIASES[row.primary_platform.trim().toLowerCase()] ?? null
      if (!platform) {
        if (row.primary_platform) {
          unrecognized.platform.add(row.primary_platform)
          notes.push(`Imported platform: ${row.primary_platform}`)
        }
        platform = 'Other'
      }

      const candidate = { display_name: row.display_name, primary_platform: platform, profile_url: row.profile_url || null }
      if (isDuplicate(index, candidate)) {
        duplicates++
        continue
      }
      addToIndex(index, candidate)

      let country = normalizeMarket(row.country)
      if (row.country && !country) {
        unrecognized.country.add(row.country)
        notes.push(`Imported country: ${row.country}`)
        country = OTHER_MARKET
      }

      let category = row.content_category ? matchCategory(row.content_category) : null
      if (row.content_category && !category) {
        unrecognized.category.add(row.content_category)
        notes.push(`Imported category: ${row.content_category}`)
        category = 'other'
      }

      // Stage from the file if it's a valid stage; otherwise Identified, with
      // the original kept in notes.
      let stage = matchOption(CREATOR_STAGES, row.stage)
      if (!stage) {
        if (row.stage) {
          unrecognized.stage.add(row.stage)
          notes.push(`Imported stage: ${row.stage}`)
        }
        stage = 'Identified'
      }

      const pct = parseCount(row.audience_diaspora_pct.replace('%', ''))
      const contact = validateContactDetail(row.contact_detail)
      // An invalid contact detail is dropped, never copied into notes — it
      // could be bank or payment details.
      if (!contact.ok) contactRemoved++

      const fields = {
        display_name: row.display_name,
        primary_platform: platform,
        profile_url: row.profile_url || null,
        followers: parseCount(row.followers),
        avg_views: parseCount(row.avg_views),
        country,
        content_category: category,
        primary_language: row.primary_language || null,
        audience_diaspora_pct: pct !== null && pct <= 100 ? pct : null,
        pain_signal: /^(y|yes|true|1)$/i.test(row.pain_signal),
        proposed_tier: matchOption(CREATOR_TIERS, row.proposed_tier) ?? 'None',
        source: row.source || 'CSV import',
        contact_method: matchOption(CONTACT_METHODS, row.contact_method),
        contact_detail: contact.ok ? contact.value : null,
        notes: notes.join('\n') || null,
        stage,
      }
      rowsToInsert.push({ ...fields, recruit_score: recruitScore(fields), recruit_score_manual: false })
    }

    if (rowsToInsert.length > 0) {
      const { data, error } = await supabaseAdmin.from('command_creators').insert(rowsToInsert).select('id')
      if (error) throw error
      const { error: activityError } = await supabaseAdmin
        .from('command_creator_activity')
        .insert((data ?? []).map((c) => ({ creator_id: c.id, activity_type: 'imported', description: 'Imported from CSV' })))
      if (activityError) console.error('Creator import activity error:', activityError)
    }

    const details: string[] = []
    if (duplicates > 0) {
      details.push(
        'Duplicates are matched on profile URL, or on name + platform when there is no URL, against creators already in the CRM and earlier rows in this file.'
      )
    }
    if (missingName > 0) details.push(`Other: ${missingName} rows had no display name.`)
    if (contactRemoved > 0) {
      details.push(`${contactRemoved} contact details were removed — only an email address or a WhatsApp number starting with + is allowed.`)
    }
    for (const [label, values] of Object.entries(unrecognized)) {
      if (values.size > 0) {
        const fallback = label === 'stage' ? 'Identified' : 'Other'
        details.push(`Unrecognised ${label} set to ${fallback} (original kept in notes): ${[...values].join(', ')}`)
      }
    }

    return NextResponse.json({ imported: rowsToInsert.length, duplicates, skipped_other: missingName, details })
  } catch (error) {
    console.error('Creator import error:', error)
    return NextResponse.json(
      { error: `Import failed, nothing was imported: ${errorMessage(error)}` },
      { status: 500 }
    )
  }
}
