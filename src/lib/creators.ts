// Single source of truth for the Creators module: option lists, recruit
// score, Creator Boost categories, cohort targets and duplicate matching.
// Countries use the shared markets list (src/lib/markets.ts).

export const CREATOR_PLATFORMS = ['YouTube', 'TikTok', 'Instagram', 'Facebook', 'X', 'Other'] as const

// Same values as the Zuva platform's content_category (zuva-frontend
// lib/types.ts ContentCategory), labelled as the platform labels them.
export const CONTENT_CATEGORIES: { value: string; label: string }[] = [
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'music', label: 'Music' },
  { value: 'comedy', label: 'Comedy' },
  { value: 'drama_series', label: 'Drama Series' },
  { value: 'news', label: 'News' },
  { value: 'nature', label: 'Nature' },
  { value: 'sports', label: 'Sports' },
  { value: 'tech_innovation', label: 'Tech & Innovation' },
  { value: 'science_education', label: 'Science & Education' },
  { value: 'health_wellness', label: 'Health & Wellness' },
  { value: 'documentary', label: 'Documentary' },
  { value: 'discussion_debate', label: 'Discussion & Debate' },
  { value: 'interview', label: 'Interview' },
  { value: 'lifestyle_culture', label: 'Lifestyle & Culture' },
  { value: 'other', label: 'Other' },
]

// Categories that get the Creator Boost badge. NOTE: as of 2026-10-03 this
// differs from zuva-backend's PROTECTED_CATEGORIES (which has interview,
// lifestyle_culture and sports, and not news) — keep the two in sync before
// promising Boost to a creator.
export const BOOST_CATEGORIES = [
  'documentary',
  'discussion_debate',
  'news',
  'tech_innovation',
  'science_education',
  'health_wellness',
]

export const CREATOR_STAGES = [
  'Identified',
  'Contacted',
  'Replied',
  'Call Booked',
  'Verbal Yes',
  'Signed',
  'Onboarded',
  'Declined',
  'Parked',
] as const

// Stages that no longer need chasing — excluded from "follow-ups due".
export const CLOSED_CREATOR_STAGES = ['Onboarded', 'Declined', 'Parked']

// Stages that count as "signed" for the founding cohort.
export const SIGNED_CREATOR_STAGES = ['Signed', 'Onboarded']

export const CREATOR_TIERS = ['Anchor', 'Core', 'Emerging', 'None'] as const

export const CONTACT_METHODS = ['DM', 'Email', 'WhatsApp', 'Referral'] as const

export const FOUNDING_COHORT_TARGETS: Record<'Anchor' | 'Core' | 'Emerging', number> = {
  Anchor: 5,
  Core: 10,
  Emerging: 10,
}
export const FOUNDING_COHORT_TOTAL = Object.values(FOUNDING_COHORT_TARGETS).reduce((a, b) => a + b, 0)

export const CREATOR_STAGE_COLORS: Record<string, string> = {
  Identified: '#888888',
  Contacted: '#3B82F6',
  Replied: '#EAB308',
  'Call Booked': '#F37B0D',
  'Verbal Yes': '#A855F7',
  Signed: '#22C55E',
  Onboarded: '#14B8A6',
  Declined: '#EF4444',
  Parked: '#555555',
}

export const TIER_COLORS: Record<string, string> = {
  Anchor: '#F37B0D',
  Core: '#3B82F6',
  Emerging: '#22C55E',
  None: '#555555',
}

export function categoryLabel(value: string | null | undefined): string {
  return CONTENT_CATEGORIES.find((c) => c.value === value)?.label ?? '—'
}

export function isBoostCategory(category: string | null | undefined): boolean {
  return !!category && BOOST_CATEGORIES.includes(category)
}

// Recruit score, 0–6. Audience band uses half-open ranges:
//   < 1,000 → 0 · 1,000–4,999 → 1 · 5,000–99,999 → 3 · 100,000–1,000,000 → 2 · > 1,000,000 → 1
// (mid-size creators score highest: big enough to matter, small enough to
// be underserved). Diaspora share: < 20% → 0 · 20–50% → 1 · > 50% → 2.
// Pain signal adds 1. Missing numbers count as the lowest band.
export function audienceBand(followers: number | null | undefined): number {
  if (followers == null || followers < 1_000) return 0
  if (followers < 5_000) return 1
  if (followers < 100_000) return 3
  if (followers <= 1_000_000) return 2
  return 1
}

