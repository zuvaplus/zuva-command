'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { INDUSTRY_OPTIONS, MARKET_OPTIONS, SIZE_OPTIONS } from '@/lib/crmOptions'
import { qualifyLead } from '@/lib/qualifyLead'
import { scoreInfo } from '@/lib/badgeColors'
import type { CommandProspect } from '@/lib/types'

const initialForm = {
  company: '',
  contact: '',
  email: '',
  industry: INDUSTRY_OPTIONS[0],
  market: MARKET_OPTIONS[0],
  size: SIZE_OPTIONS[0],
  website: '',
  notes: '',
}

const selectClass =
  'w-full rounded-md px-3 py-2 text-sm bg-[#111111] border border-[#2A2A2A] text-[#F0F0F0]'

export default function AddProspectModal({ onCreated }: { onCreated: (prospect: CommandProspect) => void }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const previewScore = useMemo(
    () => qualifyLead(form.industry, form.market, form.size),
    [form.industry, form.market, form.size]
  )
  const preview = scoreInfo(previewScore)

  function update<K extends keyof typeof initialForm>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function close() {
    setOpen(false)
    setForm(initialForm)
    setError(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          contact: form.contact || null,
          website: form.website || null,
          notes: form.notes || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not create prospect')
      onCreated(data)
      close()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create prospect')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="gap-2 font-bold text-black hover:opacity-90" style={{ backgroundColor: '#F37B0D' }}>
        <Plus size={16} />
        Add Prospect
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={close}>
      <div
        className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-xl p-6"
        style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Add Prospect</h2>
          <button onClick={close} className="text-[#888888] hover:text-white">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            required
            placeholder="Company *"
            value={form.company}
            onChange={(e) => update('company', e.target.value)}
            className="border-[#2A2A2A] bg-[#111111] text-white placeholder:text-[#888888]"
          />
          <Input
            placeholder="Contact name"
            value={form.contact}
            onChange={(e) => update('contact', e.target.value)}
            className="border-[#2A2A2A] bg-[#111111] text-white placeholder:text-[#888888]"
          />
          <Input
            required
            type="email"
            placeholder="Email *"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            className="border-[#2A2A2A] bg-[#111111] text-white placeholder:text-[#888888]"
          />
          <select value={form.industry} onChange={(e) => update('industry', e.target.value)} className={selectClass}>
            {INDUSTRY_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          <select value={form.market} onChange={(e) => update('market', e.target.value)} className={selectClass}>
            {MARKET_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          <select value={form.size} onChange={(e) => update('size', e.target.value)} className={selectClass}>
            {SIZE_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          <Input
            placeholder="Website"
            value={form.website}
            onChange={(e) => update('website', e.target.value)}
            className="border-[#2A2A2A] bg-[#111111] text-white placeholder:text-[#888888]"
          />
          <Textarea
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
            className="border-[#2A2A2A] bg-[#111111] text-white placeholder:text-[#888888]"
          />

          <div className="flex items-center gap-2 rounded-md px-3 py-2" style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A' }}>
            <span className="text-xs" style={{ color: '#888888' }}>Auto-qualified score:</span>
            <span className="text-sm font-bold" style={{ color: preview.color }}>
              {previewScore}/5 — {preview.label}
            </span>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" disabled={submitting} className="w-full font-bold text-black hover:opacity-90" style={{ backgroundColor: '#F37B0D' }}>
            {submitting ? 'Saving…' : 'Add & Auto-Qualify'}
          </Button>
        </form>
      </div>
    </div>
  )
}
