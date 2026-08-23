'use client'

import { useState } from 'react'
import type { HubSchoolsConfig, HubSchoolStatus } from '@/lib/types'

const HUBS: { hub: string; school: string; city: string }[] = [
  { hub: 'Harare North', school: "St. John's College", city: 'Harare' },
  { hub: 'Harare South', school: 'Prince Edward School', city: 'Harare' },
  { hub: 'Bulawayo', school: 'Colet House (CBC)', city: 'Bulawayo' },
  { hub: 'Marondera', school: 'Peterhouse', city: 'Marondera' },
  { hub: 'Floating', school: 'Tournament venues', city: 'Various' },
]

const CAMERA_OPTIONS = ['Not Deployed', 'Ordered', 'Deployed', 'Active']
const AV_CLUB_OPTIONS = ['Not Started', 'In Progress', 'Active']
const CONTACT_OPTIONS = ['Not Contacted', 'Email Sent', 'Meeting Booked', 'Confirmed']

const DEFAULT_STATUS: HubSchoolStatus = { camera: 'Not Deployed', avClub: 'Not Started', contact: 'Not Contacted' }

const selectClass = 'rounded-md px-2 py-1 text-xs bg-[#111111] border border-[#2A2A2A] text-[#F0F0F0]'

export default function SchoolTracker({ initialConfig }: { initialConfig: HubSchoolsConfig }) {
  const [config, setConfig] = useState<HubSchoolsConfig>(initialConfig)
  const [saving, setSaving] = useState<string | null>(null)

  async function update(hub: string, field: keyof HubSchoolStatus, value: string) {
    const next: HubSchoolsConfig = {
      ...config,
      [hub]: { ...(config[hub] ?? DEFAULT_STATUS), [field]: value },
    }
    setConfig(next)
    setSaving(hub)
    try {
      await fetch('/api/sports/hub-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: next }),
      })
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid #2A2A2A' }}>
      <table className="w-full text-left text-sm">
        <thead>
          <tr style={{ backgroundColor: '#111111', color: '#888888' }}>
            {['Hub', 'School', 'City', 'Camera Status', 'AV Club Status', 'Contact Status'].map((h) => (
              <th key={h} className="whitespace-nowrap px-4 py-3 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HUBS.map(({ hub, school, city }) => {
            const status = config[hub] ?? DEFAULT_STATUS
            return (
              <tr key={hub} style={{ backgroundColor: '#1A1A1A', borderTop: '1px solid #2A2A2A', opacity: saving === hub ? 0.6 : 1 }}>
                <td className="px-4 py-3 font-medium text-white">{hub}</td>
                <td className="px-4 py-3" style={{ color: '#F0F0F0' }}>{school}</td>
                <td className="px-4 py-3" style={{ color: '#888888' }}>{city}</td>
                <td className="px-4 py-3">
                  <select value={status.camera} onChange={(e) => update(hub, 'camera', e.target.value)} className={selectClass}>
                    {CAMERA_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select value={status.avClub} onChange={(e) => update(hub, 'avClub', e.target.value)} className={selectClass}>
                    {AV_CLUB_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select value={status.contact} onChange={(e) => update(hub, 'contact', e.target.value)} className={selectClass}>
                    {CONTACT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
