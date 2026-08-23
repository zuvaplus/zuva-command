'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DailyBriefing() {
  const [brief, setBrief] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/brief', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not generate briefing')
      setBrief(data.brief)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate briefing')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl p-6" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">☀ Today&rsquo;s Briefing</h2>
        {brief && !loading && (
          <Button
            onClick={generate}
            variant="outline"
            size="sm"
            className="border-[#2A2A2A] text-[#F0F0F0] hover:bg-[#111111]"
          >
            Regenerate
          </Button>
        )}
      </div>

      {!brief && !loading && (
        <Button
          onClick={generate}
          className="font-bold text-black hover:opacity-90"
          style={{ backgroundColor: '#F37B0D' }}
        >
          Generate Brief
        </Button>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm" style={{ color: '#888888' }}>
          <Loader2 size={16} className="animate-spin" />
          Generating your briefing…
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {brief && !loading && (
        <p className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: '#F0F0F0' }}>
          {brief}
        </p>
      )}
    </div>
  )
}
