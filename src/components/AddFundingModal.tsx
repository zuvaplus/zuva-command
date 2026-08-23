'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const STATUS_OPTIONS = ['Research', 'Preparing', 'Submitted', 'Under Review', 'Approved', 'Declined', 'Deferred']

const initialForm = {
  program_name: '',
  organization: '',
  amount_requested: '',
  status: 'Research',
  next_action: '',
  next_action_date: '',
  notes: '',
}

export default function AddFundingModal() {
  const router = useRouter()
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
      const res = await fetch('/api/funding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount_requested: form.amount_requested ? Number(form.amount_requested) : null,
          next_action: form.next_action || null,
          next_action_date: form.next_action_date || null,
          notes: form.notes || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not create funding application')
      close()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create funding application')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        className="gap-2 font-bold text-black hover:opacity-90"
        style={{ backgroundColor: '#F37B0D' }}
      >
        <Plus size={16} />
        Add Funding Application
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={close}>
      <div
        className="w-full max-w-md rounded-xl p-6"
        style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Add Funding Application</h2>
          <button onClick={close} className="text-[#888888] hover:text-white">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            required
            placeholder="Program name"
            value={form.program_name}
            onChange={(e) => update('program_name', e.target.value)}
            className="border-[#2A2A2A] bg-[#111111] text-white placeholder:text-[#888888]"
          />
          <Input
            required
            placeholder="Organization"
            value={form.organization}
            onChange={(e) => update('organization', e.target.value)}
            className="border-[#2A2A2A] bg-[#111111] text-white placeholder:text-[#888888]"
          />
          <Input
            type="number"
            placeholder="Amount requested (USD)"
            value={form.amount_requested}
            onChange={(e) => update('amount_requested', e.target.value)}
            className="border-[#2A2A2A] bg-[#111111] text-white placeholder:text-[#888888]"
          />
          <select
            value={form.status}
            onChange={(e) => update('status', e.target.value)}
            className="w-full rounded-md px-3 py-2 text-sm"
            style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', color: '#F0F0F0' }}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <Input
            placeholder="Next action"
            value={form.next_action}
            onChange={(e) => update('next_action', e.target.value)}
            className="border-[#2A2A2A] bg-[#111111] text-white placeholder:text-[#888888]"
          />
          <Input
            type="date"
            value={form.next_action_date}
            onChange={(e) => update('next_action_date', e.target.value)}
            className="border-[#2A2A2A] bg-[#111111] text-white placeholder:text-[#888888]"
          />
          <Textarea
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
            className="border-[#2A2A2A] bg-[#111111] text-white placeholder:text-[#888888]"
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full font-bold text-black hover:opacity-90"
            style={{ backgroundColor: '#F37B0D' }}
          >
            {submitting ? 'Saving…' : 'Save'}
          </Button>
        </form>
      </div>
    </div>
  )
}
