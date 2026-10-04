import Papa from 'papaparse'

// Shared by the creator import route (server) and the Import CSV modal's
// preview line (client). A header row is required — there are too many
// columns to rely on position. Common alternative header names are accepted.

const HEADER_ALIASES: Record<string, string> = {
  display_name: 'display_name', name: 'display_name', creator: 'display_name', channel: 'display_name',
  primary_platform: 'primary_platform', platform: 'primary_platform',
  profile_url: 'profile_url', url: 'profile_url', link: 'profile_url', profile: 'profile_url',
  followers: 'followers', subscribers: 'followers', subs: 'followers',
  avg_views: 'avg_views', average_views: 'avg_views', views: 'avg_views',
  country: 'country', market: 'country',
  content_category: 'content_category', category: 'content_category',
  primary_language: 'primary_language', language: 'primary_language',
  audience_diaspora_pct: 'audience_diaspora_pct', diaspora_pct: 'audience_diaspora_pct', diaspora: 'audience_diaspora_pct',
  pain_signal: 'pain_signal', pain: 'pain_signal',
  proposed_tier: 'proposed_tier', tier: 'proposed_tier',
  source: 'source',
  contact_method: 'contact_method',
  contact_detail: 'contact_detail', contact: 'contact_detail',
  notes: 'notes',
}

export const CREATOR_CSV_COLUMNS = [
  'display_name', 'primary_platform', 'profile_url', 'followers', 'avg_views', 'country',
  'content_category', 'primary_language', 'audience_diaspora_pct', 'pain_signal',
  'proposed_tier', 'source', 'contact_method', 'contact_detail', 'notes',
] as const

export type CreatorCsvRow = Record<(typeof CREATOR_CSV_COLUMNS)[number], string>

export type ParsedCreatorCsv = { ok: true; rows: CreatorCsvRow[] } | { ok: false; error: string }

function headerKey(h: string): string | undefined {
  return HEADER_ALIASES[h.trim().toLowerCase().replace(/[\s-]+/g, '_').replace(/[^a-z_]/g, '')]
}

export function parseCreatorCsv(text: string): ParsedCreatorCsv {
  const rows = Papa.parse<string[]>(text.trim(), { skipEmptyLines: 'greedy' }).data
  if (rows.length === 0) return { ok: true, rows: [] }

  const columns = rows[0].map(headerKey)
  if (!columns.includes('display_name')) {
    return { ok: false, error: 'The first row must be a header row with at least a display_name (or name) column.' }
  }

  return {
    ok: true,
    rows: rows.slice(1).map((cols) => {
      const row = Object.fromEntries(CREATOR_CSV_COLUMNS.map((c) => [c, ''])) as CreatorCsvRow
      columns.forEach((key, i) => {
        if (key && !row[key as keyof CreatorCsvRow]) row[key as keyof CreatorCsvRow] = (cols[i] ?? '').trim()
      })
      return row
    }),
  }
}
