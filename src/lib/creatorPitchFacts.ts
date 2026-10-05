// What the Creators DM assistant is allowed to tell creators — edit here.
//
// status:
//   live      → true today; stated in the present tense
//   at_launch → planned; framed only as "we're launching with …"
//   hold      → not confirmed; never mentioned in a DM
//
// Keep `fact` free of numbers until they're confirmed in the database —
// the DM checker flags any figure that isn't listed in `allowedFigures`.
// Audit 2026-10-04: creators currently earn only from Suns tips; no ad
// revenue share yet; payouts are not live (see payoutRoutes.ts).

export type PitchFactStatus = 'live' | 'at_launch' | 'hold'

export interface PitchFact {
  id: string
  label: string
  status: PitchFactStatus
  /** The claim, in plain words, as the AI may use it. */
  fact: string
  /** Only offer this fact to creators in a Creator Boost category. */
  boostCategoriesOnly?: boolean
  /** Numbers the AI may quote for this fact (e.g. '70/30'). Empty = none. */
  allowedFigures?: string[]
  /** Phrases that would mean the fact was used — checked when status is hold. */
  mentionPatterns?: RegExp[]
  /** Internal note shown in the Pitch readiness panel, never sent to the AI. */
  note?: string
}

export const CREATOR_PITCH_FACTS: PitchFact[] = [
  {
    id: 'tip_split',
    label: 'Suns tip split',
    status: 'live',
    fact: 'Fans can tip creators in Suns, and the creator keeps the larger share of every tip.',
    note:
      'Backend split is per creator (creator_profiles.creator_share_pct); a code comment says 60/70/85% by tier. Confirm the real values before adding a number here.',
    mentionPatterns: [/\btip/i, /\bsuns?\b/i],
  },
  {
    id: 'ad_revenue_share',
    label: 'Ad revenue share',
    status: 'at_launch',
    fact: 'Creators will share in the ad revenue their videos earn.',
    note: 'Not built yet. No split percentage until it is.',
    mentionPatterns: [/ad revenue/i, /revenue share/i, /\bad(vert)?s?\b.*\bshare/i],
  },
  {
    id: 'creator_boost',
    label: 'Creator Boost',
    status: 'at_launch',
    fact: 'Creator Boost gives extra support to creators in protected categories.',
    boostCategoriesOnly: true,
    note: 'No multiplier or view threshold in DMs. Category list: BOOST_CATEGORIES in creators.ts.',
    mentionPatterns: [/creator boost/i, /\bboost/i],
  },
  {
    id: 'no_geo_cpm_penalty',
    label: 'No geographic CPM penalty',
    status: 'hold',
    fact: 'Creators are not paid less per view because of where they or their audience are.',
    note: 'On hold: there is no ad revenue share yet, so this cannot be true today.',
    mentionPatterns: [/\bcpm\b/i, /geograph/i, /where (you|your audience|they) (are|live)/i, /paid less/i],
  },
]

export const PITCH_STATUS_META: Record<PitchFactStatus, { label: string; color: string; dmRule: string }> = {
  live: { label: 'Live', color: '#22C55E', dmRule: 'Stated as true today' },
  at_launch: { label: 'At launch', color: '#EAB308', dmRule: 'Framed as "we\'re launching with…"' },
  hold: { label: 'On hold', color: '#EF4444', dmRule: 'Never mentioned' },
}
