'use client'

import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { LayoutGrid, List } from 'lucide-react'
import MarketOptions from '@/components/crm/MarketOptions'
import { CLOSED_CREATOR_STAGES, CREATOR_PLATFORMS, CREATOR_STAGES, CREATOR_TIERS } from '@/lib/creators'
import type { CommandCreator } from '@/lib/types'
import AddCreatorModal from './AddCreatorModal'
import CohortBar from './CohortBar'
import CreatorDetail from './CreatorDetail'
import CreatorKanban from './CreatorKanban'
import CreatorList, { isCreatorDue } from './CreatorList'
import ImportCreatorsModal from './ImportCreatorsModal'
import PitchReadiness from './PitchReadiness'
import { CategoryOptions } from './CreatorBadges'

const selectClass = 'rounded-md px-3 py-2 text-sm bg-[#111111] border border-[#2A2A2A] text-[#F0F0F0]'

export default function CreatorsClient({
  initialCreators,
  loadError,
}: {
  initialCreators: CommandCreator[]
  loadError: string | null
}) {
  const searchParams = useSearchParams()
  const [creators, setCreators] = useState(initialCreators)
  const [error, setError] = useState<string | null>(loadError)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'kanban'>('list')
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('All')
  const [countryFilter, setCountryFilter] = useState('All')
  const [platformFilter, setPlatformFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [tierFilter, setTierFilter] = useState('All')
  // Read once from the URL (the sidebar badge / Morning Brief link here with ?filter=due).
  const [dueOnly, setDueOnly] = useState(() => searchParams.get('filter') === 'due')

  async function refreshCreators() {
    const res = await fetch('/api/creators')
    const data = await res.json().catch(() => null)
    if (res.ok && data) {
      setCreators(data.creators)
      setError(null)
    } else {
      setError(data?.error || 'Could not reload creators')
    }
  }

  function handleChanged(updated: CommandCreator) {
    setCreators((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
  }

  async function patchCreator(id: string, patch: Record<string, unknown>) {
    const res = await fetch(`/api/creators/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const data = await res.json().catch(() => null)
    if (res.ok && data) {
      handleChanged(data)
      setError(null)
    } else {
      setError(data?.error || 'Could not save the change')
      refreshCreators()
    }
  }

  function handleStageChange(id: string, stage: string) {
    setCreators((prev) => prev.map((c) => (c.id === id ? { ...c, stage } : c)))
    patchCreator(id, { stage })
  }

  function handleScoreChange(id: string, score: number) {
    setCreators((prev) => prev.map((c) => (c.id === id ? { ...c, recruit_score: score, recruit_score_manual: true } : c)))
    patchCreator(id, { recruit_score: score })
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return creators.filter((c) => {
      if (dueOnly && !isCreatorDue(c, CLOSED_CREATOR_STAGES)) return false
      if (stageFilter !== 'All' && c.stage !== stageFilter) return false
      if (countryFilter !== 'All' && c.country !== countryFilter) return false
      if (platformFilter !== 'All' && c.primary_platform !== platformFilter) return false
      if (categoryFilter !== 'All' && c.content_category !== categoryFilter) return false
      if (tierFilter !== 'All' && c.proposed_tier !== tierFilter) return false
      if (q) {
        const haystack = `${c.display_name} ${c.profile_url ?? ''} ${c.notes ?? ''} ${c.source ?? ''}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [creators, search, stageFilter, countryFilter, platformFilter, categoryFilter, tierFilter, dueOnly])

  const dueCount = creators.filter((c) => isCreatorDue(c, CLOSED_CREATOR_STAGES)).length

  return (
    <div className="flex h-screen flex-col">
      <div className="space-y-4 p-6 pb-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Creators</h1>
            <p className="text-sm" style={{ color: '#888888' }}>
              Founding creator recruitment. {creators.length} in pipeline{dueCount > 0 ? `, ${dueCount} follow-ups due` : ''}.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ImportCreatorsModal onImported={refreshCreators} />
            <AddCreatorModal onCreated={(c) => { setCreators((prev) => [c, ...prev]); setSelectedId(c.id) }} />
          </div>
        </div>

        <PitchReadiness />

        <CohortBar creators={creators} />

        {error && (
          <p className="rounded-md px-3 py-2 text-sm text-red-400" style={{ backgroundColor: '#EF444415', border: '1px solid #EF444455' }}>{error}</p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, URL, notes…"
            className="w-56 rounded-md px-3 py-2 text-sm bg-[#111111] border border-[#2A2A2A] text-[#F0F0F0] placeholder:text-[#888888]"
          />
          <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className={selectClass}>
            <option value="All">All Stages</option>
            {CREATOR_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)} className={selectClass}>
            <option value="All">All Countries</option>
            <MarketOptions />
          </select>
          <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)} className={selectClass}>
            <option value="All">All Platforms</option>
            {CREATOR_PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={selectClass}>
            <option value="All">All Categories</option>
            <CategoryOptions />
          </select>
          <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} className={selectClass}>
            <option value="All">All Tiers</option>
            {CREATOR_TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          {dueOnly && (
            <button
              onClick={() => setDueOnly(false)}
              className="rounded-md px-3 py-2 text-xs font-semibold"
              style={{ backgroundColor: '#EF444422', color: '#EF4444' }}
            >
              Follow-ups due only ✕
            </button>
          )}
          <div className="ml-auto flex gap-1 rounded-md p-1" style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A' }}>
            <button
              onClick={() => setView('list')}
              className="rounded px-2 py-1"
              style={{ backgroundColor: view === 'list' ? '#F37B0D' : 'transparent', color: view === 'list' ? '#000' : '#888888' }}
              title="List"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setView('kanban')}
              className="rounded px-2 py-1"
              style={{ backgroundColor: view === 'kanban' ? '#F37B0D' : 'transparent', color: view === 'kanban' ? '#000' : '#888888' }}
              title="Kanban"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-1 overflow-hidden" style={{ borderTop: '1px solid #2A2A2A' }}>
        {view === 'kanban' ? (
          <CreatorKanban
            creators={filtered}
            onSelect={(id) => { setSelectedId(id); setView('list') }}
            onStageChange={handleStageChange}
          />
        ) : (
          <>
            <div className="w-[55%] overflow-y-auto" style={{ borderRight: '1px solid #2A2A2A' }}>
              <CreatorList
                creators={filtered}
                selectedId={selectedId}
                closedStages={CLOSED_CREATOR_STAGES}
                onSelect={setSelectedId}
                onScoreChange={handleScoreChange}
              />
            </div>
            <div className="w-[45%]">
              {selectedId ? (
                <CreatorDetail
                  key={selectedId}
                  creatorId={selectedId}
                  onChanged={handleChanged}
                  onDeleted={() => { setSelectedId(null); refreshCreators() }}
                />
              ) : (
                <div className="flex h-full items-center justify-center p-6 text-center text-sm" style={{ color: '#888888' }}>
                  Select a creator to see details or draft a DM.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
