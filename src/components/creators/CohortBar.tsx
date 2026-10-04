import { FOUNDING_COHORT_TARGETS, FOUNDING_COHORT_TOTAL, SIGNED_CREATOR_STAGES, TIER_COLORS } from '@/lib/creators'
import type { CommandCreator } from '@/lib/types'

// Founding cohort progress: signed (or onboarded) creators per tier against
// FOUNDING_COHORT_TARGETS. Signed creators with no tier are shown
// separately so they get assigned one.
export default function CohortBar({ creators }: { creators: CommandCreator[] }) {
  const signed = creators.filter((c) => SIGNED_CREATOR_STAGES.includes(c.stage))
  const count = (tier: string) => signed.filter((c) => c.proposed_tier === tier).length
  const tiers = Object.entries(FOUNDING_COHORT_TARGETS) as [string, number][]
  const total = tiers.reduce((sum, [tier]) => sum + count(tier), 0)
  const untiered = count('None')

  return (
    <div className="rounded-lg px-4 py-3" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-bold text-white">
          Founding Cohort: <span style={{ color: '#F37B0D' }}>{total}</span>
          <span style={{ color: '#888888' }}> of {FOUNDING_COHORT_TOTAL} signed</span>
        </p>
        {untiered > 0 && (
          <p className="text-xs" style={{ color: '#EAB308' }}>
            {untiered} signed {untiered === 1 ? 'creator has' : 'creators have'} no tier yet
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {tiers.map(([tier, target]) => {
          const n = count(tier)
          const pct = Math.min(100, (n / target) * 100)
          return (
            <div key={tier}>
              <div className="mb-1 flex justify-between text-xs">
                <span style={{ color: TIER_COLORS[tier] }}>{tier}</span>
                <span style={{ color: n >= target ? '#22C55E' : '#888888' }}>{n} / {target}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: '#111111' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: TIER_COLORS[tier] }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
