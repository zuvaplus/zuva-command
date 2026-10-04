import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { qualifyLead } from '@/lib/qualifyLead'
import { normalizeMarket, OTHER_MARKET } from '@/lib/markets'
import { NEEDS_EMAIL_TAG } from '@/lib/prospectTags'
import { parseProspectCsv, prospectDedupeKey } from '@/lib/prospectCsv'

const PAGE_SIZE = 1000 // Supabase caps a single select at 1000 rows

// company+market keys for every prospect already in the CRM.
async function existingProspectKeys(): Promise<Set<string>> {
  const keys = new Set<string>()
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabaseAdmin
      .from('command_prospects')
      .select('company, market')
      .order('id')
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw error
    for (const row of data ?? []) keys.add(prospectDedupeKey(row.company, row.market))
    if (!data || data.length < PAGE_SIZE) return keys
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object' && 'message' in error) return String(error.message)
  return String(error)
}

export async function POST(request: NextRequest) {
  try {
    const { csv_text } = (await request.json()) as { csv_text: string }
    if (!csv_text || !csv_text.trim()) {
      return NextResponse.json({ error: 'The CSV is empty — paste some rows or choose a file.' }, { status: 400 })
    }

    const rows = parseProspectCsv(csv_text)
    const existingKeys = await existingProspectKeys()

    const rowsToInsert: Record<string, unknown>[] = []
    const seenCompanies = new Set<string>()
    const unrecognizedMarkets = new Set<string>()
    let missingCompany = 0
    let duplicateExisting = 0
    let duplicateInFile = 0
    let needsEmail = 0

    for (const row of rows) {
      const { company } = row
      if (!company) {
        missingCompany++
        continue
      }

      // Legacy labels ("African Diaspora (UK)", "Trinidad & Tobago", …) map
      // to the current list; anything unrecognised becomes Other, with the
      // original value kept in notes so nothing is lost.
      let market = normalizeMarket(row.market)
      let notes: string | null = null
      if (row.market && !market) {
        unrecognizedMarkets.add(row.market)
        market = OTHER_MARKET
        notes = `Imported market: ${row.market}`
      }

      // Already in the CRM with the same market → skip. This is what makes
      // re-running the same import harmless.
      if (existingKeys.has(prospectDedupeKey(company, market))) {
        duplicateExisting++
        continue
      }

      // Within this file, first occurrence of a company wins.
      const companyKey = company.toLowerCase().replace(/\s+/g, ' ')
      if (seenCompanies.has(companyKey)) {
        duplicateInFile++
        continue
      }
      seenCompanies.add(companyKey)

      const email = row.email || null
      if (!email) needsEmail++

      const industry = row.industry || null
      const size = row.size || 'SME'

      rowsToInsert.push({
        company,
        contact: row.contact || null,
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

    const details: string[] = []
    if (duplicateExisting + duplicateInFile > 0) {
      details.push(`Duplicates: ${duplicateExisting} already in the CRM (same company and market), ${duplicateInFile} repeated in this file.`)
    }
    if (missingCompany > 0) details.push(`Other: ${missingCompany} rows had no company name.`)
    if (needsEmail > 0) details.push(`${needsEmail} imported without an email (tagged "needs email").`)
    if (unrecognizedMarkets.size > 0) {
      details.push(`Unrecognised markets set to Other (original kept in notes): ${[...unrecognizedMarkets].join(', ')}`)
    }

    return NextResponse.json({
      imported: rowsToInsert.length,
      details,
      duplicates: duplicateExisting + duplicateInFile,
      duplicate_existing: duplicateExisting,
      duplicate_in_file: duplicateInFile,
      skipped_other: missingCompany,
      needs_email: needsEmail,
      unrecognized_markets: [...unrecognizedMarkets],
    })
  } catch (error) {
    console.error('Prospect import error:', error)
    // Nothing was inserted (the insert is a single batch), so say so.
    return NextResponse.json(
      { error: `Import failed, nothing was imported: ${errorMessage(error)}` },
      { status: 500 }
    )
  }
}
