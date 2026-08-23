'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import TaskRow from './TaskRow'
import AddTaskModal from './AddTaskModal'
import type { CommandTask } from '@/lib/types'

export default function TaskGroup({
  tab,
  tasks,
  allTabs,
  showTabBadge,
  onStatusChange,
  onCreated,
}: {
  tab: string
  tasks: CommandTask[]
  allTabs: string[]
  showTabBadge: boolean
  onStatusChange: (id: string, status: string) => void
  onCreated: (task: CommandTask) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const completed = tasks.filter((t) => t.status === 'Completed').length
  const pct = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0

  return (
    <div className="rounded-xl" style={{ border: '1px solid #2A2A2A', backgroundColor: '#1A1A1A' }}>
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => setCollapsed((v) => !v)} className="flex flex-1 items-center gap-2 text-left">
          <ChevronDown size={16} className="transition-transform" style={{ color: '#888888', transform: collapsed ? 'rotate(-90deg)' : 'none' }} />
          <span className="font-bold text-white">{tab}</span>
          <span className="text-xs" style={{ color: '#888888' }}>{completed}/{tasks.length} complete</span>
        </button>
        <div className="h-1.5 w-32 overflow-hidden rounded-full" style={{ backgroundColor: '#111111' }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: '#F37B0D' }} />
        </div>
        <AddTaskModal tabs={allTabs} defaultTab={tab} onCreated={onCreated} />
      </div>
      {!collapsed && (
        <div>
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} showTabBadge={showTabBadge} onStatusChange={onStatusChange} />
          ))}
        </div>
      )}
    </div>
  )
}
