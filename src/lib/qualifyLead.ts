const HIGH_VALUE_INDUSTRIES = [
  'Fashion & Apparel',
  'Beauty & Haircare',
  'Food & Beverage',
  'Music & Entertainment',
  'Film & Media',
  'Financial Services',
  'Telecom',
  'Tech & Apps',
]

// Must use the exact labels from src/lib/markets.ts.
const HIGH_VALUE_MARKETS = [
  'Nigeria',
  'Ghana',
  'South Africa',
  'Kenya',
  'Zimbabwe',
  'Jamaica',
  'Trinidad and Tobago',
  'UK (Diaspora)',
  'North America (Diaspora)',
  'Europe (Diaspora)',
  'Australia (Diaspora)',
]

export function qualifyLead(industry: string, market: string, size: string): number {
  let score = 0
  if (HIGH_VALUE_INDUSTRIES.includes(industry)) score += 2
  else score += 1
  if (HIGH_VALUE_MARKETS.includes(market)) score += 2
  else score += 1
  if (size === 'Enterprise') score += 1
  else if (size === 'Mid-Market') score += 0.5
  return Math.min(5, Math.round(score))
}
