'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { INDUSTRY_OPTIONS, MARKET_OPTIONS, SIZE_OPTIONS, STAGE_OPTIONS } from '@/lib/crmOptions'
import { scoreInfo } from '@/lib/badgeColors'
import type { CommandProspect, CommandProspectActivity } from '@/lib/types'

const selectClass = 'w-full rounded-md px-3 py-2 text-sm bg-[#111111] border border-[#2A2A2A] text-[#F0F0F0]'
const fieldLabelClass = 'mb-1 block text-xs font-semibold uppercase tracking-wide'

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function DetailsTab({
  prospect,
  activity,
  onUpdate,
  onDeleted,
}: {
  prospect: CommandProspect
  activity: CommandProspectActivity[]
  onUpdate: (patch: Partial<CommandProspect>) => Promise<void>
  onDeleted: () => void
}) {
  const [local, setLocal] = useState(prospect)
  const [deleting, setDeleting] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  function updateLocal<K extends keyof CommandProspect>(key: K, value: CommandProspect[K]) {
    setLocal((prev) => ({ ...prev, [key]: value }))
  }

  async function commit(patch: Partial<CommandProspect>) {
    await onUpdate(patch)
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/prospects/${prospect.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('delete failed')
      onDeleted()
    } finally {
      setDeleting(false)
    }
  }

  const score = scoreInfo(local.score)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={fieldLabelClass} style={{ color: '#888888' }}>Company</label>
          <Input
            value={local.company}
            onChange={(e) => updateLocal('company', e.target.value)}
            onBlur={() => commit({ company: local.company })}
            className="border-[#2A2A2A] bg-[#111111] text-white"
          />
        </div>
        <div>
          <label className={fieldLabelClass} style={{ color: '#888888' }}>Contact</label>
          <Input
            value={local.contact ?? ''}
            onChange={(e) => updateLocal('contact', e.target.value)}
            onBlur={() => commit({ contact: local.contact })}
            className="border-[#2A2A2A] bg-[#111111] text-white"
          />
        </div>
        <div className="col-span-2">
          <label className={fieldLabelClass} style={{ color: '#888888' }}>Email</label>
          <Input
            type="email"
            value={local.email}
            onChange={(e) => updateLocal('email', e.target.value)}
            onBlur={() => commit({ email: local.email })}
            className="border-[#2A2A2A] bg-[#111111] text-white"
          />
        </div>
        <div>
          <label className={fieldLabelClass} style={{ color: '#888888' }}>Industry</label>
          <select
            value={local.industry ?? ''}
            onChange={(e) => { updateLocal('industry', e.target.value); commit({ industry: e.target.value }) }}
            className={selectClass}
          >
            <option value="">—</option>
            {INDUSTRY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className={fieldLabelClass} style={{ color: '#888888' }}>Market</label>
          <select
            value={local.market ?? ''}
            onChange={(e) => { updateLocal('market', e.target.value); commit({ market: e.target.value }) }}
            className={selectClass}
          >
            <option value="">—</option>
            {MARKET_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className={fieldLabelClass} style={{ color: '#888888' }}>Size</label>
          <select
            value={local.size}
            onChange={(e) => { updateLocal('size', e.target.value); commit({ size: e.target.value }) }}
            className={selectClass}
          >
            {SIZE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className={fieldLabelClass} style={{ color: '#888888' }}>Website</label>
          <Input
            value={local.website ?? ''}
            onChange={(e) => updateLocal('website', e.target.value)}
            onBlur={() => commit({ website: local.website })}
            className="border-[#2A2A2A] bg-[#111111] text-white"
          />
        </div>
      </div>

      <div>
        <label className={fieldLabelClass} style={{ color: '#888888' }}>Notes</label>
        <Textarea
          value={local.notes ?? ''}
          onChange={(e) => updateLocal('notes', e.target.value)}
          onBlur={() => commit({ notes: local.notes })}
          rows={3}
          className="border-[#2A2A2A] bg-[#111111] text-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={fieldLabelClass} style={{ color: '#888888' }}>Pipeline Stage</label>
          <select
            value={local.stage}
            onChange={(e) => { updateLocal('stage', e.target.value); commit({ stage: e.target.value }) }}
            className={selectClass}
          >
            {STAGE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className={fieldLabelClass} style={{ color: '#888888' }}>Follow-Up Due</label>
          <Input
            type="date"
            value={local.follow_up_due ?? ''}
            onChange={(e) => { updateLocal('follow_up_due', e.target.value); commit({ follow_up_due: e.target.value }) }}
            className="border-[#2A2A2A] bg-[#111111] text-white"
          />
        </div>
      </div>

      <div>
        <label className={fieldLabelClass} style={{ color: '#888888' }}>Score</label>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => {
            const info = scoreInfo(n)
            const active = local.score === n
            return (
              <button
                key={n}
                onClick={() => { updateLocal('score', n); commit({ score: n }) }}
                className="flex-1 rounded-md py-2 text-xs font-bold transition-all"
                style={
                  active
                    ? { backgroundColor: info.color, color: '#000000' }
                    : { backgroundColor: '#111111', color: '#888888', border: '1px solid #2A2A2A' }
                }
              >
                {n}
              </button>
            )
          })}
        </div>
        <p className="mt-1 text-xs font-semibold" style={{ color: score.color }}>{score.label}</p>
      </div>

      <div>
        <p className={fieldLabelClass} style={{ color: '#888888' }}>Activity</p>
        {activity.length === 0 ? (
          <p className="text-xs" style={{ color: '#888888' }}>No activity yet.</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {activity.map((a) => (
              <div key={a.id} className="rounded-md px-3 py-2 text-xs" style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A' }}>
                <p style={{ color: '#F0F0F0' }}>{a.description}</p>
                <p className="mt-0.5" style={{ color: '#888888' }}>{timeAgo(a.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmingDelete ? (
        <div className="flex items-center gap-2">
          <p className="flex-1 text-xs text-red-400">Delete this prospect permanently?</p>
          <Button onClick={handleDelete} disabled={deleting} size="sm" variant="destructive">
            {deleting ? 'Deleting…' : 'Confirm Delete'}
          </Button>
          <Button onClick={() => setConfirmingDelete(false)} size="sm" variant="outline" className="border-[#2A2A2A] text-[#F0F0F0]">
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          onClick={() => setConfirmingDelete(true)}
          variant="outline"
          size="sm"
          className="gap-2 border-red-900 text-red-400 hover:bg-red-950"
        >
          <Trash2 size={14} />
          Delete Prospect
        </Button>
      )}
    </div>
  )
}
