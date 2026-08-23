import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import { colorFor, FUNDING_STATUS_COLORS } from '@/lib/badgeColors'
import ColorBadge from '@/components/ColorBadge'
import PriorityQueue from '@/components/PriorityQueue'
import DailyBriefing from '@/components/DailyBriefing'
import type { CommandTask, CommandFunding } from '@/lib/types'

// Every stat/table on this page reads live Supabase data at request time —
// force-dynamic so Next never tries to prerender it at build time (which
// would fail without real Supabase credentials configured).
export const dynamic = 'force-dynamic'

const PRIORITY_RANK: Record<string, number> = { Critical: 1, High: 2, Medium: 3, Low: 4 }

async function getStats() {
  const today = new Date().toISOString().slice(0, 10)
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [tasksRemaining, criticalTasks, followUpsDue, totalProspects, fundingApps, revenueRows, liveEvents] = await Promise.all([
    supabaseAdmin.from('command_tasks').select('*', { count: 'exact', head: true }).neq('status', 'Completed'),
    supabaseAdmin
      .from('command_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('priority', 'Critical')
      .neq('status', 'Completed'),
    supabaseAdmin.from('command_prospects').select('*', { count: 'exact', head: true }).lte('follow_up_due', today),
    supabaseAdmin.from('command_prospects').select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('command_funding')
      .select('*', { count: 'exact', head: true })
      .in('status', ['Submitted', 'Under Review']),
    supabaseAdmin
      .from('command_campaigns')
      .select('revenue_usd')
      .in('status', ['Active', 'Completed'])
      .gte('created_at', startOfMonth.toISOString()),
    supabaseAdmin.from('command_sports_events').select('*', { count: 'exact', head: true }).eq('status', 'Live'),
  ])

  const revenueThisMonth = (revenueRows.data ?? []).reduce((sum, r) => sum + Number(r.revenue_usd || 0), 0)

  return {
    tasksRemaining: tasksRemaining.count ?? 0,
    criticalTasks: criticalTasks.count ?? 0,
    followUpsDue: followUpsDue.count ?? 0,
    totalProspects: totalProspects.count ?? 0,
    fundingApps: fundingApps.count ?? 0,
    revenueThisMonth,
    liveEvents: liveEvents.count ?? 0,
  }
}

async function getPriorityQueue(): Promise<CommandTask[]> {
  const { data, error } = await supabaseAdmin
    .from('command_tasks')
    .select('*')
    .in('status', ['Not Started', 'In Progress'])

  if (error || !data) return []

  return [...data]
    .sort((a, b) => (PRIORITY_RANK[a.priority] ?? 5) - (PRIORITY_RANK[b.priority] ?? 5))
    .slice(0, 8)
}

async function getFunding(): Promise<CommandFunding[]> {
  const { data, error } = await supabaseAdmin
    .from('command_funding')
    .select('*')
    .order('created_at', { ascending: true })

  if (error || !data) return []
  return data
}

function StatCard({ label, value, accent, href }: { label: string; value: string | number; accent?: boolean; href?: string }) {
  const content = (
    <div className="rounded-xl p-5 transition-colors" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
      <p className="text-3xl font-extrabold" style={{ color: accent ? '#F37B0D' : '#F0F0F0' }}>
        {value}
      </p>
      <p className="mt-1 text-sm" style={{ color: '#888888' }}>
        {label}
      </p>
    </div>
  )
  if (href) {
    return <Link href={href} className="block hover:opacity-80">{content}</Link>
  }
  return content
}

function formatCurrency(amount: number | null) {
  if (amount === null) return '—'
  return `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 0 })}`
}

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function MorningBriefPage() {
  const [stats, priorityTasks, funding] = await Promise.all([getStats(), getPriorityQueue(), getFunding()])

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Morning Brief</h1>
        <p className="text-sm" style={{ color: '#888888' }}>
          Your operational snapshot for today.
        </p>
      </div>

      {/* Section A — Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tasks Remaining" value={stats.tasksRemaining} href="/projects" />
        <StatCard label="Critical Tasks" value={stats.criticalTasks} />
        <StatCard label="Follow-Ups Due" value={stats.followUpsDue} href="/crm?filter=due" />
        <StatCard label="Total Prospects" value={stats.totalProspects} />
        <StatCard label="Funding Apps" value={stats.fundingApps} />
        <StatCard label="Revenue This Month" value={`$${stats.revenueThisMonth.toLocaleString()}`} />
        <StatCard label="Live Events" value={stats.liveEvents} />
        <StatCard label="Launch Target" value="March 2027" accent />
      </div>

      {/* Section B — Priority queue */}
      <div>
        <h2 className="mb-3 text-lg font-bold text-white">Priority Queue</h2>
        <PriorityQueue initialTasks={priorityTasks} />
      </div>

      {/* Section C — AI daily briefing */}
      <DailyBriefing />

      {/* Section D — Funding pipeline */}
      <div>
        <h2 className="mb-3 text-lg font-bold text-white">Funding Pipeline</h2>
        <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid #2A2A2A' }}>
          <table className="w-full text-left text-sm">
            <thead>
              <tr style={{ backgroundColor: '#111111', color: '#888888' }}>
                <th className="px-4 py-3 font-medium">Program</th>
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Amount Requested</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Next Action</th>
                <th className="px-4 py-3 font-medium">Next Action Date</th>
              </tr>
            </thead>
            <tbody>
              {funding.map((row) => (
                <tr key={row.id} style={{ backgroundColor: '#1A1A1A', borderTop: '1px solid #2A2A2A' }}>
                  <td className="px-4 py-3 font-medium text-white">{row.program_name}</td>
                  <td className="px-4 py-3" style={{ color: '#F0F0F0' }}>{row.organization}</td>
                  <td className="px-4 py-3" style={{ color: '#F0F0F0' }}>{formatCurrency(row.amount_requested)}</td>
                  <td className="px-4 py-3">
                    <ColorBadge label={row.status} color={colorFor(FUNDING_STATUS_COLORS, row.status)} />
                  </td>
                  <td className="px-4 py-3" style={{ color: '#888888' }}>{row.next_action ?? '—'}</td>
                  <td className="px-4 py-3" style={{ color: '#888888' }}>{formatDate(row.next_action_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
