'use client'

import { useState } from 'react'
import { RotateCcw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import MarketOptions from '@/components/crm/MarketOptions'
import {
  CONTACT_METHODS,
  CREATOR_PLATFORMS,
  CREATOR_STAGES,
  CREATOR_TIERS,
  audienceBand,
  diasporaBand,
  parseCount,
  recruitScore,
} from '@/lib/creators'
import type { CommandCreator, CommandCreatorActivity } from '@/lib/types'
import { CategoryOptions, scoreColor } from './CreatorBadges'

const selectClass = 'w-full rounded-md px-3 py-2 text-sm bg-[#111111] border border-[#2A2A2A] text-[#F0F0F0]'
const inputClass = 'border-[#2A2A2A] bg-[#111111] text-white'
const labelClass = 'mb-1 block text-xs font-semibold uppercase tracking-wide'

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

type Patch = Record<string, unknown>

export default function CreatorDetailsTab({
  creator,
  activity,
  onUpdate,
  onDeleted,
}: {
  creator: CommandCreator
  activity: CommandCreatorActivity[]
  onUpdate: (patch: Patch) => Promise<string | null>
  onDeleted: () => void
}) {
  // Text inputs are edited locally and saved on blur; selects save on change.
  const [draft, setDraft] = useState({
    display_name: creator.display_name,
    profile_url: creator.profile_url ?? '',
    followers: creator.followers?.toString() ?? '',
    avg_views: creator.avg_views?.toString() ?? '',
    primary_language: creator.primary_language ?? '',
    audience_diaspora_pct: creator.audience_diaspora_pct?.toString() ?? '',
    source: creator.source ?? '',
    contact_detail: creator.contact_detail ?? '',
    zuva_user_id: creator.zuva_user_id ?? '',
    notes: creator.notes ?? '',
  })
  const [error, setError] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function save(patch: Patch) {
    setError(await onUpdate(patch))
  }

  function text(key: keyof typeof draft, label: string, opts: { placeholder?: string; toValue?: (v: string) => unknown } = {}) {
    return (
      <div>
        <label className={labelClass} style={{ color: '#888888' }}>{label}</label>
        <Input
          value={draft[key]}
          placeholder={opts.placeholder}
          onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
          onBlur={() => save({ [key]: opts.toValue ? opts.toValue(draft[key]) : draft[key] })}
          className={inputClass}
        />
      </div>
    )
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/creators/${creator.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Could not delete creator')
      onDeleted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete creator')
      setDeleting(false)
    }
  }

  const formulaScore = recruitScore(creator)

  return (
    <div className="space-y-5">
      {error && (
        <p className="rounded-md px-3 py-2 text-sm text-red-400" style={{ backgroundColor: '#EF444415', border: '1px solid #EF444455' }}>{error}</p>
      )}

      <div>
        <label className={labelClass} style={{ color: '#888888' }}>Recruit score</label>
        <div className="flex gap-1.5">
          {[0, 1, 2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              onClick={() => save({ recruit_score: n })}
              className="flex-1 rounded-md py-2 text-xs font-bold transition-all"
              style={
                creator.recruit_score === n
                  ? { backgroundColor: scoreColor(n), color: '#000000' }
                  : { backgroundColor: '#111111', color: '#888888', border: '1px solid #2A2A2A' }
              }
            >
              {n}
            </button>
          ))}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs" style={{ color: '#888888' }}>
          <span>
            Formula: audience {audienceBand(creator.followers)} + diaspora {diasporaBand(creator.audience_diaspora_pct)} + pain {creator.pain_signal ? 1 : 0} = {formulaScore}
          </span>
          {creator.recruit_score_manual && (
            <button onClick={() => save({ recalculate: true })} className="flex items-center gap-1 font-semibold hover:underline" style={{ color: '#F37B0D' }}>
              <RotateCcw size={11} /> Set by hand. Reset to {formulaScore}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {text('display_name', 'Display name')}
        <div>
          <label className={labelClass} style={{ color: '#888888' }}>Platform</label>
          <select value={creator.primary_platform} onChange={(e) => save({ primary_platform: e.target.value })} className={selectClass}>
            {CREATOR_PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="col-span-2">{text('profile_url', 'Profile URL', { placeholder: 'https://…' })}</div>
        {text('followers', 'Followers', { placeholder: 'e.g. 25k', toValue: parseCount })}
        {text('avg_views', 'Avg views', { toValue: parseCount })}
        <div>
          <label className={labelClass} style={{ color: '#888888' }}>Country</label>
          <select value={creator.country ?? ''} onChange={(e) => save({ country: e.target.value || null })} className={selectClass}>
            <option value="">—</option>
            <MarketOptions current={creator.country} />
          </select>
        </div>
        <div>
          <label className={labelClass} style={{ color: '#888888' }}>Category</label>
          <select value={creator.content_category ?? ''} onChange={(e) => save({ content_category: e.target.value || null })} className={selectClass}>
            <option value="">—</option>
            <CategoryOptions />
          </select>
        </div>
        {text('primary_language', 'Primary language')}
        {text('audience_diaspora_pct', 'Diaspora audience %', { placeholder: '0–100', toValue: (v) => (v === '' ? null : Number(v)) })}
        <div className="col-span-2">
          <label className="flex items-center gap-2 text-sm" style={{ color: '#F0F0F0' }}>
            <input type="checkbox" checked={creator.pain_signal} onChange={(e) => save({ pain_signal: e.target.checked })} />
            Pain signal: frustrated with monetization, or not monetised
          </label>
        </div>
        <div>
          <label className={labelClass} style={{ color: '#888888' }}>Stage</label>
          <select value={creator.stage} onChange={(e) => save({ stage: e.target.value })} className={selectClass}>
            {CREATOR_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass} style={{ color: '#888888' }}>Proposed tier</label>
          <select value={creator.proposed_tier} onChange={(e) => save({ proposed_tier: e.target.value })} className={selectClass}>
            {CREATOR_TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass} style={{ color: '#888888' }}>Contact method</label>
          <select value={creator.contact_method ?? ''} onChange={(e) => save({ contact_method: e.target.value || null })} className={selectClass}>
            <option value="">—</option>
            {CONTACT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        {text('contact_detail', 'Contact detail', { placeholder: 'Email or +WhatsApp number' })}
        {text('source', 'Source')}
        <div className="col-span-2">
          {text('zuva_user_id', 'Zuva platform user ID', { placeholder: 'Link once onboarded: their users.id UUID' })}
        </div>
        <div>
          <label className={labelClass} style={{ color: '#888888' }}>Follow-up due</label>
          <Input type="date" value={creator.follow_up_due ?? ''} onChange={(e) => save({ follow_up_due: e.target.value || null })} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} style={{ color: '#888888' }}>Last contact</label>
          <Input type="date" value={creator.last_contact ?? ''} onChange={(e) => save({ last_contact: e.target.value || null })} className={inputClass} />
        </div>
      </div>
      <p className="text-[11px]" style={{ color: '#888888' }}>
        Contact detail is for an email address or WhatsApp number only. Never store bank or payment details here.
      </p>

      <div>
        <label className={labelClass} style={{ color: '#888888' }}>Notes</label>
        <Textarea
          value={draft.notes}
          onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
          onBlur={() => save({ notes: draft.notes })}
          rows={3}
          className={inputClass}
        />
      </div>

      <div>
        <p className={labelClass} style={{ color: '#888888' }}>Activity</p>
        {activity.length === 0 ? (
          <p className="text-xs" style={{ color: '#888888' }}>No activity yet.</p>
        ) : (
          <div className="max-h-56 space-y-2 overflow-y-auto">
            {activity.map((a) => (
              <div key={a.id} className="rounded-md px-3 py-2 text-xs" style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A' }}>
                <p style={{ color: '#F0F0F0' }}>{a.description}</p>
                {typeof a.metadata?.message === 'string' && (
                  <p className="mt-1 whitespace-pre-wrap italic" style={{ color: '#888888' }}>&ldquo;{a.metadata.message}&rdquo;</p>
                )}
                <p className="mt-0.5" style={{ color: '#888888' }}>{timeAgo(a.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmingDelete ? (
        <div className="flex items-center gap-2">
          <p className="flex-1 text-xs text-red-400">Delete this creator permanently?</p>
          <Button onClick={handleDelete} disabled={deleting} size="sm" variant="destructive">
            {deleting ? 'Deleting…' : 'Confirm Delete'}
          </Button>
          <Button onClick={() => setConfirmingDelete(false)} size="sm" variant="outline" className="border-[#2A2A2A] text-[#F0F0F0]">
            Cancel
          </Button>
        </div>
      ) : (
        <Button onClick={() => setConfirmingDelete(true)} variant="outline" size="sm" className="gap-2 border-red-900 text-red-400 hover:bg-red-950">
          <Trash2 size={14} />
          Delete Creator
        </Button>
      )}
    </div>
  )
}
