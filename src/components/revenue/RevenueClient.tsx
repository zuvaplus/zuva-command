'use client'

import { useMemo, useState } from 'react'
import CampaignTable from './CampaignTable'
import AddCampaignModal from './AddCampaignModal'
import TierBarChart from './TierBarChart'
import type { CommandCampaign } from '@/lib/types'

const AD_UNIT_FORMATS = [
  'Pre-roll Video',
  'Homepage Masthead',
  'Native In-Feed Sponsored Card',
  'Flares In-Feed Ad',
  'Up Next Native Sponsored (Position 3)',
  'Right Sidebar Display 300×250',
  'In-Video Banner',
  'Halftime Sports Sponsor Slate',
  'Audio Ad (Zuva Music — Q3 2027)',
]

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
      <p className="text-3xl font-extrabold" style={{ color: '#F0F0F0' }}>{value}</p>
      <p className="mt-1 text-sm" style={{ color: '#888888' }}>{label}</p>
    </div>
  )
}

export default function RevenueClient({ initialCampaigns }: { initialCampaigns: CommandCampaign[] }) {
  const [campaigns, setCampaigns] = useState(initialCampaigns)

  const stats = useMemo(() => {
    const earning = campaigns.filter((c) => c.status === 'Active' || c.status === 'Completed')
    const totalRevenue = earning.reduce((sum, c) => sum + Number(c.revenue_usd || 0), 0)
    const activeCampaigns = campaigns.filter((c) => c.status === 'Active').length
    const totalImpressions = campaigns.reduce((sum, c) => sum + (c.impressions_delivered || 0), 0)
    // CPM handles zero impressions explicitly rather than dividing by zero.
    const avgCpm = totalImpressions > 0 ? (totalRevenue / totalImpressions) * 1000 : 0
    return { totalRevenue, activeCampaigns, totalImpressions, avgCpm }
  }, [campaigns])

  function handleUpdated(updated: CommandCampaign) {
    setCampaigns((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
  }

  function handleDeleted(id: string) {
    setCampaigns((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Revenue Dashboard</h1>
          <p className="text-sm" style={{ color: '#888888' }}>Campaign performance and ad revenue.</p>
        </div>
        <AddCampaignModal onCreated={(c) => setCampaigns((prev) => [c, ...prev])} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} />
        <StatCard label="Active Campaigns" value={String(stats.activeCampaigns)} />
        <StatCard label="Total Impressions" value={stats.totalImpressions.toLocaleString()} />
        <StatCard label="Average CPM" value={stats.totalImpressions > 0 ? `$${stats.avgCpm.toFixed(2)}` : '—'} />
      </div>

      <TierBarChart campaigns={campaigns} />

      <div>
        <h2 className="mb-3 text-lg font-bold text-white">Campaigns</h2>
        <CampaignTable campaigns={campaigns} onUpdated={handleUpdated} onDeleted={handleDeleted} />
      </div>

      <div className="rounded-xl p-5" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
        <h2 className="mb-2 text-sm font-bold text-white">Google Ad Manager</h2>
        <p className="mb-4 text-sm" style={{ color: '#888888' }}>
          GAM API integration activates post-launch. Revenue will auto-populate here once GAM network code is configured.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {AD_UNIT_FORMATS.map((format) => (
            <span key={format} className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', color: '#888888' }}>
              {format}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
