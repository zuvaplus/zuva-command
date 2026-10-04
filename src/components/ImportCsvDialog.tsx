'use client'

import { useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { FileUp, Loader2, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

// Shared CSV import modal (Advertiser CRM, Creators). Safeguards:
// - always shows a result line or the full error — never closes silently
// - Import is disabled with a spinner while running; can't close mid-import
// - the box clears after a successful import so rows can't be re-sent
// - scrolling body with Cancel / Import pinned at the bottom
// - Choose CSV file loads a file into the box, with a preview line
// The endpoint does duplicate-skipping and must return ImportResult.

export interface ImportResult {
  imported: number
  duplicates: number
  skipped_other: number
  details?: string[]
}

export default function ImportCsvDialog({
  title,
  formatHint,
  endpoint,
  preview,
  onImported,
}: {
  title: string
  formatHint: ReactNode
  endpoint: string
  /** Summary line shown under the box, e.g. "96 rows found, 95 missing email". */
  preview: (csvText: string) => string | null
  onImported: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [csvText, setCsvText] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)

  const previewLine = useMemo(() => (csvText.trim() ? preview(csvText) : null), [csvText, preview])

  function close() {
    if (submitting) return // never close mid-import — the result must be seen
    setOpen(false)
    setCsvText('')
    setFileName(null)
    setError(null)
    setResult(null)
  }

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow choosing the same file again
    if (!file) return
    try {
      setCsvText(await file.text())
      setFileName(file.name)
      setError(null)
      setResult(null)
    } catch {
      setError(`Could not read ${file.name}`)
    }
  }

  async function handleImport() {
    if (submitting) return
    setSubmitting(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv_text: csvText }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data) {
        throw new Error(data?.error || `Import failed (HTTP ${res.status}) — nothing was imported.`)
      }
      setResult(data)
      // Clear the box so the same rows can't be re-submitted by accident.
      setCsvText('')
      setFileName(null)
      onImported()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed — nothing was imported.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="gap-2 border-[#2A2A2A] text-[#F0F0F0] hover:bg-[#1A1A1A]"
      >
        <Upload size={16} />
        Import CSV
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={close}>
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl"
        style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={close} disabled={submitting} className="text-[#888888] hover:text-white disabled:opacity-40">
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6">
          <div>{formatHint}</div>

          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={submitting}
              variant="outline"
              size="sm"
              className="gap-2 border-[#2A2A2A] text-[#F0F0F0] hover:bg-[#111111]"
            >
              <FileUp size={14} />
              Choose CSV file
            </Button>
            <span className="truncate text-xs" style={{ color: '#888888' }}>{fileName ?? 'or paste below'}</span>
          </div>

          <Textarea
            value={csvText}
            onChange={(e) => { setCsvText(e.target.value); setFileName(null) }}
            disabled={submitting}
            placeholder="Paste CSV text here…"
            rows={8}
            className="max-h-64 resize-none overflow-y-auto border-[#2A2A2A] bg-[#111111] font-mono text-xs text-white placeholder:text-[#888888]"
          />

          {previewLine && <p className="text-xs" style={{ color: '#888888' }}>{previewLine}</p>}

          {error && (
            <p className="rounded-md px-3 py-2 text-sm text-red-400" style={{ backgroundColor: '#EF444415', border: '1px solid #EF444455' }}>
              {error}
            </p>
          )}

          {result && (
            <div className="space-y-1 rounded-md px-3 py-2" style={{ backgroundColor: '#22C55E12', border: '1px solid #22C55E55' }}>
              <p className="text-sm font-semibold" style={{ color: '#22C55E' }}>
                {result.imported} imported, {result.duplicates} skipped (duplicate), {result.skipped_other} skipped (other reason)
              </p>
              {(result.details ?? []).map((line) => (
                <p key={line} className="text-xs" style={{ color: '#888888' }}>{line}</p>
              ))}
            </div>
          )}
        </div>

        <div className="flex shrink-0 gap-2 px-6 py-4" style={{ borderTop: '1px solid #2A2A2A' }}>
          <Button
            onClick={close}
            disabled={submitting}
            variant="outline"
            className="flex-1 border-[#2A2A2A] text-[#F0F0F0] hover:bg-[#111111]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={submitting || !csvText.trim()}
            className="flex-1 gap-2 font-bold text-black hover:opacity-90"
            style={{ backgroundColor: '#F37B0D' }}
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {submitting ? 'Importing…' : 'Import'}
          </Button>
        </div>
      </div>
    </div>
  )
}
