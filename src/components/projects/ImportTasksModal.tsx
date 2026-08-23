'use client'

import { useState } from 'react'
import { Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { parseCsv } from '@/lib/csv'
import type { CommandTask } from '@/lib/types'

export default function ImportTasksModal({ onImported }: { onImported: () => void }) {
  const [open, setOpen] = useState(false)
  const [csvText, setCsvText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null)

  function close() {
    setOpen(false)
    setCsvText('')
    setError(null)
    setResult(null)
  }

  async function handleImport() {
    setSubmitting(true)
    setError(null)
    try {
      const rows = parseCsv(csvText)
      if (rows.length === 0) throw new Error('No rows found')

      const header = rows[0].map((h) => h.toLowerCase())
      const hasHeader = header.includes('tab') && header.includes('task')
      const dataRows = hasHeader ? rows.slice(1) : rows
      const col = (name: string, fallback: number) => (hasHeader ? header.indexOf(name) : fallback)

      const tasks: Partial<CommandTask>[] = dataRows.map((cols) => ({
        tab: cols[col('tab', 0)]?.trim(),
        task: cols[col('task', 1)]?.trim(),
        status: cols[col('status', 2)]?.trim() || 'Not Started',
        priority: cols[col('priority', 3)]?.trim() || 'Medium',
        depends_on: cols[col('depends_on', 4)]?.trim() || null,
        notes: cols[col('notes', 5)]?.trim() || null,
      }))

      const res = await fetch('/api/projects/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not import tasks')
      setResult(data)
      onImported()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not import tasks')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="gap-2 font-bold text-black hover:opacity-90" style={{ backgroundColor: '#F37B0D' }}>
        <Download size={16} />
        Sync from Dev Tracker
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={close}>
      <div className="w-full max-w-lg rounded-xl p-6" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }} onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Sync from Dev Tracker</h2>
          <button onClick={close} className="text-[#888888] hover:text-white"><X size={18} /></button>
        </div>

        <p className="mb-2 text-xs" style={{ color: '#888888' }}>
          Paste your Dev Tracker CSV export here to bulk-import tasks. Expected format (header row optional):
        </p>
        <code className="mb-3 block rounded-md px-3 py-2 text-xs" style={{ backgroundColor: '#111111', color: '#F37B0D', border: '1px solid #2A2A2A' }}>
          tab,task,status,priority,depends_on,notes
        </code>

        <Textarea
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          placeholder="Paste CSV text here…"
          rows={10}
          className="border-[#2A2A2A] bg-[#111111] font-mono text-xs text-white placeholder:text-[#888888]"
        />

        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        {result && <p className="mt-2 text-sm" style={{ color: '#F37B0D' }}>{result.imported} imported, {result.skipped} skipped</p>}

        <Button onClick={handleImport} disabled={submitting || !csvText.trim()} className="mt-3 w-full font-bold text-black hover:opacity-90" style={{ backgroundColor: '#F37B0D' }}>
          {submitting ? 'Importing…' : 'Import Tasks'}
        </Button>
      </div>
    </div>
  )
}
