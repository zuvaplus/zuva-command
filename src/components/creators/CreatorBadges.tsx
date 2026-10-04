import { Sparkles } from 'lucide-react'
import ColorBadge from '@/components/ColorBadge'
import { CONTENT_CATEGORIES, CREATOR_STAGE_COLORS, TIER_COLORS } from '@/lib/creators'

export function CreatorBoostBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: '#F37B0D22', color: '#F37B0D' }}
      title="Protected category: eligible for Creator Boost"
    >
      <Sparkles size={11} />
      Creator Boost
    </span>
  )
}

export function StageBadge({ stage }: { stage: string }) {
  return <ColorBadge label={stage} color={CREATOR_STAGE_COLORS[stage] ?? '#888888'} />
}

export function TierBadge({ tier }: { tier: string }) {
  if (tier === 'None') return null
  return <ColorBadge label={tier} color={TIER_COLORS[tier] ?? '#888888'} />
}

// Score colour ramps with the 0–6 recruit score.
export function scoreColor(score: number): string {
  if (score >= 5) return '#22C55E'
  if (score >= 3) return '#EAB308'
  if (score >= 1) return '#888888'
  return '#555555'
}

export function CategoryOptions() {
  return (
    <>
      {CONTENT_CATEGORIES.map((c) => (
        <option key={c.value} value={c.value}>{c.label}</option>
      ))}
    </>
  )
}
