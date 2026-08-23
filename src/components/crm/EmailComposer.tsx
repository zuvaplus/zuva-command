'use client'

import { useState } from 'react'
import { Loader2, RotateCcw, Send, Sparkles, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { EMAIL_TYPE_OPTIONS } from '@/lib/crmOptions'

export interface ComposerProspectData {
  company: string
  contact?: string | null
  email: string
  industry?: string | null
  market?: string | null
  size?: string | null
  website?: string | null
  notes?: string | null
  emails_sent?: number
  stage?: string | null
}

type EmailType = 'cold' | 'follow1' | 'follow2' | 'nurture'

interface Draft {
  subject: string
  body: string
}

export default function EmailComposer({
  prospectId,
  prospectData,
  gmailConnected,
  onSent,
}: {
  prospectId?: string | null
  prospectData: ComposerProspectData
  gmailConnected: boolean
  onSent?: () => void
}) {
  const [activeType, setActiveType] = useState<EmailType>('cold')
  const [drafts, setDrafts] = useState<Partial<Record<EmailType, Draft>>>({})
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [copied, setCopied] = useState(false)

  const draft = drafts[activeType]

  function selectType(type: EmailType) {
    setActiveType(type)
    setError(null)
    setSent(false)
    setCopied(false)
  }

  async function generate() {
    setGenerating(true)
    setError(null)
    setSent(false)
    try {
      const res = await fetch('/api/ai/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospect: prospectData, email_type: activeType, prospect_id: prospectId ?? null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not generate email')
      setDrafts((prev) => ({ ...prev, [activeType]: { subject: data.subject, body: data.body } }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate email')
    } finally {
      setGenerating(false)
    }
  }

  function updateDraft(field: keyof Draft, value: string) {
    setDrafts((prev) => ({ ...prev, [activeType]: { ...(prev[activeType] ?? { subject: '', body: '' }), [field]: value } }))
  }

  async function send() {
    if (!draft) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: prospectData.email,
          subject: draft.subject,
          body: draft.body,
          prospect_id: prospectId ?? null,
          email_type: activeType,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not send email')
      setSent(true)
      onSent?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send email')
    } finally {
      setSending(false)
    }
  }

  async function copyToClipboard() {
    if (!draft) return
    await navigator.clipboard.writeText(`Subject: ${draft.subject}\n\n${draft.body}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {EMAIL_TYPE_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => selectType(option.value)}
            className="rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
            style={
              activeType === option.value
                ? { backgroundColor: '#F37B0D', color: '#000000' }
                : { backgroundColor: '#111111', color: '#888888', border: '1px solid #2A2A2A' }
            }
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          onClick={generate}
          disabled={generating}
          className="gap-2 font-bold text-black hover:opacity-90"
          style={{ backgroundColor: '#F37B0D' }}
        >
          {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {generating ? 'Generating…' : draft ? 'Regenerate' : 'Generate Email'}
        </Button>
        {draft && !generating && (
          <Button onClick={generate} variant="outline" size="icon" className="border-[#2A2A2A] text-[#F0F0F0] hover:bg-[#111111]" title="Regenerate">
            <RotateCcw size={14} />
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {draft && (
        <div className="space-y-3">
          <Input
            value={draft.subject}
            onChange={(e) => updateDraft('subject', e.target.value)}
            placeholder="Subject"
            className="border-[#2A2A2A] bg-[#111111] font-semibold text-white"
          />
          <Textarea
            value={draft.body}
            onChange={(e) => updateDraft('body', e.target.value)}
            rows={12}
            className="border-[#2A2A2A] bg-[#111111] text-sm text-white leading-relaxed"
          />

          {gmailConnected ? (
            <Button onClick={send} disabled={sending} className="gap-2 font-bold text-black hover:opacity-90" style={{ backgroundColor: '#F37B0D' }}>
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {sending ? 'Sending…' : sent ? 'Sent ✓' : 'Send via Gmail'}
            </Button>
          ) : (
            <div className="space-y-2 rounded-md p-3" style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A' }}>
              <p className="text-xs" style={{ color: '#888888' }}>
                <a href="/api/auth/gmail" className="font-semibold hover:underline" style={{ color: '#F37B0D' }}>
                  Connect Gmail
                </a>{' '}
                to send directly.
              </p>
              <Button onClick={copyToClipboard} variant="outline" size="sm" className="gap-2 border-[#2A2A2A] text-[#F0F0F0] hover:bg-[#1A1A1A]">
                <Copy size={14} />
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
