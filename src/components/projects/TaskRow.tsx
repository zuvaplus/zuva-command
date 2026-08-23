'use client'

import { useState } from 'react'
import { StickyNote } from 'lucide-react'
import { colorFor, PRIORITY_COLORS, TASK_STATUS_COLORS } from '@/lib/badgeColors'
import ColorBadge from '@/components/ColorBadge'
import type { CommandTask } from '@/lib/types'

const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Blocked', 'Completed']

function isPastDue(date: string | null): boolean {
  if (!date) return false
  return date < new Date().toISOString().slice(0, 10)
}

export default function TaskRow({
  task,
  showTabBadge,
  onStatusChange,
}: {
  task: CommandTask
  showTabBadge: boolean
  onStatusChange: (id: string, status: string) => void
}) {
  const [showNotes, setShowNotes] = useState(false)
  const pastDue = isPastDue(task.due_date) && task.status !== 'Completed'

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid #2A2A2A' }}>
      {showTabBadge && <ColorBadge label={task.tab} color="#F37B0D" />}
      <p className="min-w-[220px] flex-1 text-sm leading-snug" style={{ color: '#F0F0F0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {task.task}
      </p>
      <ColorBadge label={task.priority} color={colorFor(PRIORITY_COLORS, task.priority)} />
      <select
        value={task.status}
        onChange={(e) => onStatusChange(task.id, e.target.value)}
        className="rounded-md px-2 py-1 text-xs"
        style={{ backgroundColor: '#111111', border: `1px solid ${colorFor(TASK_STATUS_COLORS, task.status)}55`, color: colorFor(TASK_STATUS_COLORS, task.status) }}
      >
        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <span className="text-xs" style={{ color: pastDue ? '#EF4444' : '#888888' }}>
        {task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
      </span>
      {task.notes && (
        <div className="relative" onMouseEnter={() => setShowNotes(true)} onMouseLeave={() => setShowNotes(false)}>
          <StickyNote size={14} style={{ color: '#888888' }} />
          {showNotes && (
            <div
              className="absolute right-0 top-6 z-10 w-56 rounded-md p-2.5 text-xs shadow-lg"
              style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', color: '#F0F0F0' }}
            >
              {task.notes}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
