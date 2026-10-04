import Papa from 'papaparse'

// Shared by the import route (server) and the Import CSV modal's preview
// line (client), so both read a file the same way.

// Column order used when the CSV has no header row.
const POSITIONAL_COLUMNS = ['company', 'contact', 'email', 'industry', 'market', 'size']

export interface ProspectCsvRow {
  company: string
  contact: string
  email: string
  industry: string
  market: string
  size: string
}

export function parseProspectCsv(text: string): ProspectCsvRow[] {
  // papaparse handles quoted fields, embedded commas/newlines and "" escapes.
  const rows = Papa.parse<string[]>(text.trim(), { skipEmptyLines: 'greedy' }).data
  if (rows.length === 0) return []

  const firstRow = rows[0].map((h) => h.trim().toLowerCase())
  const hasHeader = firstRow.includes('company')
  const columns = hasHeader ? firstRow : POSITIONAL_COLUMNS
  const dataRows = hasHeader ? rows.slice(1) : rows

  return dataRows.map((cols) => {
    const get = (name: string) => {
      const i = columns.indexOf(name)
      return i === -1 ? '' : (cols[i] ?? '').trim()
    }
    return {
      company: get('company'),
      contact: get('contact'),
      email: get('email'),
      industry: get('industry'),
      market: get('market'),
      size: get('size'),
    }
  })
}

// Key used to spot a duplicate prospect: same company + same market,
// ignoring case and extra whitespace.
export function prospectDedupeKey(company: string, market: string | null): string {
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')
  return `${norm(company)}|${norm(market ?? '')}`
}
