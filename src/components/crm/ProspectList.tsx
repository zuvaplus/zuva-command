'use client'

import { colorFor, STAGE_COLORS, scoreInfo } from '@/lib/badgeColors'
import ColorBadge from '@/components/ColorBadge'
import type { CommandProspect } from '@/lib/types'

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false
  return dueDate <= new Date().toISOString().slice(0, 10)
}

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function ProspectList({
  prospects,
  selectedId,
  onSelect,
}: {
  prospects: CommandProspect[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const sorted = [...prospects].sort((a, b) => {
    const aOverdue = isOverdue(a.follow_up_due)
    const bOverdue = isOverdue(b.follow_up_due)
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1
    return b.score - a.score
  })

  if (sorted.length === 0) {
    return <p className="p-6 text-sm" style={{ color: '#888888' }}>No prospects match these filters.</p>
  }

  return (
    <div className="divide-y" style={{ borderColor: '#2A2A2A' }}>
      {sorted.map((p) => {
        const overdue = isOverdue(p.follow_up_due)
        const score = scoreInfo(p.score)
        const selected = p.id === selectedId
        return (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors"
            style={{
              backgroundColor: selected ? '#1A1A1A' : 'transparent',
              borderLeft: overdue ? '3px solid #EF4444' : '3px solid transparent',
            }}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{p.company}</p>
              <p className="truncate text-xs" style={{ color: '#888888' }}>{p.contact || p.email}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {p.industry && <ColorBadge label={p.industry} color="#3B82F6" />}
                {p.market && <span className="text-xs" style={{ color: '#888888' }}>{p.market}</span>}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <ColorBadge label={p.stage} color={colorFor(STAGE_COLORS, p.stage)} />
              <span className="text-xs font-bold" style={{ color: score.color }}>{p.score}/5 {score.label}</span>
              <span className="text-[11px]" style={{ color: '#888888' }}>{p.emails_sent} sent</span>
              <span className="text-[11px]" style={{ color: overdue ? '#EF4444' : '#888888' }}>
                Due {formatDate(p.follow_up_due)}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
