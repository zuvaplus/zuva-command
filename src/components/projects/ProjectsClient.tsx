'use client'

import { useMemo, useState } from 'react'
import TaskGroup from './TaskGroup'
import TaskRow from './TaskRow'
import AddTaskModal from './AddTaskModal'
import ImportTasksModal from './ImportTasksModal'
import type { CommandTask } from '@/lib/types'

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
      <p className="text-2xl font-extrabold" style={{ color: '#F0F0F0' }}>{value}</p>
      <p className="mt-1 text-xs" style={{ color: '#888888' }}>{label}</p>
    </div>
  )
}

export default function ProjectsClient({ initialTasks }: { initialTasks: CommandTask[] }) {
  const [tasks, setTasks] = useState(initialTasks)
  const [activeTab, setActiveTab] = useState('All')

  const allTabs = useMemo(() => Array.from(new Set(tasks.map((t) => t.tab))).sort(), [tasks])

  const stats = useMemo(() => ({
    total: tasks.length,
    completed: tasks.filter((t) => t.status === 'Completed').length,
    inProgress: tasks.filter((t) => t.status === 'In Progress').length,
    notStarted: tasks.filter((t) => t.status === 'Not Started').length,
    blocked: tasks.filter((t) => t.status === 'Blocked').length,
    criticalRemaining: tasks.filter((t) => t.priority === 'Critical' && t.status !== 'Completed').length,
  }), [tasks])

  async function handleStatusChange(id: string, status: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
    await fetch(`/api/projects/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
  }

  function handleCreated(task: CommandTask) {
    setTasks((prev) => [...prev, task])
  }

  async function refreshFromServer() {
    const res = await fetch('/api/projects/tasks')
    const data = await res.json()
    if (res.ok) setTasks(data.tasks)
  }

  const visibleTasks = activeTab === 'All' ? tasks : tasks.filter((t) => t.tab === activeTab)

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Project Command</h1>
          <p className="text-sm" style={{ color: '#888888' }}>The live Dev Tracker.</p>
        </div>
        <div className="flex gap-2">
          <ImportTasksModal onImported={refreshFromServer} />
          <AddTaskModal tabs={allTabs.length > 0 ? allTabs : ['General']} onCreated={handleCreated} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Tasks" value={stats.total} />
        <StatCard label="Completed" value={stats.completed} />
        <StatCard label="In Progress" value={stats.inProgress} />
        <StatCard label="Not Started" value={stats.notStarted} />
        <StatCard label="Blocked" value={stats.blocked} />
        <StatCard label="Critical Remaining" value={stats.criticalRemaining} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setActiveTab('All')}
          className="rounded-full px-3 py-1.5 text-xs font-semibold"
          style={activeTab === 'All' ? { backgroundColor: '#F37B0D', color: '#000' } : { backgroundColor: '#111111', color: '#888888', border: '1px solid #2A2A2A' }}
        >
          All ({tasks.length})
        </button>
        {allTabs.map((tab) => {
          const count = tasks.filter((t) => t.tab === tab).length
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="rounded-full px-3 py-1.5 text-xs font-semibold"
              style={activeTab === tab ? { backgroundColor: '#F37B0D', color: '#000' } : { backgroundColor: '#111111', color: '#888888', border: '1px solid #2A2A2A' }}
            >
              {tab} ({count})
            </button>
          )
        })}
      </div>

      {tasks.length === 0 ? (
        <p className="text-sm" style={{ color: '#888888' }}>No tasks yet — add one or sync from your Dev Tracker export.</p>
      ) : activeTab === 'All' ? (
        <div className="space-y-3">
          {allTabs.map((tab) => (
            <TaskGroup
              key={tab}
              tab={tab}
              tasks={tasks.filter((t) => t.tab === tab)}
              allTabs={allTabs}
              showTabBadge={false}
              onStatusChange={handleStatusChange}
              onCreated={handleCreated}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl" style={{ border: '1px solid #2A2A2A', backgroundColor: '#1A1A1A' }}>
          {visibleTasks.map((task) => (
            <TaskRow key={task.id} task={task} showTabBadge={false} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}
    </div>
  )
}
