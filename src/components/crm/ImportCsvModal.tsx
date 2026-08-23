'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export default function ImportCsvModal() {
  const router = useRouter()
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
      const res = await fetch('/api/prospects/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv_text: csvText }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not import prospects')
      setResult(data)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not import prospects')
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
        className="w-full max-w-lg rounded-xl p-6"
        style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Import Prospects from CSV</h2>
          <button onClick={close} className="text-[#888888] hover:text-white">
            <X size={18} />
          </button>
        </div>

        <p className="mb-2 text-xs" style={{ color: '#888888' }}>
          Expected format (header row optional):
        </p>
        <code className="mb-3 block rounded-md px-3 py-2 text-xs" style={{ backgroundColor: '#111111', color: '#F37B0D', border: '1px solid #2A2A2A' }}>
          company,contact,email,industry,market,size
        </code>

        <Textarea
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          placeholder="Paste CSV text here…"
          rows={10}
          className="border-[#2A2A2A] bg-[#111111] font-mono text-xs text-white placeholder:text-[#888888]"
        />

        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        {result && (
          <p className="mt-2 text-sm" style={{ color: '#F37B0D' }}>
            {result.imported} imported, {result.skipped} skipped (missing company or email)
          </p>
        )}

        <Button
          onClick={handleImport}
          disabled={submitting || !csvText.trim()}
          className="mt-3 w-full font-bold text-black hover:opacity-90"
          style={{ backgroundColor: '#F37B0D' }}
        >
          {submitting ? 'Importing…' : 'Import Prospects'}
        </Button>
      </div>
    </div>
  )
}
