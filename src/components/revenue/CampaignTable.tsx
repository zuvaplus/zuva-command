'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { colorFor, CAMPAIGN_STATUS_COLORS } from '@/lib/badgeColors'
import ColorBadge from '@/components/ColorBadge'
import InlineEditCell from './InlineEditCell'
import type { CommandCampaign } from '@/lib/types'

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function ctr(clicks: number, impressions: number): string {
  if (impressions === 0) return '—'
  return `${((clicks / impressions) * 100).toFixed(2)}%`
}

export default function CampaignTable({
  campaigns,
  onUpdated,
  onDeleted,
}: {
  campaigns: CommandCampaign[]
  onUpdated: (campaign: CommandCampaign) => void
  onDeleted: (id: string) => void
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function patch(id: string, field: string, value: unknown) {
    const res = await fetch(`/api/campaigns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    })
    const data = await res.json()
    if (res.ok) onUpdated(data)
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' })
      if (res.ok) onDeleted(id)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid #2A2A2A' }}>
      <table className="w-full text-left text-sm">
        <thead>
          <tr style={{ backgroundColor: '#111111', color: '#888888' }}>
            {['Advertiser', 'Campaign', 'Package', 'Status', 'Start', 'End', 'Budget', 'Impressions', 'Clicks', 'CTR', 'Revenue', ''].map((h) => (
              <th key={h} className="whitespace-nowrap px-4 py-3 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {campaigns.length === 0 && (
            <tr>
              <td colSpan={12} className="px-4 py-6 text-center" style={{ color: '#888888' }}>
                No campaigns yet.
              </td>
            </tr>
          )}
          {campaigns.map((c) => (
            <tr key={c.id} style={{ backgroundColor: '#1A1A1A', borderTop: '1px solid #2A2A2A' }}>
              <td className="px-4 py-3 font-medium text-white">{c.advertiser_name}</td>
              <td className="px-4 py-3" style={{ color: '#F0F0F0' }}>{c.campaign_name}</td>
              <td className="px-4 py-3" style={{ color: '#F0F0F0' }}>{c.package_tier ?? '—'}</td>
              <td className="px-4 py-3">
                <select
                  value={c.status}
                  onChange={(e) => patch(c.id, 'status', e.target.value)}
                  className="rounded-md px-2 py-1 text-xs"
                  style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', color: '#F0F0F0' }}
                >
                  {['Pending', 'Active', 'Paused', 'Completed'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <div className="mt-1"><ColorBadge label={c.status} color={colorFor(CAMPAIGN_STATUS_COLORS, c.status)} /></div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap" style={{ color: '#888888' }}>{formatDate(c.start_date)}</td>
              <td className="px-4 py-3 whitespace-nowrap" style={{ color: '#888888' }}>{formatDate(c.end_date)}</td>
              <td className="px-4 py-3" style={{ color: '#F0F0F0' }}>{c.budget_usd ? `$${Number(c.budget_usd).toLocaleString()}` : '—'}</td>
              <td className="px-4 py-3">
                <InlineEditCell value={c.impressions_delivered} onSave={(v) => patch(c.id, 'impressions_delivered', v)} />
              </td>
              <td className="px-4 py-3">
                <InlineEditCell value={c.clicks} onSave={(v) => patch(c.id, 'clicks', v)} />
              </td>
              <td className="px-4 py-3" style={{ color: '#888888' }}>{ctr(c.clicks, c.impressions_delivered)}</td>
              <td className="px-4 py-3">
                <InlineEditCell value={c.revenue_usd} onSave={(v) => patch(c.id, 'revenue_usd', v)} format={(v) => `$${v.toLocaleString()}`} />
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => handleDelete(c.id)}
                  disabled={deletingId === c.id}
                  className="text-red-500 hover:text-red-400 disabled:opacity-40"
                >
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
