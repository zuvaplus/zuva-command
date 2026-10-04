import { MARKET_GROUPS, MARKET_OPTIONS, OTHER_MARKET } from '@/lib/markets'

// <option>s for a market <select>, grouped into sections. Pass `current` when
// editing an existing prospect so a value that isn't in the list (e.g. a
// legacy label not yet migrated) still shows instead of rendering blank.
export default function MarketOptions({ current }: { current?: string | null }) {
  const unlisted = current && !MARKET_OPTIONS.includes(current) ? current : null
  return (
    <>
      {unlisted && <option value={unlisted}>{unlisted} (old value)</option>}
      {MARKET_GROUPS.map((group) => (
        <optgroup key={group.label} label={group.label}>
          {group.options.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </optgroup>
      ))}
      <option value={OTHER_MARKET}>{OTHER_MARKET}</option>
    </>
  )
}
