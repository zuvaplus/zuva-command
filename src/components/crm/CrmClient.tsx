'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { List, LayoutGrid, Mail, Loader2 } from 'lucide-react'
import ProspectList from './ProspectList'
import PipelineKanban from './PipelineKanban'
import ProspectDetail from './ProspectDetail'
import AddProspectModal from './AddProspectModal'
import ImportCsvModal from './ImportCsvModal'
import { STAGE_OPTIONS, INDUSTRY_OPTIONS, MARKET_OPTIONS } from '@/lib/crmOptions'
import type { CommandProspect } from '@/lib/types'

const selectClass = 'rounded-md px-3 py-2 text-sm bg-[#111111] border border-[#2A2A2A] text-[#F0F0F0]'

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false
  return dueDate <= new Date().toISOString().slice(0, 10)
}

function StatChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg px-3 py-1.5" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
      <span className="text-sm font-bold text-white">{value}</span>
      <span className="ml-1.5 text-xs" style={{ color: '#888888' }}>{label}</span>
    </div>
  )
}

export default function CrmClient({
  initialProspects,
  gmailConnected,
}: {
  initialProspects: CommandProspect[]
  gmailConnected: boolean
}) {
  const searchParams = useSearchParams()
  const [prospects, setProspects] = useState(initialProspects)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'kanban'>('list')
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('All')
  const [industryFilter, setIndustryFilter] = useState('All')
  const [marketFilter, setMarketFilter] = useState('All')
  const [dueOnly, setDueOnly] = useState(false)
  const [campaignMode, setCampaignMode] = useState(false)
  const [selectedForCampaign, setSelectedForCampaign] = useState<Set<string>>(new Set())
  const [bulkGenerating, setBulkGenerating] = useState(false)
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null)
  const [bulkResult, setBulkResult] = useState<string | null>(null)

  useEffect(() => {
    if (searchParams.get('filter') === 'due') setDueOnly(true)
  }, [searchParams])

  async function refreshProspects() {
    const res = await fetch('/api/prospects')
    const data = await res.json()
    if (res.ok) setProspects(data.prospects)
  }

  function handleProspectChanged(updated: CommandProspect) {
    setProspects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
  }

  async function handleStageChange(id: string, stage: string) {
    setProspects((prev) => prev.map((p) => (p.id === id ? { ...p, stage } : p)))
    const res = await fetch(`/api/prospects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage }),
    })
    const data = await res.json()
    if (res.ok) handleProspectChanged(data)
  }

  const filtered = useMemo(() => {
    return prospects.filter((p) => {
      if (dueOnly && !isOverdue(p.follow_up_due)) return false
      if (stageFilter !== 'All' && p.stage !== stageFilter) return false
      if (industryFilter !== 'All' && p.industry !== industryFilter) return false
      if (marketFilter !== 'All' && p.market !== marketFilter) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        const haystack = `${p.company} ${p.contact ?? ''} ${p.email}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [prospects, search, stageFilter, industryFilter, marketFilter, dueOnly])

  const stats = useMemo(() => {
    const total = prospects.length
    const contacted = prospects.filter((p) => p.stage !== 'New Lead').length
    const responded = prospects.filter((p) => ['Responded', 'Qualified', 'Proposal Sent', 'Converted'].includes(p.stage)).length
    const converted = prospects.filter((p) => p.stage === 'Converted').length
    const hot = prospects.filter((p) => p.score >= 4).length
    const followUpsDue = prospects.filter((p) => isOverdue(p.follow_up_due)).length
    return { total, contacted, responded, converted, hot, followUpsDue }
  }, [prospects])

  function toggleCampaignSelection(id: string) {
    setSelectedForCampaign((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Sequential, not Promise.all — bulk-generating N emails concurrently
  // against the Anthropic API from a single click risks rate limits with
  // no benefit here (nobody is watching a progress bar race).
  async function bulkGenerate() {
    const targets = prospects.filter((p) => selectedForCampaign.has(p.id))
    if (targets.length === 0) return
    setBulkGenerating(true)
    setBulkResult(null)
    setBulkProgress({ done: 0, total: targets.length })
    let succeeded = 0
    for (const [i, prospect] of targets.entries()) {
      try {
        const res = await fetch('/api/ai/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prospect, email_type: 'cold', prospect_id: prospect.id }),
        })
        if (res.ok) succeeded++
      } catch {
        // continue — one failed generation shouldn't stop the batch
      }
      setBulkProgress({ done: i + 1, total: targets.length })
    }
    setBulkGenerating(false)
    setBulkProgress(null)
    setBulkResult(`${succeeded}/${targets.length} cold emails generated — open each prospect's AI Email Composer tab to review and send.`)
    setSelectedForCampaign(new Set())
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="space-y-4 p-6 pb-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-white">Advertiser CRM</h1>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
              style={
                gmailConnected
                  ? { backgroundColor: '#22C55E22', color: '#22C55E' }
                  : { backgroundColor: '#F37B0D22', color: '#F37B0D' }
              }
            >
              <Mail size={12} />
              {gmailConnected ? (
                'Gmail Connected'
              ) : (
                <a href="/api/auth/gmail">Connect Gmail</a>
              )}
            </span>
            <ImportCsvModal />
            <AddProspectModal onCreated={(p) => setProspects((prev) => [p, ...prev])} />
            <button
              onClick={() => { setCampaignMode((v) => !v); setSelectedForCampaign(new Set()) }}
              className="rounded-md px-3 py-2 text-sm font-semibold transition-colors"
              style={
                campaignMode
                  ? { backgroundColor: '#F37B0D', color: '#000000' }
                  : { backgroundColor: '#111111', color: '#888888', border: '1px solid #2A2A2A' }
              }
            >
              ⚡ Campaign Mode {campaignMode && `(${selectedForCampaign.size})`}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatChip label="Total" value={stats.total} />
          <StatChip label="Contacted" value={stats.contacted} />
          <StatChip label="Responded" value={stats.responded} />
          <StatChip label="Converted" value={stats.converted} />
          <StatChip label="Hot" value={stats.hot} />
          <StatChip label="Follow-Ups Due" value={stats.followUpsDue} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company, contact, or email…"
            className="w-64 rounded-md px-3 py-2 text-sm bg-[#111111] border border-[#2A2A2A] text-[#F0F0F0] placeholder:text-[#888888]"
          />
          <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className={selectClass}>
            <option value="All">All Stages</option>
            {STAGE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={industryFilter} onChange={(e) => setIndustryFilter(e.target.value)} className={selectClass}>
            <option value="All">All Industries</option>
            {INDUSTRY_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={marketFilter} onChange={(e) => setMarketFilter(e.target.value)} className={selectClass}>
            <option value="All">All Markets</option>
            {MARKET_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {dueOnly && (
            <button
              onClick={() => setDueOnly(false)}
              className="rounded-md px-3 py-2 text-xs font-semibold"
              style={{ backgroundColor: '#EF444422', color: '#EF4444' }}
            >
              Overdue follow-ups only ✕
            </button>
          )}
          <div className="ml-auto flex gap-1 rounded-md p-1" style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A' }}>
            <button
              onClick={() => setView('list')}
              className="rounded px-2 py-1"
              style={{ backgroundColor: view === 'list' ? '#F37B0D' : 'transparent', color: view === 'list' ? '#000' : '#888888' }}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setView('kanban')}
              className="rounded px-2 py-1"
              style={{ backgroundColor: view === 'kanban' ? '#F37B0D' : 'transparent', color: view === 'kanban' ? '#000' : '#888888' }}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-1 overflow-hidden" style={{ borderTop: '1px solid #2A2A2A' }}>
        {view === 'kanban' ? (
          <PipelineKanban prospects={filtered} onSelect={setSelectedId} onStageChange={handleStageChange} />
        ) : (
          <>
            <div className="w-[55%] overflow-y-auto" style={{ borderRight: '1px solid #2A2A2A' }}>
              {campaignMode && (
                <div className="space-y-2 px-4 py-2" style={{ backgroundColor: '#F37B0D11' }}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs" style={{ color: '#F37B0D' }}>
                      Campaign Mode: select prospects, then bulk-generate cold emails ({selectedForCampaign.size} selected)
                    </span>
                    <button
                      onClick={bulkGenerate}
                      disabled={selectedForCampaign.size === 0 || bulkGenerating}
                      className="flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold text-black disabled:opacity-40"
                      style={{ backgroundColor: '#F37B0D' }}
                    >
                      {bulkGenerating && <Loader2 size={12} className="animate-spin" />}
                      {bulkGenerating && bulkProgress ? `Generating ${bulkProgress.done}/${bulkProgress.total}…` : 'Generate Emails'}
                    </button>
                  </div>
                  {bulkResult && <p className="text-xs" style={{ color: '#888888' }}>{bulkResult}</p>}
                </div>
              )}
              {campaignMode ? (
                <div className="divide-y" style={{ borderColor: '#2A2A2A' }}>
                  {filtered.map((p) => (
                    <label key={p.id} className="flex cursor-pointer items-center gap-3 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedForCampaign.has(p.id)}
                        onChange={() => toggleCampaignSelection(p.id)}
                      />
                      <span className="text-sm text-white">{p.company}</span>
                      <span className="text-xs" style={{ color: '#888888' }}>{p.email}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <ProspectList prospects={filtered} selectedId={selectedId} onSelect={setSelectedId} />
              )}
            </div>
            <div className="w-[45%]">
              {selectedId ? (
                <ProspectDetail
                  prospectId={selectedId}
                  gmailConnected={gmailConnected}
                  onChanged={handleProspectChanged}
                  onDeleted={() => { setSelectedId(null); refreshProspects() }}
                />
              ) : (
                <div className="flex h-full items-center justify-center p-6 text-center text-sm" style={{ color: '#888888' }}>
                  Select a prospect to view details or compose an email.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
