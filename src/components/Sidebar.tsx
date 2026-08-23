'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  MessageSquare,
  Users,
  TrendingUp,
  CheckSquare,
  Trophy,
  DollarSign,
  LogOut,
  type LucideIcon,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon | 'sun'
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Morning Brief', icon: 'sun' },
  { href: '/assistant', label: 'AI Assistant', icon: MessageSquare },
  { href: '/crm', label: 'Advertiser CRM', icon: Users },
  { href: '/revenue', label: 'Revenue', icon: TrendingUp },
  { href: '/projects', label: 'Project Command', icon: CheckSquare },
  { href: '/sports', label: 'Zuva Sports', icon: Trophy },
  { href: '/funding', label: 'Funding', icon: DollarSign },
]

function formatDateTime(date: Date) {
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <aside
      className="flex h-screen w-[240px] shrink-0 flex-col"
      style={{ backgroundColor: '#111111', borderRight: '1px solid #2A2A2A' }}
    >
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2 text-xl font-bold">
          <span>☀</span>
          <span className="text-white">ZUVA</span>
          <span style={{ color: '#F37B0D' }}>COMMAND</span>
        </div>
        <p className="mt-1 text-[11px] font-medium uppercase tracking-wider" style={{ color: '#888888' }}>
          Command Center
        </p>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors"
              style={
                active
                  ? { backgroundColor: '#F37B0D', color: '#000000' }
                  : { color: '#888888' }
              }
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.backgroundColor = '#1A1A1A'
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              {item.icon === 'sun' ? (
                <span className="w-[18px] text-center">☀</span>
              ) : (
                <item.icon size={18} />
              )}
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="space-y-3 px-3 pb-5 pt-3" style={{ borderTop: '1px solid #2A2A2A' }}>
        <p className="px-3 text-xs tabular-nums" style={{ color: '#888888' }}>
          {now ? formatDateTime(now) : ''}
        </p>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-[#1A1A1A]"
          style={{ color: '#888888' }}
        >
          <LogOut size={18} />
          Log Out
        </button>
      </div>
    </aside>
  )
}
