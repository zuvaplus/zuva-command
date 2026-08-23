import { supabaseAdmin } from '@/lib/supabase'
import { colorFor, FUNDING_STATUS_COLORS } from '@/lib/badgeColors'
import ColorBadge from '@/components/ColorBadge'
import AddFundingModal from '@/components/AddFundingModal'
import type { CommandFunding } from '@/lib/types'

export const dynamic = 'force-dynamic'

async function getFunding(): Promise<CommandFunding[]> {
  const { data, error } = await supabaseAdmin
    .from('command_funding')
    .select('*')
    .order('created_at', { ascending: true })

  if (error || !data) return []
  return data
}

function formatCurrency(amount: number | null) {
  if (amount === null) return '—'
  return `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 0 })}`
}

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function FundingPage() {
  const funding = await getFunding()

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Funding</h1>
          <p className="text-sm" style={{ color: '#888888' }}>
            Grants, loans, and financing applications.
          </p>
        </div>
        <AddFundingModal />
      </div>

      <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid #2A2A2A' }}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr style={{ backgroundColor: '#111111', color: '#888888' }}>
              <th className="px-4 py-3 font-medium">Program</th>
              <th className="px-4 py-3 font-medium">Organization</th>
              <th className="px-4 py-3 font-medium">Amount Requested</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Next Action</th>
              <th className="px-4 py-3 font-medium">Next Action Due</th>
            </tr>
          </thead>
          <tbody>
            {funding.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center" style={{ color: '#888888' }}>
                  No funding applications yet.
                </td>
              </tr>
            )}
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
  )
}
