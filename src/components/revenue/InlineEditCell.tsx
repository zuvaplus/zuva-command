'use client'

import { useState } from 'react'

export default function InlineEditCell({
  value,
  onSave,
  format,
}: {
  value: number
  onSave: (value: number) => void
  format?: (value: number) => string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))

  function commit() {
    setEditing(false)
    const parsed = Number(draft)
    if (!Number.isNaN(parsed) && parsed !== value) onSave(parsed)
  }

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') { setDraft(String(value)); setEditing(false) }
        }}
        className="w-24 rounded px-1.5 py-0.5 text-sm"
        style={{ backgroundColor: '#111111', border: '1px solid #F37B0D', color: '#F0F0F0' }}
      />
    )
  }

  return (
    <button
      onClick={() => { setDraft(String(value)); setEditing(true) }}
      className="rounded px-1.5 py-0.5 text-left hover:bg-white/5"
      style={{ color: '#F0F0F0' }}
      title="Click to edit"
    >
      {format ? format(value) : value.toLocaleString()}
    </button>
  )
}
