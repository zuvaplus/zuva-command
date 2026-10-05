'use client'

import { useCallback, useEffect, useState } from 'react'
import { ExternalLink, Loader2 } from 'lucide-react'
import { categoryLabel, formatCount, isBoostCategory } from '@/lib/creators'
import type { CommandCreator, CommandCreatorActivity } from '@/lib/types'
import CreatorDetailsTab from './CreatorDetailsTab'
import DmAssistant from './DmAssistant'
import { hasLivePayoutRoute } from '@/lib/payoutRoutes'
import { CantCashOutBadge, CreatorBoostBadge, StageBadge, TierBadge } from './CreatorBadges'

type Tab = 'details' | 'dm'

async function fetchCreatorDetail(
  id: string
): Promise<{ creator: CommandCreator; activity: CommandCreatorActivity[] } | { error: string }> {
  try {
    const res = await fetch(`/api/creators/${id}`)
    const data = await res.json().catch(() => null)
    if (!res.ok || !data) return { error: data?.error || 'Could not load creator' }
    return { creator: data.creator, activity: data.activity ?? [] }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not load creator' }
  }
}

export default function CreatorDetail({
  creatorId,
  onChanged,
  onDeleted,
}: {
  creatorId: string
  onChanged: (creator: CommandCreator) => void
  onDeleted: () => void
}) {
  const [tab, setTab] = useState<Tab>('details')
  const [creator, setCreator] = useState<CommandCreator | null>(null)
  const [activity, setActivity] = useState<CommandCreatorActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const apply = useCallback((result: Awaited<ReturnType<typeof fetchCreatorDetail>>) => {
    if ('error' in result) {
      setError(result.error)
    } else {
      setCreator(result.creator)
      setActivity(result.activity)
      setError(null)
    }
    setLoading(false)
  }, [])

  const load = useCallback(async () => apply(await fetchCreatorDetail(creatorId)), [apply, creatorId])

  // The parent keys this component by creator id, so a different creator
  // remounts it (fresh loading state) rather than reusing stale data.
  useEffect(() => {
    let cancelled = false
    fetchCreatorDetail(creatorId).then((result) => { if (!cancelled) apply(result) })
    return () => { cancelled = true }
  }, [apply, creatorId])

  // Returns an error message for the tab to show, or null on success.
  async function handleUpdate(patch: Record<string, unknown>): Promise<string | null> {
    const res = await fetch(`/api/creators/${creatorId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data) return data?.error || `Could not save (HTTP ${res.status})`
    setCreator(data)
    onChanged(data)
    load() // refresh the activity log
    return null
  }

  function handleContacted(updated: CommandCreator) {
    setCreator(updated)
    onChanged(updated)
    load()
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={20} className="animate-spin" style={{ color: '#888888' }} />
      </div>
    )
  }
  if (error || !creator) return <p className="p-6 text-sm text-red-500">{error ?? 'Creator not found'}</p>

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-6 pt-5" style={{ borderColor: '#2A2A2A' }}>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-bold text-white">{creator.display_name}</h2>
          <StageBadge stage={creator.stage} />
          <TierBadge tier={creator.proposed_tier} />
          {isBoostCategory(creator.content_category) && <CreatorBoostBadge />}
          {!hasLivePayoutRoute(creator.country) && <CantCashOutBadge country={creator.country} />}
        </div>
        <p className="mb-4 flex flex-wrap items-center gap-1 text-sm" style={{ color: '#888888' }}>
          {creator.primary_platform} · {formatCount(creator.followers)} followers · {categoryLabel(creator.content_category)}
          {creator.profile_url && (
            <a
              href={/^https?:\/\//i.test(creator.profile_url) ? creator.profile_url : `https://${creator.profile_url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 inline-flex items-center gap-0.5 hover:underline"
              style={{ color: '#F37B0D' }}
            >
              Profile <ExternalLink size={12} />
            </a>
          )}
        </p>
        <div className="flex gap-1">
          {(['details', 'dm'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="rounded-t-md px-4 py-2 text-sm font-semibold transition-colors"
              style={tab === t ? { backgroundColor: '#1A1A1A', color: '#F37B0D', borderBottom: '2px solid #F37B0D' } : { color: '#888888' }}
            >
              {t === 'details' ? 'Details & Activity' : 'DM Assistant'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {tab === 'details' ? (
          <CreatorDetailsTab
            key={creator.id}
            creator={creator}
            activity={activity}
            onUpdate={handleUpdate}
            onDeleted={onDeleted}
          />
        ) : (
          <DmAssistant creator={creator} onContacted={handleContacted} />
        )}
      </div>
    </div>
  )
}
