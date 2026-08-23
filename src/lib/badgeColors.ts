export const PRIORITY_COLORS: Record<string, string> = {
  Critical: '#EF4444',
  High: '#F97316',
  Medium: '#3B82F6',
  Low: '#888888',
}

export const TASK_STATUS_COLORS: Record<string, string> = {
  'Not Started': '#888888',
  'In Progress': '#3B82F6',
  Blocked: '#EF4444',
  Completed: '#22C55E',
}

export const FUNDING_STATUS_COLORS: Record<string, string> = {
  Research: '#888888',
  Preparing: '#3B82F6',
  Submitted: '#EAB308',
  'Under Review': '#F37B0D',
  Approved: '#22C55E',
  Declined: '#EF4444',
  Deferred: '#F97316',
}

export const STAGE_COLORS: Record<string, string> = {
  'New Lead': '#888888',
  Contacted: '#3B82F6',
  Responded: '#EAB308',
  Qualified: '#F37B0D',
  'Proposal Sent': '#A855F7',
  Converted: '#22C55E',
}

export const CAMPAIGN_STATUS_COLORS: Record<string, string> = {
  Pending: '#888888',
  Active: '#22C55E',
  Paused: '#F37B0D',
  Completed: '#3B82F6',
}

export const SPORTS_STATUS_COLORS: Record<string, string> = {
  Scheduled: '#3B82F6',
  Live: '#22C55E',
  Completed: '#888888',
  Cancelled: '#EF4444',
}

export const SCORE_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Cold', color: '#888888' },
  2: { label: 'Warming', color: '#3B82F6' },
  3: { label: 'Interested', color: '#EAB308' },
  4: { label: 'Hot', color: '#F97316' },
  5: { label: '🔥 Ready', color: '#EF4444' },
}

export function colorFor(map: Record<string, string>, key: string): string {
  return map[key] ?? '#888888'
}

export function scoreInfo(score: number): { label: string; color: string } {
  return SCORE_LABELS[Math.round(score)] ?? SCORE_LABELS[1]
}
