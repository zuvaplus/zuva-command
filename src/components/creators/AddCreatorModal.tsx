'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import MarketOptions from '@/components/crm/MarketOptions'
import {
  CONTACT_METHODS,
  CREATOR_PLATFORMS,
  CREATOR_TIERS,
  isBoostCategory,
  parseCount,
  recruitScore,
  validateContactDetail,
} from '@/lib/creators'
import type { CommandCreator } from '@/lib/types'
import { CategoryOptions, CreatorBoostBadge, scoreColor } from './CreatorBadges'

const initialForm = {
  display_name: '',
  primary_platform: 'YouTube',
  profile_url: '',
  followers: '',
  avg_views: '',
  country: '',
  content_category: '',
  primary_language: '',
  audience_diaspora_pct: '',
  pain_signal: false,
  proposed_tier: 'None',
  source: '',
  contact_method: '',
  contact_detail: '',
  notes: '',
}

const inputClass = 'border-[#2A2A2A] bg-[#111111] text-white placeholder:text-[#888888]'
const selectClass = 'w-full rounded-md px-3 py-2 text-sm bg-[#111111] border border-[#2A2A2A] text-[#F0F0F0]'
const labelClass = 'mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#888888]'

export default function AddCreatorModal({ onCreated }: { onCreated: (creator: CommandCreator) => void }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const followers = parseCount(form.followers)
  const diasporaPct = form.audience_diaspora_pct === '' ? null : Number(form.audience_diaspora_pct)
  const previewScore = useMemo(
    () => recruitScore({ followers, audience_diaspora_pct: diasporaPct, pain_signal: form.pain_signal }),
    [followers, diasporaPct, form.pain_signal]
  )
  const contactCheck = validateContactDetail(form.contact_detail)

  function update<K extends keyof typeof initialForm>(key: K, value: (typeof initialForm)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function close() {
    if (submitting) return
    setOpen(false)
    setForm(initialForm)
    setError(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (submitting) return
    if (!contactCheck.ok) {
      setError(contactCheck.error)
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/creators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          followers,
          avg_views: parseCount(form.avg_views),
          audience_diaspora_pct: diasporaPct,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data) throw new Error(data?.error || `Could not add creator (HTTP ${res.status})`)
      onCreated(data)
      setSubmitting(false)
      setOpen(false)
      setForm(initialForm)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add creator')
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="gap-2 font-bold text-black hover:opacity-90" style={{ backgroundColor: '#F37B0D' }}>
        <Plus size={16} />
        Add Creator
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={close}>
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-xl"
        style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-lg font-bold text-white">Add Creator</h2>
          <button type="button" onClick={close} className="text-[#888888] hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6">
          <Input required placeholder="Display name *" value={form.display_name} onChange={(e) => update('display_name', e.target.value)} className={inputClass} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Platform</label>
              <select value={form.primary_platform} onChange={(e) => update('primary_platform', e.target.value)} className={selectClass}>
                {CREATOR_PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Profile URL</label>
              <Input placeholder="https://…" value={form.profile_url} onChange={(e) => update('profile_url', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Followers</label>
              <Input placeholder="e.g. 25k" value={form.followers} onChange={(e) => update('followers', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Avg views</label>
              <Input placeholder="e.g. 4,000" value={form.avg_views} onChange={(e) => update('avg_views', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Country</label>
              <select value={form.country} onChange={(e) => update('country', e.target.value)} className={selectClass}>
                <option value="">—</option>
                <MarketOptions />
              </select>
            </div>
            <div>
              <label className={labelClass}>Category</label>
              <select value={form.content_category} onChange={(e) => update('content_category', e.target.value)} className={selectClass}>
                <option value="">—</option>
                <CategoryOptions />
              </select>
            </div>
            <div>
              <label className={labelClass}>Primary language</label>
              <Input placeholder="e.g. English, Yoruba" value={form.primary_language} onChange={(e) => update('primary_language', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Audience in diaspora (%)</label>
              <Input type="number" min={0} max={100} placeholder="0–100 estimate" value={form.audience_diaspora_pct} onChange={(e) => update('audience_diaspora_pct', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Proposed tier</label>
              <select value={form.proposed_tier} onChange={(e) => update('proposed_tier', e.target.value)} className={selectClass}>
                {CREATOR_TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Source</label>
              <Input placeholder="e.g. TikTok search, referral" value={form.source} onChange={(e) => update('source', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Contact method</label>
              <select value={form.contact_method} onChange={(e) => update('contact_method', e.target.value)} className={selectClass}>
                <option value="">—</option>
                {CONTACT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Contact detail (optional)</label>
              <Input placeholder="Email or +WhatsApp number" value={form.contact_detail} onChange={(e) => update('contact_detail', e.target.value)} className={inputClass} />
            </div>
          </div>
          {!contactCheck.ok && <p className="text-xs text-red-400">{contactCheck.error}</p>}

          <label className="flex items-center gap-2 text-sm" style={{ color: '#F0F0F0' }}>
            <input type="checkbox" checked={form.pain_signal} onChange={(e) => update('pain_signal', e.target.checked)} />
            Pain signal: frustrated with monetization, or not monetised
          </label>

          <Textarea placeholder="Notes" value={form.notes} onChange={(e) => update('notes', e.target.value)} className={inputClass} />

          <div className="flex flex-wrap items-center gap-2 rounded-md px-3 py-2" style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A' }}>
            <span className="text-xs" style={{ color: '#888888' }}>Recruit score:</span>
            <span className="text-sm font-bold" style={{ color: scoreColor(previewScore) }}>{previewScore}/6</span>
            {isBoostCategory(form.content_category) && <CreatorBoostBadge />}
          </div>

          {error && (
            <p className="rounded-md px-3 py-2 text-sm text-red-400" style={{ backgroundColor: '#EF444415', border: '1px solid #EF444455' }}>{error}</p>
          )}
        </div>

        <div className="flex shrink-0 gap-2 px-6 py-4" style={{ borderTop: '1px solid #2A2A2A' }}>
          <Button type="button" onClick={close} disabled={submitting} variant="outline" className="flex-1 border-[#2A2A2A] text-[#F0F0F0] hover:bg-[#111111]">
            Cancel
          </Button>
          <Button type="submit" disabled={submitting} className="flex-1 font-bold text-black hover:opacity-90" style={{ backgroundColor: '#F37B0D' }}>
            {submitting ? 'Saving…' : 'Add Creator'}
          </Button>
        </div>
      </form>
    </div>
  )
}
