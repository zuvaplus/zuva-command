'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { CREATOR_PITCH_FACTS, PITCH_STATUS_META } from '@/lib/creatorPitchFacts'
import { PAYOUT_ROUTE_NOTES, livePayoutCountries } from '@/lib/payoutRoutes'

// What the DM assistant may tell creators right now, from
// creatorPitchFacts.ts and payoutRoutes.ts (edit those files to change it).
export default function PitchReadiness() {
  const [open, setOpen] = useState(true)
  const liveCountries = livePayoutCountries()

  return (
    <div className="rounded-lg" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between px-4 py-2.5 text-left">
        <span className="text-sm font-bold text-white">
          Pitch readiness
          <span className="ml-2 text-xs font-normal" style={{ color: '#888888' }}>
            what DMs may promise today
          </span>
        </span>
        {open ? <ChevronUp size={16} color="#888888" /> : <ChevronDown size={16} color="#888888" />}
      </button>

      {open && (
        <div className="space-y-2 px-4 pb-3">
          <ul className="space-y-1.5">
            {CREATOR_PITCH_FACTS.map((fact) => {
              const meta = PITCH_STATUS_META[fact.status]
              return (
                <li key={fact.id} className="flex flex-wrap items-start gap-2 text-xs">
                  <span
                    className="w-20 shrink-0 rounded-full px-2 py-0.5 text-center font-semibold"
                    style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
                  >
                    {meta.label}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold text-white">{fact.label}</span>
                    {fact.boostCategoriesOnly && <span style={{ color: '#888888' }}> (Boost categories only)</span>}
                    <span style={{ color: '#888888' }}>. {meta.dmRule}.</span>
                    {fact.note && <span className="block" style={{ color: '#666666' }}>{fact.note}</span>}
                  </span>
                </li>
              )
            })}
            <li className="flex flex-wrap items-start gap-2 text-xs">
              <span
                className="w-20 shrink-0 rounded-full px-2 py-0.5 text-center font-semibold"
                style={liveCountries.length > 0 ? { backgroundColor: '#22C55E22', color: '#22C55E' } : { backgroundColor: '#EF444422', color: '#EF4444' }}
              >
                {liveCountries.length > 0 ? 'Partial' : 'Not live'}
              </span>
              <span className="min-w-0 flex-1">
                <span className="font-semibold text-white">Cash-out / payouts</span>
                <span style={{ color: '#888888' }}>
                  {liveCountries.length > 0
                    ? `. Live in: ${liveCountries.join(', ')}. Everyone else shows "Can't cash out yet".`
                    : '. Not live in any country. DMs never bring up payouts.'}
                </span>
                {Object.entries(PAYOUT_ROUTE_NOTES).map(([country, note]) => (
                  <span key={country} className="block" style={{ color: '#666666' }}>{country}: {note}</span>
                ))}
              </span>
            </li>
          </ul>
          <p className="text-[11px]" style={{ color: '#666666' }}>
            Edit statuses in src/lib/creatorPitchFacts.ts and src/lib/payoutRoutes.ts. DMs never mention guaranteed payouts or earnings figures.
          </p>
        </div>
      )}
    </div>
  )
}
