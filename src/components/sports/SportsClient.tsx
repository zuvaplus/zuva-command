'use client'

import { useMemo, useState } from 'react'
import EventsTable from './EventsTable'
import AddEventModal from './AddEventModal'
import SchoolTracker from './SchoolTracker'
import KeyContacts from './KeyContacts'
import type { CommandSportsEvent, HubSchoolsConfig } from '@/lib/types'

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
      <p className="text-3xl font-extrabold" style={{ color: '#F0F0F0' }}>{value}</p>
      <p className="mt-1 text-sm" style={{ color: '#888888' }}>{label}</p>
    </div>
  )
}

export default function SportsClient({
  initialEvents,
  initialHubConfig,
  gmailConnected,
}: {
  initialEvents: CommandSportsEvent[]
  initialHubConfig: HubSchoolsConfig
  gmailConnected: boolean
}) {
  const [events, setEvents] = useState(initialEvents)

  const stats = useMemo(() => {
    const now = new Date().toISOString()
    return {
      upcoming: events.filter((e) => e.status === 'Scheduled' && (e.event_date ?? '') >= now).length,
      live: events.filter((e) => e.status === 'Live').length,
      totalStreamed: events.filter((e) => e.status === 'Completed' || e.status === 'Live').length,
      peakViewers: events.reduce((max, e) => Math.max(max, e.viewer_peak || 0), 0),
    }
  }, [events])

  function handleUpdated(updated: CommandSportsEvent) {
    setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
  }

  function handleDeleted(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Zuva Sports</h1>
          <p className="text-sm" style={{ color: '#888888' }}>Zimbabwe school sport broadcast network.</p>
        </div>
        <AddEventModal onCreated={(e) => setEvents((prev) => [e, ...prev])} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Upcoming Events" value={stats.upcoming} />
        <StatCard label="Live Now" value={stats.live} />
        <StatCard label="Total Events Streamed" value={stats.totalStreamed} />
        <StatCard label="Peak Viewers" value={stats.peakViewers} />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-bold text-white">Events</h2>
        <EventsTable events={events} onUpdated={handleUpdated} onDeleted={handleDeleted} />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-bold text-white">ATS / CHISZ School Tracker</h2>
        <SchoolTracker initialConfig={initialHubConfig} />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-bold text-white">Key Contacts</h2>
        <KeyContacts gmailConnected={gmailConnected} />
      </div>
    </div>
  )
}
