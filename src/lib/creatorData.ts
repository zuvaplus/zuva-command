import { supabaseAdmin } from './supabase'
import { CLOSED_CREATOR_STAGES, FOUNDING_COHORT_TARGETS, SIGNED_CREATOR_STAGES, namePlatformKey, normalizeProfileUrl } from './creators'
import type { CommandCreator } from './types'

const PAGE_SIZE = 1000 // Supabase caps a single select at 1000 rows

export async function fetchAllCreators(): Promise<CommandCreator[]> {
  const all: CommandCreator[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabaseAdmin
      .from('command_creators')
      .select('*')
      .order('recruit_score', { ascending: false })
      .order('created_at', { ascending: false })
      .order('id')
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw error
    all.push(...((data ?? []) as CommandCreator[]))
    if (!data || data.length < PAGE_SIZE) return all
  }
}

// Lookup sets for duplicate detection: a creator with a profile URL is a
// duplicate if that (normalised) URL exists; one without a URL is a
// duplicate if the same display name + platform exists.
export interface CreatorDuplicateIndex {
  urls: Set<string>
  namePlatforms: Set<string>
}

export function buildDuplicateIndex(creators: Pick<CommandCreator, 'profile_url' | 'display_name' | 'primary_platform'>[]): CreatorDuplicateIndex {
  const index: CreatorDuplicateIndex = { urls: new Set(), namePlatforms: new Set() }
  for (const c of creators) addToIndex(index, c)
  return index
}

export function addToIndex(index: CreatorDuplicateIndex, c: { profile_url: string | null; display_name: string; primary_platform: string }) {
  const url = normalizeProfileUrl(c.profile_url)
  if (url) index.urls.add(url)
  index.namePlatforms.add(namePlatformKey(c.display_name, c.primary_platform))
}

export function isDuplicate(index: CreatorDuplicateIndex, c: { profile_url: string | null; display_name: string; primary_platform: string }): boolean {
  const url = normalizeProfileUrl(c.profile_url)
  if (url) return index.urls.has(url)
  return index.namePlatforms.has(namePlatformKey(c.display_name, c.primary_platform))
}

export async function logCreatorActivity(
  creatorId: string,
  activityType: string,
  description: string,
  metadata: Record<string, unknown> | null = null
) {
  const { error } = await supabaseAdmin
    .from('command_creator_activity')
    .insert({ creator_id: creatorId, activity_type: activityType, description, metadata })
  if (error) console.error('Creator activity log error:', error)
}

// Shared by the sidebar badge, the Morning Brief stat cards and the AI brief.
export async function getCreatorSummary() {
  const today = new Date().toISOString().slice(0, 10)
  const [dueRes, signedRes] = await Promise.all([
    supabaseAdmin
      .from('command_creators')
      .select('display_name, primary_platform, stage, follow_up_due, proposed_tier')
      .lte('follow_up_due', today)
      .not('stage', 'in', `(${CLOSED_CREATOR_STAGES.map((s) => `"${s}"`).join(',')})`)
      .order('follow_up_due', { ascending: true }),
    supabaseAdmin.from('command_creators').select('proposed_tier').in('stage', SIGNED_CREATOR_STAGES),
  ])
  if (dueRes.error) throw dueRes.error
  if (signedRes.error) throw signedRes.error

  const signedByTier: Record<string, number> = { Anchor: 0, Core: 0, Emerging: 0, None: 0 }
  for (const row of signedRes.data ?? []) signedByTier[row.proposed_tier] = (signedByTier[row.proposed_tier] ?? 0) + 1
  const signedInCohort = signedByTier.Anchor + signedByTier.Core + signedByTier.Emerging

  return {
    followUpsDue: dueRes.data ?? [],
    cohort: {
      signed: signedInCohort,
      target: Object.values(FOUNDING_COHORT_TARGETS).reduce((a, b) => a + b, 0),
      byTier: signedByTier,
      targets: FOUNDING_COHORT_TARGETS,
    },
  }
}