export function diasporaBand(pct: number | null | undefined): number {
  if (pct == null || pct < 20) return 0
  if (pct <= 50) return 1
  return 2
}

export function recruitScore(input: {
  followers?: number | null
  audience_diaspora_pct?: number | null
  pain_signal?: boolean | null
}): number {
  return audienceBand(input.followers) + diasporaBand(input.audience_diaspora_pct) + (input.pain_signal ? 1 : 0)
}

// contact_detail may only hold an email address or a WhatsApp number in
// international format (+country code) — never bank or payment details.
// The same rule is enforced by a CHECK constraint on the table.
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const WHATSAPP_RE = /^\+[0-9][0-9 ()-]{6,19}$/

export function validateContactDetail(value: string | null | undefined): { ok: true; value: string | null } | { ok: false; error: string } {
  const v = value?.trim() ?? ''
  if (!v) return { ok: true, value: null }
  if (EMAIL_RE.test(v) || WHATSAPP_RE.test(v)) return { ok: true, value: v }
  return {
    ok: false,
    error: 'Contact detail must be an email address or a WhatsApp number starting with + and the country code. Never store bank or payment details.',
  }
}

// Duplicate matching: profile URL when there is one (ignoring protocol,
// "www.", case and a trailing slash), otherwise display name + platform.
export function normalizeProfileUrl(url: string | null | undefined): string | null {
  const v = url?.trim().toLowerCase()
  if (!v) return null
  return v.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '')
}

export function namePlatformKey(name: string, platform: string | null | undefined): string {
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')
  return `${norm(name)}|${norm(platform ?? '')}`
}

// "12k", "1.2M", "12,500" → number. Returns null for blank/unreadable.
export function parseCount(value: string | null | undefined): number | null {
  const v = value?.trim().toLowerCase().replace(/,/g, '')
  if (!v) return null
  const m = v.match(/^(\d+(?:\.\d+)?)\s*([km])?$/)
  if (!m) return null
  const n = Number(m[1]) * (m[2] === 'k' ? 1_000 : m[2] === 'm' ? 1_000_000 : 1)
  return Math.round(n)
}

// DM assistant options.
export const DM_VARIANTS = [
  { value: 'nigerian', label: 'Nigerian creator' },
  { value: 'zimbabwean', label: 'Zimbabwean creator' },
  { value: 'caribbean', label: 'Caribbean creator' },
  { value: 'diaspora', label: 'UK / North America diaspora creator' },
  { value: 'francophone', label: 'Francophone creator' },
] as const

export const DM_TYPES = [
  { value: 'first', label: 'First message' },
  { value: 'follow_up', label: '5-day follow-up' },
  { value: 'post_reply', label: 'Post-reply' },
] as const

export type DmVariant = (typeof DM_VARIANTS)[number]['value']
export type DmType = (typeof DM_TYPES)[number]['value']

// Days until the next follow-up after a creator is contacted.
export const CREATOR_FOLLOW_UP_DAYS = 5

// Default DM voice from a creator's country (the user can change it).
const FRANCOPHONE_COUNTRIES = [
  'Benin', 'Burkina Faso', 'Burundi', 'Cameroon', 'Central African Republic', 'Chad', 'Comoros',
  'Congo (Republic)', 'DR Congo', "Cote d'Ivoire", 'Djibouti', 'Gabon', 'Guinea', 'Madagascar',
  'Mali', 'Niger', 'Senegal', 'Togo', 'Haiti',
]
const CARIBBEAN_COUNTRIES = [
  'Pan-Caribbean', 'Antigua and Barbuda', 'Bahamas', 'Barbados', 'Belize', 'Cuba', 'Dominica',
  'Dominican Republic', 'Grenada', 'Guyana', 'Jamaica', 'Saint Kitts and Nevis', 'Saint Lucia',
  'Saint Vincent and the Grenadines', 'Suriname', 'Trinidad and Tobago',
]

export function guessDmVariant(country: string | null | undefined): DmVariant {
  if (!country) return 'diaspora'
  if (country === 'Nigeria') return 'nigerian'
  if (country === 'Zimbabwe') return 'zimbabwean'
  if (FRANCOPHONE_COUNTRIES.includes(country)) return 'francophone'
  if (CARIBBEAN_COUNTRIES.includes(country)) return 'caribbean'
  return 'diaspora'
}

export function formatCount(n: number | null | undefined): string {
  if (n == null) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, '')}k`
  return String(n)
}
