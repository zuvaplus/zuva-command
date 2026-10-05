'use client'

import ColorBadge from '@/components/ColorBadge'
import { categoryLabel, formatCount, isBoostCategory } from '@/lib/creators'
import type { CommandCreator } from '@/lib/types'
import { hasLivePayoutRoute } from '@/lib/payoutRoutes'
import { CantCashOutBadge, CreatorBoostBadge, StageBadge, TierBadge, scoreColor } from './CreatorBadges'

export function isCreatorDue(c: CommandCreator, closedStages: string[]): boolean {
  if (!c.follow_up_due || closedStages.includes(c.stage)) return false
  return c.follow_up_due <= new Date().toISOString().slice(0, 10)
}

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function CreatorList({
  creators,
  selectedId,
  closedStages,
  onSelect,
  onScoreChange,
}: {
  creators: CommandCreator[]
  selectedId: string | null
  closedStages: string[]
  onSelect: (id: string) => void
  onScoreChange: (id: string, score: number) => void
}) {
  const sorted = [...creators].sort((a, b) => {
    const aDue = isCreatorDue(a, closedStages)
    const bDue = isCreatorDue(b, closedStages)
    if (aDue !== bDue) return aDue ? -1 : 1
    return b.recruit_score - a.recruit_score
  })

  if (sorted.length === 0) {
    return <p className="p-6 text-sm" style={{ color: '#888888' }}>No creators match these filters.</p>
  }

  return (
    <div className="divide-y" style={{ borderColor: '#2A2A2A' }}>
      {sorted.map((c) => {
        const due = isCreatorDue(c, closedStages)
        const selected = c.id === selectedId
        return (
          <div
            key={c.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(c.id)}
            onKeyDown={(e) => { if (e.key === 'Enter') onSelect(c.id) }}
            className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors"
            style={{
              backgroundColor: selected ? '#1A1A1A' : 'transparent',
              borderLeft: due ? '3px solid #EF4444' : '3px solid transparent',
            }}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{c.display_name}</p>
              <p className="truncate text-xs" style={{ color: '#888888' }}>
                {c.primary_platform} · {formatCount(c.followers)} followers{c.country ? ` · ${c.country}` : ''}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {c.content_category && <ColorBadge label={categoryLabel(c.content_category)} color="#3B82F6" />}
                {isBoostCategory(c.content_category) && <CreatorBoostBadge />}
                <TierBadge tier={c.proposed_tier} />
                {!hasLivePayoutRoute(c.country) && <CantCashOutBadge country={c.country} />}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <StageBadge stage={c.stage} />
              <label className="flex items-center gap-1 text-[11px]" style={{ color: '#888888' }} onClick={(e) => e.stopPropagation()}>
                Score
                <select
                  value={c.recruit_score}
                  onChange={(e) => onScoreChange(c.id, Number(e.target.value))}
                  className="rounded px-1 py-0.5 text-xs font-bold"
                  style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', color: scoreColor(c.recruit_score) }}
                  title={c.recruit_score_manual ? 'Set by hand' : 'Calculated'}
                >
                  {[0, 1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}/6</option>)}
                </select>
              </label>
              <span className="text-[11px]" style={{ color: due ? '#EF4444' : '#888888' }}>Due {formatDate(c.follow_up_due)}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
