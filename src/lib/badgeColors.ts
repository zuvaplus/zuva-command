export const PRIORITY_COLORS: Record<string, string> = {
  Critical: '#EF4444',
  High: '#F97316',
  Medium: '#3B82F6',
  Low: '#888888',
}

export const TASK_STATUS_COLORS: Record<string, string> = {
  'Not Started': '#888888',
  'In Progress': '#3B82F6',
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

export function colorFor(map: Record<string, string>, key: string): string {
  return map[key] ?? '#888888'
}
