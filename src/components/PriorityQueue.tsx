'use client'

import { useState } from 'react'
import { colorFor, PRIORITY_COLORS, TASK_STATUS_COLORS } from '@/lib/badgeColors'
import ColorBadge from './ColorBadge'
import type { CommandTask } from '@/lib/types'

const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Completed']

export default function PriorityQueue({ initialTasks }: { initialTasks: CommandTask[] }) {
  const [tasks, setTasks] = useState(initialTasks)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  async function handleStatusChange(id: string, status: string) {
    setUpdatingId(id)
    const previous = tasks
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('update failed')
    } catch {
      setTasks(previous)
    } finally {
      setUpdatingId(null)
    }
  }

  if (tasks.length === 0) {
    return <p className="text-sm" style={{ color: '#888888' }}>No open tasks in the priority queue.</p>
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="flex flex-wrap items-center gap-3 rounded-lg px-4 py-3"
          style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A' }}
        >
          <ColorBadge label={task.tab} color="#F37B0D" />
          <p className="flex-1 min-w-[200px] text-sm" style={{ color: '#F0F0F0' }}>
            {task.task}
          </p>
          <ColorBadge label={task.priority} color={colorFor(PRIORITY_COLORS, task.priority)} />
          <ColorBadge label={task.status} color={colorFor(TASK_STATUS_COLORS, task.status)} />
          <select
            value={task.status}
            disabled={updatingId === task.id}
            onChange={(e) => handleStatusChange(task.id, e.target.value)}
            className="rounded-md px-2 py-1 text-xs"
            style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', color: '#F0F0F0' }}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  )
}
