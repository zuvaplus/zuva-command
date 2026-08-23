import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { qualifyLead } from '@/lib/qualifyLead'
import { parseCsvLine } from '@/lib/csv'

export async function POST(request: NextRequest) {
  try {
    const { csv_text } = (await request.json()) as { csv_text: string }
    if (!csv_text || !csv_text.trim()) {
      return NextResponse.json({ error: 'csv_text is required' }, { status: 400 })
    }

    const lines = csv_text.trim().split(/\r?\n/).filter((line) => line.trim() !== '')
    if (lines.length === 0) {
      return NextResponse.json({ imported: 0, skipped: 0 })
    }

    const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase())
    const dataLines = header.includes('company') && header.includes('email') ? lines.slice(1) : lines

    const columnIndex = (name: string) => header.indexOf(name)
    const hasHeader = dataLines.length !== lines.length

    const rowsToInsert: Record<string, unknown>[] = []
    let skipped = 0

    for (const line of dataLines) {
      const cols = parseCsvLine(line)
      // company,contact,email,industry,market,size — positional fallback
      // when there's no header row to key off of.
      const get = (name: string, fallbackIndex: number) =>
        hasHeader ? cols[columnIndex(name)]?.trim() : cols[fallbackIndex]?.trim()

      const company = get('company', 0)
      const email = get('email', 2)

      if (!company || !email) {
        skipped++
        continue
      }

      const industry = get('industry', 3) || null
      const market = get('market', 4) || null
      const size = get('size', 5) || 'SME'

      rowsToInsert.push({
        company,
        contact: get('contact', 1) || null,
        email,
        industry,
        market,
        size,
        score: qualifyLead(industry ?? '', market ?? '', size),
      })
    }

    if (rowsToInsert.length > 0) {
      const { error } = await supabaseAdmin.from('command_prospects').insert(rowsToInsert)
      if (error) throw error
    }

    return NextResponse.json({ imported: rowsToInsert.length, skipped })
  } catch (error) {
    console.error('Prospect import error:', error)
    return NextResponse.json({ error: 'Could not import prospects' }, { status: 500 })
  }
}
