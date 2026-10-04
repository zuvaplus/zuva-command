'use client'

import { useState } from 'react'
import { Check, Copy, Loader2, Sparkles, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { DM_TYPES, DM_VARIANTS, guessDmVariant, type DmType, type DmVariant } from '@/lib/creators'
import type { CommandCreator } from '@/lib/types'

// Drafts recruitment DMs. Nothing is sent from here — DMs go out by hand,
// then "Mark as contacted" records it.
export default function DmAssistant({
  creator,
  onContacted,
}: {
  creator: CommandCreator
  onContacted: (updated: CommandCreator) => void
}) {
  const [variant, setVariant] = useState<DmVariant>(guessDmVariant(creator.country))
  const [dmType, setDmType] = useState<DmType>(creator.stage === 'Identified' ? 'first' : creator.stage === 'Contacted' ? 'follow_up' : 'post_reply')
  const [message, setMessage] = useState('')
  const [warnings, setWarnings] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)
  const [marking, setMarking] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<string | null>(null)

  async function generate() {
    if (generating) return
    setGenerating(true)
    setError(null)
    setConfirmation(null)
    try {
      const res = await fetch('/api/ai/creator-dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creator_id: creator.id, variant, dm_type: dmType }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data) throw new Error(data?.error || `Could not generate the DM (HTTP ${res.status})`)
      setMessage(data.message)
      setWarnings(data.warnings ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate the DM')
    } finally {
      setGenerating(false)
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function markContacted() {
    if (marking) return
    setMarking(true)
    setError(null)
    try {
      const res = await fetch(`/api/creators/${creator.id}/contacted`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, dm_type: dmType, variant }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data) throw new Error(data?.error || `Could not mark as contacted (HTTP ${res.status})`)
      setConfirmation(`Marked as contacted. Stage: ${data.stage}. Follow-up due ${data.follow_up_due}.`)
      onContacted(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not mark as contacted')
    } finally {
      setMarking(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: '#888888' }}>Voice</label>
        <select
          value={variant}
          onChange={(e) => setVariant(e.target.value as DmVariant)}
          className="w-full rounded-md px-3 py-2 text-sm bg-[#111111] border border-[#2A2A2A] text-[#F0F0F0]"
        >
          {DM_VARIANTS.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
        </select>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {DM_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setDmType(t.value)}
            className="rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
            style={
              dmType === t.value
                ? { backgroundColor: '#F37B0D', color: '#000000' }
                : { backgroundColor: '#111111', color: '#888888', border: '1px solid #2A2A2A' }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <Button onClick={generate} disabled={generating} className="gap-2 font-bold text-black hover:opacity-90" style={{ backgroundColor: '#F37B0D' }}>
        {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
        {generating ? 'Generating…' : message ? 'Regenerate DM' : 'Generate DM'}
      </Button>

      {error && (
        <p className="rounded-md px-3 py-2 text-sm text-red-400" style={{ backgroundColor: '#EF444415', border: '1px solid #EF444455' }}>{error}</p>
      )}

      {message && (
        <div className="space-y-3">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={7}
            className="border-[#2A2A2A] bg-[#111111] text-sm leading-relaxed text-white"
          />
          {warnings.length > 0 && (
            <div className="rounded-md px-3 py-2 text-xs" style={{ backgroundColor: '#EAB30815', border: '1px solid #EAB30855', color: '#EAB308' }}>
              <p className="font-semibold">Check before sending. This draft breaks the outreach rules:</p>
              <ul className="mt-1 list-disc pl-4">
                {warnings.map((w) => <li key={w}>{w}</li>)}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={copy} variant="outline" className="gap-2 border-[#2A2A2A] text-[#F0F0F0] hover:bg-[#111111]">
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button onClick={markContacted} disabled={marking} variant="outline" className="gap-2 border-[#2A2A2A] text-[#F0F0F0] hover:bg-[#111111]">
              {marking ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
              {marking ? 'Saving…' : 'Mark as contacted'}
            </Button>
          </div>
          <p className="text-[11px]" style={{ color: '#888888' }}>
            Nothing is sent from here. Copy the message, send it yourself on {creator.primary_platform}, then click Mark as contacted.
          </p>
        </div>
      )}

      {confirmation && <p className="text-sm" style={{ color: '#22C55E' }}>{confirmation}</p>}
    </div>
  )
}
