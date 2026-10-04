'use client'

import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { FileUp, Loader2, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { parseProspectCsv } from '@/lib/prospectCsv'

interface ImportResult {
  imported: number
  duplicates: number
  duplicate_existing: number
  duplicate_in_file: number
  skipped_other: number
  needs_email: number
  unrecognized_markets: string[]
}

export default function ImportCsvModal({ onImported }: { onImported: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [csvText, setCsvText] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)

  const preview = useMemo(() => {
    if (!csvText.trim()) return null
    const rows = parseProspectCsv(csvText)
    return {
      rows: rows.length,
      missingEmail: rows.filter((r) => !r.email).length,
      missingCompany: rows.filter((r) => !r.company).length,
    }
  }, [csvText])

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
      const res = await fetch('/api/prospects/import', {
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
          <h2 className="text-lg font-bold text-white">Import Prospects from CSV</h2>
          <button onClick={close} disabled={submitting} className="text-[#888888] hover:text-white disabled:opacity-40">
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6">
          <div>
            <p className="mb-2 text-xs" style={{ color: '#888888' }}>
              Expected format (header row optional; email can be blank):
            </p>
            <code className="block rounded-md px-3 py-2 text-xs" style={{ backgroundColor: '#111111', color: '#F37B0D', border: '1px solid #2A2A2A' }}>
              company,contact,email,industry,market,size
            </code>
          </div>

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

          {preview && (
            <p className="text-xs" style={{ color: '#888888' }}>
              {preview.rows} {preview.rows === 1 ? 'row' : 'rows'} found, {preview.missingEmail} missing email
              {preview.missingCompany > 0 && `, ${preview.missingCompany} missing company (will be skipped)`}
            </p>
          )}

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
              {result.duplicates > 0 && (
                <p className="text-xs" style={{ color: '#888888' }}>
                  Duplicates: {result.duplicate_existing} already in the CRM (same company and market), {result.duplicate_in_file} repeated in this file.
                </p>
              )}
              {result.skipped_other > 0 && (
                <p className="text-xs" style={{ color: '#888888' }}>Other: {result.skipped_other} rows had no company name.</p>
              )}
              {result.needs_email > 0 && (
                <p className="text-xs" style={{ color: '#888888' }}>{result.needs_email} imported without an email (tagged &ldquo;needs email&rdquo;).</p>
              )}
              {result.unrecognized_markets.length > 0 && (
                <p className="text-xs" style={{ color: '#888888' }}>
                  Unrecognised markets set to Other (original kept in notes): {result.unrecognized_markets.join(', ')}
                </p>
              )}
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
            {submitting ? 'Importing…' : 'Import Prospects'}
          </Button>
        </div>
      </div>
    </div>
  )
}
