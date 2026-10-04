// Single source of truth for prospect markets. Used by the CRM filter bar,
// Add Prospect modal, Details tab, CSV import, lead scoring and the AI email
// prompt — add or rename a market here, not in those files.

export const MARKET_GROUPS: { label: string; options: string[] }[] = [
  {
    label: 'Diaspora regions',
    options: [
      'UK (Diaspora)',
      'Europe (Diaspora)',
      'North America (Diaspora)',
      'Australia (Diaspora)',
      'Asia (Diaspora)',
      'South America (Diaspora)',
    ],
  },
  {
    label: 'Multi-market',
    options: ['Pan-African', 'Pan-Caribbean'],
  },
  {
    label: 'Africa',
    options: [
      'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cameroon',
      'Central African Republic', 'Chad', 'Comoros', 'Congo (Republic)', 'DR Congo', "Cote d'Ivoire",
      'Djibouti', 'Egypt', 'Equatorial Guinea', 'Eritrea', 'Eswatini', 'Ethiopia', 'Gabon', 'Gambia',
      'Ghana', 'Guinea', 'Guinea-Bissau', 'Kenya', 'Lesotho', 'Liberia', 'Libya', 'Madagascar', 'Malawi',
      'Mali', 'Mauritania', 'Mauritius', 'Morocco', 'Mozambique', 'Namibia', 'Niger', 'Nigeria', 'Rwanda',
      'Sao Tome and Principe', 'Senegal', 'Seychelles', 'Sierra Leone', 'Somalia', 'South Africa',
      'South Sudan', 'Sudan', 'Tanzania', 'Togo', 'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe',
    ],
  },
  {
    label: 'Caribbean',
    options: [
      'Antigua and Barbuda', 'Bahamas', 'Barbados', 'Belize', 'Cuba', 'Dominica', 'Dominican Republic',
      'Grenada', 'Guyana', 'Haiti', 'Jamaica', 'Saint Kitts and Nevis', 'Saint Lucia',
      'Saint Vincent and the Grenadines', 'Suriname', 'Trinidad and Tobago',
    ],
  },
]

// Shown after the grouped sections, outside any group.
export const OTHER_MARKET = 'Other'

export const MARKET_OPTIONS: string[] = [...MARKET_GROUPS.flatMap((g) => g.options), OTHER_MARKET]

// Old labels from before the expanded list. Applied on CSV import; the
// 2026-10-03-prospects-market-remap.sql migration applies the same mapping
// to rows already in command_prospects.
export const LEGACY_MARKET_MAP: Record<string, string> = {
  'African Diaspora (UK)': 'UK (Diaspora)',
  'Caribbean Diaspora (UK)': 'UK (Diaspora)',
  'African Diaspora (USA)': 'North America (Diaspora)',
  'African Diaspora (Canada)': 'North America (Diaspora)',
  'Trinidad & Tobago': 'Trinidad and Tobago',
}

const CANONICAL_BY_LOWER = new Map<string, string>([
  ...MARKET_OPTIONS.map((m) => [m.toLowerCase(), m] as [string, string]),
  ...Object.entries(LEGACY_MARKET_MAP).map(([legacy, m]) => [legacy.toLowerCase(), m] as [string, string]),
])

// Resolves free-text input (e.g. a CSV cell) to a canonical market, matching
// case-insensitively and translating legacy labels. Returns null when the
// value isn't recognised, so the caller decides what to do with it.
export function normalizeMarket(value: string | null | undefined): string | null {
  if (!value) return null
  return CANONICAL_BY_LOWER.get(value.trim().toLowerCase()) ?? null
}
