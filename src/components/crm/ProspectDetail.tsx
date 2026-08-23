'use client'

import { useEffect, useState, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import DetailsTab from './DetailsTab'
import EmailComposer from './EmailComposer'
import type { CommandProspect, CommandProspectActivity, CommandEmail } from '@/lib/types'

type Tab = 'details' | 'compose'

export default function ProspectDetail({
  prospectId,
  gmailConnected,
  onChanged,
  onDeleted,
}: {
  prospectId: string
  gmailConnected: boolean
  onChanged: (prospect: CommandProspect) => void
  onDeleted: () => void
}) {
  const [tab, setTab] = useState<Tab>('details')
  const [prospect, setProspect] = useState<CommandProspect | null>(null)
  const [activity, setActivity] = useState<CommandProspectActivity[]>([])
  const [, setEmails] = useState<CommandEmail[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/prospects/${prospectId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not load prospect')
      setProspect(data.prospect)
      setActivity(data.activity ?? [])
      setEmails(data.emails ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load prospect')
    } finally {
      setLoading(false)
    }
  }, [prospectId])

  useEffect(() => {
    load()
  }, [load])

  async function handleUpdate(patch: Partial<CommandProspect>) {
    const res = await fetch(`/api/prospects/${prospectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const data = await res.json()
    if (res.ok) {
      setProspect(data)
      onChanged(data)
      load() // refresh activity log to reflect the change
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={20} className="animate-spin" style={{ color: '#888888' }} />
      </div>
    )
  }

  if (error || !prospect) {
    return <p className="p-6 text-sm text-red-500">{error ?? 'Prospect not found'}</p>
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-6 pt-5" style={{ borderColor: '#2A2A2A' }}>
        <h2 className="text-lg font-bold text-white">{prospect.company}</h2>
        <p className="mb-4 text-sm" style={{ color: '#888888' }}>{prospect.contact ?? prospect.email}</p>
        <div className="flex gap-1">
          {(['details', 'compose'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="rounded-t-md px-4 py-2 text-sm font-semibold transition-colors"
              style={
                tab === t
                  ? { backgroundColor: '#1A1A1A', color: '#F37B0D', borderBottom: '2px solid #F37B0D' }
                  : { color: '#888888' }
              }
            >
              {t === 'details' ? 'Details & Pipeline' : 'AI Email Composer'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {tab === 'details' ? (
          <DetailsTab prospect={prospect} activity={activity} onUpdate={handleUpdate} onDeleted={onDeleted} />
        ) : (
          <EmailComposer
            prospectId={prospect.id}
            prospectData={prospect}
            gmailConnected={gmailConnected}
            onSent={load}
          />
        )}
      </div>
    </div>
  )
}
