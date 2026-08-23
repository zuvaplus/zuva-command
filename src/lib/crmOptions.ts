// Canonical dropdown option lists shared by the Add Prospect modal and the
// CRM filter bar. Deliberately broader than qualifyLead.ts's high-value
// lists — those are the subset that scores higher, not the full set of
// valid values, so a real dropdown needs more options than that to have
// any actual scoring differentiation.
export const INDUSTRY_OPTIONS = [
  'Fashion & Apparel',
  'Beauty & Haircare',
  'Food & Beverage',
  'Music & Entertainment',
  'Film & Media',
  'Financial Services',
  'Telecom',
  'Tech & Apps',
  'Travel & Tourism',
  'Real Estate',
  'Education',
  'Retail',
  'Sports',
  'Other',
]

export const MARKET_OPTIONS = [
  'Nigeria',
  'Ghana',
  'South Africa',
  'Kenya',
  'African Diaspora (UK)',
  'African Diaspora (USA)',
  'African Diaspora (Canada)',
  'Caribbean Diaspora (UK)',
  'Jamaica',
  'Trinidad & Tobago',
  'Zimbabwe',
  'Global',
  'Other',
]

export const SIZE_OPTIONS = ['SME', 'Mid-Market', 'Enterprise']

export const STAGE_OPTIONS = ['New Lead', 'Contacted', 'Responded', 'Qualified', 'Proposal Sent', 'Converted']

export const EMAIL_TYPE_OPTIONS: { value: 'cold' | 'follow1' | 'follow2' | 'nurture'; label: string }[] = [
  { value: 'cold', label: 'Cold Outreach' },
  { value: 'follow1', label: 'Follow-Up 1' },
  { value: 'follow2', label: 'Follow-Up 2' },
  { value: 'nurture', label: 'Nurture' },
]
