'use client'

import { useState, type FormEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { CommandTask } from '@/lib/types'

const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Blocked', 'Completed']
const PRIORITY_OPTIONS = ['Critical', 'High', 'Medium', 'Low']
const selectClass = 'w-full rounded-md px-3 py-2 text-sm bg-[#111111] border border-[#2A2A2A] text-[#F0F0F0]'

export default function AddTaskModal({
  tabs,
  defaultTab,
  onCreated,
}: {
  tabs: string[]
  defaultTab?: string
  onCreated: (task: CommandTask) => void
}) {
  const [open, setOpen] = useState(false)
  const [addingNewTab, setAddingNewTab] = useState(false)
  const [form, setForm] = useState({
    tab: defaultTab ?? tabs[0] ?? '',
    task: '',
    status: 'Not Started',
    priority: 'Medium',
    depends_on: '',
    notes: '',
    due_date: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function close() {
    setOpen(false)
    setAddingNewTab(false)
    setForm({ tab: defaultTab ?? tabs[0] ?? '', task: '', status: 'Not Started', priority: 'Medium', depends_on: '', notes: '', due_date: '' })
    setError(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/projects/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          depends_on: form.depends_on || null,
          notes: form.notes || null,
          due_date: form.due_date || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not create task')
      onCreated(data)
      close()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create task')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm" className="gap-1.5 font-bold text-black hover:opacity-90" style={{ backgroundColor: '#F37B0D' }}>
        <Plus size={14} />
        Add Task
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={close}>
      <div className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-xl p-6" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }} onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Add Task</h2>
          <button onClick={close} className="text-[#888888] hover:text-white"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {addingNewTab ? (
            <Input
              autoFocus
              required
              placeholder="New tab name"
              value={form.tab}
              onChange={(e) => update('tab', e.target.value)}
              className="border-[#2A2A2A] bg-[#111111] text-white placeholder:text-[#888888]"
            />
          ) : (
            <select
              value={form.tab}
              onChange={(e) => {
                if (e.target.value === '__new__') setAddingNewTab(true)
                else update('tab', e.target.value)
              }}
              className={selectClass}
            >
              {tabs.map((t) => <option key={t} value={t}>{t}</option>)}
              <option value="__new__">+ New Tab…</option>
            </select>
          )}

          <Textarea
            required
            placeholder="Task *"
            value={form.task}
            onChange={(e) => update('task', e.target.value)}
            className="border-[#2A2A2A] bg-[#111111] text-white placeholder:text-[#888888]"
          />

          <div className="grid grid-cols-2 gap-3">
            <select value={form.status} onChange={(e) => update('status', e.target.value)} className={selectClass}>
              {STATUS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <select value={form.priority} onChange={(e) => update('priority', e.target.value)} className={selectClass}>
              {PRIORITY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          <Input
            placeholder="Depends on"
            value={form.depends_on}
            onChange={(e) => update('depends_on', e.target.value)}
            className="border-[#2A2A2A] bg-[#111111] text-white placeholder:text-[#888888]"
          />
          <Input
            type="date"
            value={form.due_date}
            onChange={(e) => update('due_date', e.target.value)}
            className="border-[#2A2A2A] bg-[#111111] text-white"
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
