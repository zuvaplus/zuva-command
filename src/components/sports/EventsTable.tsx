'use client'

import { useState } from 'react'
import { Eye, EyeOff, Radio, Square, Trash2 } from 'lucide-react'
import { colorFor, SPORTS_STATUS_COLORS } from '@/lib/badgeColors'
import ColorBadge from '@/components/ColorBadge'
import type { CommandSportsEvent } from '@/lib/types'

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function StreamKeyCell({ value }: { value: string | null }) {
  const [revealed, setRevealed] = useState(false)
  if (!value) return <span style={{ color: '#888888' }}>—</span>
  return (
    <button onClick={() => setRevealed((v) => !v)} className="flex items-center gap-1.5 font-mono text-xs" style={{ color: '#888888' }}>
      {revealed ? value : '•'.repeat(16)}
      {revealed ? <EyeOff size={12} /> : <Eye size={12} />}
    </button>
  )
}

export default function EventsTable({
  events,
  onUpdated,
  onDeleted,
}: {
  events: CommandSportsEvent[]
  onUpdated: (event: CommandSportsEvent) => void
  onDeleted: (id: string) => void
}) {
  const [busyId, setBusyId] = useState<string | null>(null)

  async function updateStatus(id: string, status: string) {
    setBusyId(id)
    try {
      const res = await fetch(`/api/sports/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (res.ok) onUpdated(data)
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id)
    try {
      const res = await fetch(`/api/sports/events/${id}`, { method: 'DELETE' })
      if (res.ok) onDeleted(id)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid #2A2A2A' }}>
      <table className="w-full text-left text-sm">
        <thead>
          <tr style={{ backgroundColor: '#111111', color: '#888888' }}>
            {['Event', 'School/Team', 'Sport', 'Venue', 'Date', 'Status', 'Peak Viewers', 'Stream Key', ''].map((h) => (
              <th key={h} className="whitespace-nowrap px-4 py-3 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {events.length === 0 && (
            <tr><td colSpan={9} className="px-4 py-6 text-center" style={{ color: '#888888' }}>No events yet.</td></tr>
          )}
          {events.map((e) => (
            <tr key={e.id} style={{ backgroundColor: '#1A1A1A', borderTop: '1px solid #2A2A2A' }}>
              <td className="px-4 py-3 font-medium text-white">{e.event_name}</td>
              <td className="px-4 py-3" style={{ color: '#F0F0F0' }}>{e.school_or_team ?? '—'}</td>
              <td className="px-4 py-3" style={{ color: '#F0F0F0' }}>{e.sport ?? '—'}</td>
              <td className="px-4 py-3" style={{ color: '#888888' }}>{e.venue ?? '—'}</td>
              <td className="px-4 py-3 whitespace-nowrap" style={{ color: '#888888' }}>{formatDate(e.event_date)}</td>
              <td className="px-4 py-3">
                <span className="flex items-center gap-1.5">
                  {e.status === 'Live' && <span className="h-2 w-2 animate-pulse rounded-full" style={{ backgroundColor: '#22C55E' }} />}
                  <ColorBadge label={e.status} color={colorFor(SPORTS_STATUS_COLORS, e.status)} />
                </span>
              </td>
              <td className="px-4 py-3" style={{ color: '#F0F0F0' }}>{e.viewer_peak.toLocaleString()}</td>
              <td className="px-4 py-3"><StreamKeyCell value={e.cloudflare_stream_key} /></td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {e.status === 'Scheduled' && (
                    <button onClick={() => updateStatus(e.id, 'Live')} disabled={busyId === e.id} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold" style={{ backgroundColor: '#22C55E22', color: '#22C55E' }}>
                      <Radio size={12} /> Go Live
                    </button>
                  )}
                  {e.status === 'Live' && (
                    <button onClick={() => updateStatus(e.id, 'Completed')} disabled={busyId === e.id} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold" style={{ backgroundColor: '#88888822', color: '#888888' }}>
                      <Square size={12} /> End Stream
                    </button>
                  )}
                  <button onClick={() => handleDelete(e.id)} disabled={busyId === e.id} className="text-red-500 hover:text-red-400 disabled:opacity-40">
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
