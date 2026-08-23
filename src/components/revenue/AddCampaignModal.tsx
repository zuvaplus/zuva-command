'use client'

import { useState, type FormEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { CommandCampaign } from '@/lib/types'

const PACKAGE_TIER_OPTIONS = [
  { value: 'Spark', label: 'Spark $19/mo' },
  { value: 'Rise', label: 'Rise $49/mo' },
  { value: 'Amplify', label: 'Amplify $199/mo' },
  { value: 'Impact', label: 'Impact $599/mo' },
  { value: 'Brand', label: 'Brand $1500/mo' },
  { value: 'Custom', label: 'Custom' },
]

const STATUS_OPTIONS = ['Pending', 'Active', 'Paused', 'Completed']

const selectClass = 'w-full rounded-md px-3 py-2 text-sm bg-[#111111] border border-[#2A2A2A] text-[#F0F0F0]'

const initialForm = {
  advertiser_name: '',
  campaign_name: '',
  package_tier: PACKAGE_TIER_OPTIONS[0].value,
  status: 'Pending',
  start_date: '',
  end_date: '',
  budget_usd: '',
  notes: '',
}

export default function AddCampaignModal({ onCreated }: { onCreated: (campaign: CommandCampaign) => void }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          start_date: form.start_date || null,
          end_date: form.end_date || null,
          budget_usd: form.budget_usd ? Number(form.budget_usd) : null,
          notes: form.notes || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not create campaign')
      onCreated(data)
      close()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create campaign')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="gap-2 font-bold text-black hover:opacity-90" style={{ backgroundColor: '#F37B0D' }}>
        <Plus size={16} />
        Add Campaign
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
          <h2 className="text-lg font-bold text-white">Add Campaign</h2>
          <button onClick={close} className="text-[#888888] hover:text-white">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            required
            placeholder="Advertiser name *"
            value={form.advertiser_name}
            onChange={(e) => update('advertiser_name', e.target.value)}
            className="border-[#2A2A2A] bg-[#111111] text-white placeholder:text-[#888888]"
          />
          <Input
            required
            placeholder="Campaign name *"
            value={form.campaign_name}
            onChange={(e) => update('campaign_name', e.target.value)}
            className="border-[#2A2A2A] bg-[#111111] text-white placeholder:text-[#888888]"
          />
          <select value={form.package_tier} onChange={(e) => update('package_tier', e.target.value)} className={selectClass}>
            {PACKAGE_TIER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={form.status} onChange={(e) => update('status', e.target.value)} className={selectClass}>
            {STATUS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <Input type="date" value={form.start_date} onChange={(e) => update('start_date', e.target.value)} className="border-[#2A2A2A] bg-[#111111] text-white" />
            <Input type="date" value={form.end_date} onChange={(e) => update('end_date', e.target.value)} className="border-[#2A2A2A] bg-[#111111] text-white" />
          </div>
          <Input
            type="number"
            placeholder="Budget (USD)"
            value={form.budget_usd}
            onChange={(e) => update('budget_usd', e.target.value)}
            className="border-[#2A2A2A] bg-[#111111] text-white placeholder:text-[#888888]"
          />
          <Textarea
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
            className="border-[#2A2A2A] bg-[#111111] text-white placeholder:text-[#888888]"
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" disabled={submitting} className="w-full font-bold text-black hover:opacity-90" style={{ backgroundColor: '#F37B0D' }}>
            {submitting ? 'Saving…' : 'Save'}
          </Button>
        </form>
      </div>
    </div>
  )
}
