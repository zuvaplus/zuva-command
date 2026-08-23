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

const HIGH_VALUE_MARKETS = [
  'Nigeria',
  'Ghana',
  'South Africa',
  'Kenya',
  'African Diaspora (UK)',
  'African Diaspora (USA)',
  'African Diaspora (Canada)',
  'Caribbean Diaspora (UK)',
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
