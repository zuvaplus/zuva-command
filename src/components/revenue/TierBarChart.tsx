import type { CommandCampaign } from '@/lib/types'

const TIERS = ['Spark', 'Rise', 'Amplify', 'Impact', 'Brand', 'Custom']

export default function TierBarChart({ campaigns }: { campaigns: CommandCampaign[] }) {
  const byTier = TIERS.map((tier) => {
    const rows = campaigns.filter((c) => c.package_tier === tier)
    return {
      tier,
      revenue: rows.reduce((sum, c) => sum + Number(c.revenue_usd || 0), 0),
      count: rows.length,
    }
  })
  const maxRevenue = Math.max(1, ...byTier.map((t) => t.revenue))

  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
      <h2 className="mb-4 text-sm font-bold text-white">Revenue by Package Tier</h2>
      <div className="space-y-3">
        {byTier.map(({ tier, revenue, count }) => (
          <div key={tier} className="flex items-center gap-3">
            <span className="w-16 shrink-0 text-xs" style={{ color: '#888888' }}>{tier}</span>
            <div className="h-5 flex-1 overflow-hidden rounded" style={{ backgroundColor: '#111111' }}>
              <div
                className="h-full rounded transition-all"
                style={{ width: `${(revenue / maxRevenue) * 100}%`, backgroundColor: '#F37B0D', minWidth: revenue > 0 ? '4px' : '0' }}
              />
            </div>
            <span className="w-28 shrink-0 text-right text-xs" style={{ color: '#F0F0F0' }}>
              ${revenue.toLocaleString()} · {count}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
