'use client'

import { useState, type FormEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { CommandSportsEvent } from '@/lib/types'

const SPORT_OPTIONS = ['Rugby', 'Cricket', 'Football/Soccer', 'Hockey', 'Athletics', 'Basketball', 'Swimming', 'Other']
const selectClass = 'w-full rounded-md px-3 py-2 text-sm bg-[#111111] border border-[#2A2A2A] text-[#F0F0F0]'

const initialForm = {
  event_name: '',
  school_or_team: '',
  sport: SPORT_OPTIONS[0],
  venue: '',
  event_date: '',
  notes: '',
}

export default function AddEventModal({ onCreated }: { onCreated: (event: CommandSportsEvent) => void }) {
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
      const res = await fetch('/api/sports/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          school_or_team: form.school_or_team || null,
          venue: form.venue || null,
          notes: form.notes || null,
          event_date: form.event_date ? new Date(form.event_date).toISOString() : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not create event')
      onCreated(data)
      close()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create event')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="gap-2 font-bold text-black hover:opacity-90" style={{ backgroundColor: '#F37B0D' }}>
        <Plus size={16} />
        Add Event
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={close}>
      <div className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-xl p-6" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }} onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Add Sports Event</h2>
          <button onClick={close} className="text-[#888888] hover:text-white"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input required placeholder="Event name *" value={form.event_name} onChange={(e) => update('event_name', e.target.value)} className="border-[#2A2A2A] bg-[#111111] text-white placeholder:text-[#888888]" />
          <Input placeholder="School / team" value={form.school_or_team} onChange={(e) => update('school_or_team', e.target.value)} className="border-[#2A2A2A] bg-[#111111] text-white placeholder:text-[#888888]" />
          <select value={form.sport} onChange={(e) => update('sport', e.target.value)} className={selectClass}>
            {SPORT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <Input placeholder="Venue" value={form.venue} onChange={(e) => update('venue', e.target.value)} className="border-[#2A2A2A] bg-[#111111] text-white placeholder:text-[#888888]" />
          <Input required type="datetime-local" value={form.event_date} onChange={(e) => update('event_date', e.target.value)} className="border-[#2A2A2A] bg-[#111111] text-white" />
          <Textarea placeholder="Notes" value={form.notes} onChange={(e) => update('notes', e.target.value)} className="border-[#2A2A2A] bg-[#111111] text-white placeholder:text-[#888888]" />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" disabled={submitting} className="w-full font-bold text-black hover:opacity-90" style={{ backgroundColor: '#F37B0D' }}>
            {submitting ? 'Saving…' : 'Save'}
          </Button>
        </form>
      </div>
    </div>
  )
}
