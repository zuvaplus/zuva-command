'use client'

import { colorFor, STAGE_COLORS, scoreInfo } from '@/lib/badgeColors'
import { STAGE_OPTIONS } from '@/lib/crmOptions'
import type { CommandProspect } from '@/lib/types'

export default function PipelineKanban({
  prospects,
  onSelect,
  onStageChange,
}: {
  prospects: CommandProspect[]
  onSelect: (id: string) => void
  onStageChange: (id: string, stage: string) => void
}) {
  return (
    <div className="grid h-full grid-cols-6 gap-3 overflow-x-auto p-4">
      {STAGE_OPTIONS.map((stage) => {
        const cards = prospects.filter((p) => p.stage === stage)
        return (
          <div key={stage} className="flex min-w-[180px] flex-col rounded-lg" style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A' }}>
            <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid #2A2A2A' }}>
              <span className="text-xs font-bold" style={{ color: colorFor(STAGE_COLORS, stage) }}>{stage}</span>
              <span className="text-xs" style={{ color: '#888888' }}>{cards.length}</span>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-2">
              {cards.map((p) => {
                const score = scoreInfo(p.score)
                return (
                  <div
                    key={p.id}
                    onClick={() => onSelect(p.id)}
                    className="cursor-pointer rounded-md p-2.5"
                    style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}
                  >
                    <p className="truncate text-xs font-semibold text-white">{p.company}</p>
                    <p className="truncate text-[11px]" style={{ color: '#888888' }}>{p.market ?? '—'}</p>
                    <p className="text-[11px] font-bold" style={{ color: score.color }}>{p.score}/5</p>
                    <select
                      value={p.stage}
                      onChange={(e) => { e.stopPropagation(); onStageChange(p.id, e.target.value) }}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1.5 w-full rounded px-1.5 py-1 text-[11px]"
                      style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', color: '#F0F0F0' }}
                    >
                      {STAGE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
