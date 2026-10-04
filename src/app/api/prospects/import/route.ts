import { NextRequest, NextResponse } from 'next/server'
import Papa from 'papaparse'
import { supabaseAdmin } from '@/lib/supabase'
import { qualifyLead } from '@/lib/qualifyLead'
import { normalizeMarket, OTHER_MARKET } from '@/lib/markets'
import { NEEDS_EMAIL_TAG } from '@/lib/prospectTags'

// Column order used when the CSV has no header row.
const POSITIONAL_COLUMNS = ['company', 'contact', 'email', 'industry', 'market', 'size']

export async function POST(request: NextRequest) {
  try {
    const { csv_text } = (await request.json()) as { csv_text: string }
    if (!csv_text || !csv_text.trim()) {
      return NextResponse.json({ error: 'csv_text is required' }, { status: 400 })
    }

    // papaparse handles quoted fields, embedded commas/newlines and "" escapes.
    const parsed = Papa.parse<string[]>(csv_text.trim(), { skipEmptyLines: 'greedy' })
    const rows = parsed.data
    if (rows.length === 0) {
      return NextResponse.json({ imported: 0, skipped: 0, duplicates: 0, needs_email: 0, unrecognized_markets: [] })
    }

    const firstRow = rows[0].map((h) => h.trim().toLowerCase())
    const hasHeader = firstRow.includes('company')
    const columns = hasHeader ? firstRow : POSITIONAL_COLUMNS
    const dataRows = hasHeader ? rows.slice(1) : rows

    const rowsToInsert: Record<string, unknown>[] = []
    const seenCompanies = new Set<string>()
    const unrecognizedMarkets = new Set<string>()
    let skipped = 0
    let duplicates = 0
    let needsEmail = 0

    for (const cols of dataRows) {
      const get = (name: string) => {
        const i = columns.indexOf(name)
        return i === -1 ? '' : (cols[i] ?? '').trim()
      }

      const company = get('company')
      if (!company) {
        skipped++
        continue
      }

      // Dedupe within this import only — first occurrence wins.
      const companyKey = company.toLowerCase().replace(/\s+/g, ' ')
      if (seenCompanies.has(companyKey)) {
        duplicates++
        continue
      }
      seenCompanies.add(companyKey)

      const email = get('email') || null
      if (!email) needsEmail++

      // Legacy labels ("African Diaspora (UK)", "Trinidad & Tobago", …) map
      // to the current list; anything unrecognised becomes Other, with the
      // original value kept in notes so nothing is lost.
      const rawMarket = get('market')
      let market = normalizeMarket(rawMarket)
      let notes: string | null = null
      if (rawMarket && !market) {
        unrecognizedMarkets.add(rawMarket)
        market = OTHER_MARKET
        notes = `Imported market: ${rawMarket}`
      }

      const industry = get('industry') || null
      const size = get('size') || 'SME'

      rowsToInsert.push({
        company,
        contact: get('contact') || null,
        email,
        tags: email ? null : [NEEDS_EMAIL_TAG],
        industry,
        market,
        size,
        notes,
        score: qualifyLead(industry ?? '', market ?? '', size),
      })
    }

    if (rowsToInsert.length > 0) {
      const { error } = await supabaseAdmin.from('command_prospects').insert(rowsToInsert)
      if (error) throw error
    }

    return NextResponse.json({
      imported: rowsToInsert.length,
      skipped,
      duplicates,
      needs_email: needsEmail,
      unrecognized_markets: [...unrecognizedMarkets],
    })
  } catch (error) {
    console.error('Prospect import error:', error)
    return NextResponse.json({ error: 'Could not import prospects' }, { status: 500 })
  }
}
