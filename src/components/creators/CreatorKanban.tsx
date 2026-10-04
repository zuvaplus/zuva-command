'use client'

import { CREATOR_STAGES, CREATOR_STAGE_COLORS, formatCount, isBoostCategory } from '@/lib/creators'
import type { CommandCreator } from '@/lib/types'
import { CreatorBoostBadge, scoreColor } from './CreatorBadges'

export default function CreatorKanban({
  creators,
  onSelect,
  onStageChange,
}: {
  creators: CommandCreator[]
  onSelect: (id: string) => void
  onStageChange: (id: string, stage: string) => void
}) {
  return (
    <div className="flex flex-1 gap-3 overflow-x-auto p-4">
      {CREATOR_STAGES.map((stage) => {
        const cards = creators.filter((c) => c.stage === stage)
        return (
          <div key={stage} className="flex w-56 shrink-0 flex-col rounded-lg" style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A' }}>
            <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: `2px solid ${CREATOR_STAGE_COLORS[stage]}` }}>
              <span className="text-xs font-bold text-white">{stage}</span>
              <span className="text-xs" style={{ color: '#888888' }}>{cards.length}</span>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-2">
              {cards.map((c) => (
                <div
                  key={c.id}
                  onClick={() => onSelect(c.id)}
                  className="cursor-pointer rounded-md p-2.5"
                  style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}
                >
                  <p className="truncate text-xs font-semibold text-white">{c.display_name}</p>
                  <p className="truncate text-[11px]" style={{ color: '#888888' }}>
                    {c.primary_platform} · {formatCount(c.followers)}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-[11px] font-bold" style={{ color: scoreColor(c.recruit_score) }}>{c.recruit_score}/6</span>
                    {isBoostCategory(c.content_category) && <CreatorBoostBadge />}
                  </div>
                  <select
                    value={c.stage}
                    onChange={(e) => { e.stopPropagation(); onStageChange(c.id, e.target.value) }}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1.5 w-full rounded px-1.5 py-1 text-[11px]"
                    style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', color: '#F0F0F0' }}
                  >
                    {CREATOR_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
