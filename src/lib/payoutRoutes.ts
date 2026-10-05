import { MARKET_OPTIONS } from './markets'

// Whether a creator in each country/market can actually cash out today.
// Audit 2026-10-04: payouts are not live anywhere, and the Zimbabwe route
// is a placeholder. Flip a country to 'live' here once its payout route is
// tested end to end — the "Can't cash out yet" badge and the Pitch
// readiness panel both read this.

export type PayoutRouteStatus = 'live' | 'not_live'

export const PAYOUT_ROUTE_STATUS: Record<string, PayoutRouteStatus> = Object.fromEntries(
  MARKET_OPTIONS.map((market) => [market, 'not_live' as PayoutRouteStatus])
)

// Context shown next to a country's status, where there's something specific to know.
export const PAYOUT_ROUTE_NOTES: Record<string, string> = {
  Zimbabwe: 'Payout route is a placeholder in the backend.',
}

export function hasLivePayoutRoute(country: string | null | undefined): boolean {
  return !!country && PAYOUT_ROUTE_STATUS[country] === 'live'
}

export function livePayoutCountries(): string[] {
  return Object.entries(PAYOUT_ROUTE_STATUS)
    .filter(([, status]) => status === 'live')
    .map(([country]) => country)
}
