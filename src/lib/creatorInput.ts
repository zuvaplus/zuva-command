import {
  CONTACT_METHODS,
  CONTENT_CATEGORIES,
  CREATOR_PLATFORMS,
  CREATOR_STAGES,
  CREATOR_TIERS,
  validateContactDetail,
} from './creators'
import { MARKET_OPTIONS } from './markets'

// Validates and cleans creator fields from a request body. Only known
// columns are ever returned — never spread a client body into a query.
// With partial = true (PATCH), fields absent from the body are left out.

const TEXT_FIELDS = ['display_name', 'profile_url', 'primary_language', 'source', 'notes'] as const

type Result = { ok: true; fields: Record<string, unknown> } | { ok: false; error: string }

function oneOf(list: readonly string[], value: unknown, field: string, nullable: boolean): string | null | Error {
  if (value === null || value === undefined || value === '') {
    return nullable ? null : new Error(`${field} is required`)
  }
  if (typeof value === 'string' && list.includes(value)) return value
  return new Error(`${field} must be one of: ${list.join(', ')}`)
}

function intInRange(value: unknown, field: string, min: number, max: number): number | null | Error {
  if (value === null || value === undefined || value === '') return null
  const n = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''))
  if (!Number.isFinite(n) || n < min || n > max) return new Error(`${field} must be a number from ${min} to ${max}`)
  return Math.round(n)
}

function isDate(value: unknown): boolean {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

export function sanitizeCreatorFields(body: Record<string, unknown>, partial: boolean): Result {
  const out: Record<string, unknown> = {}
  const has = (k: string) => k in body
  const want = (k: string) => !partial || has(k)

  for (const f of TEXT_FIELDS) {
    if (!want(f)) continue
    const v = typeof body[f] === 'string' ? (body[f] as string).trim() : ''
    out[f] = v || null
  }
  if (want('display_name') && !out.display_name) return { ok: false, error: 'Display name is required' }

  const checks: [string, () => unknown][] = [
    ['primary_platform', () => oneOf(CREATOR_PLATFORMS, body.primary_platform ?? (partial ? undefined : 'YouTube'), 'Platform', false)],
    ['country', () => oneOf(MARKET_OPTIONS, body.country, 'Country', true)],
    ['content_category', () => oneOf(CONTENT_CATEGORIES.map((c) => c.value), body.content_category, 'Category', true)],
    ['stage', () => oneOf(CREATOR_STAGES, body.stage ?? (partial ? undefined : 'Identified'), 'Stage', false)],
    ['proposed_tier', () => oneOf(CREATOR_TIERS, body.proposed_tier ?? (partial ? undefined : 'None'), 'Tier', false)],
    ['contact_method', () => oneOf(CONTACT_METHODS, body.contact_method, 'Contact method', true)],
    ['followers', () => intInRange(body.followers, 'Followers', 0, 2_000_000_000)],
    ['avg_views', () => intInRange(body.avg_views, 'Average views', 0, 2_000_000_000)],
    ['audience_diaspora_pct', () => intInRange(body.audience_diaspora_pct, 'Diaspora %', 0, 100)],
    ['recruit_score', () => intInRange(body.recruit_score, 'Recruit score', 0, 6)],
  ]
  for (const [field, check] of checks) {
    if (!want(field) || (field === 'recruit_score' && !has(field))) continue
    const v = check()
    if (v instanceof Error) return { ok: false, error: v.message }
    out[field] = v
  }

  if (want('pain_signal')) out.pain_signal = body.pain_signal === true

  if (want('contact_detail')) {
    const c = validateContactDetail(typeof body.contact_detail === 'string' ? body.contact_detail : null)
    if (!c.ok) return { ok: false, error: c.error }
    out.contact_detail = c.value
  }

  for (const f of ['last_contact', 'follow_up_due'] as const) {
    if (!has(f)) continue
    if (body[f] === null || body[f] === '') out[f] = null
    else if (isDate(body[f])) out[f] = body[f]
    else return { ok: false, error: `${f} must be a date (YYYY-MM-DD)` }
  }

  return { ok: true, fields: out }
}

// Postgres unique-violation on the profile_url index.
export function isDuplicateUrlError(error: unknown): boolean {
  return !!error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === '23505'
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object' && 'message' in error) return String((error as { message: unknown }).message)
  return String(error)
}
