'use client'

import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        window.location.href = '/'
      } else {
        setError('Incorrect password')
        setLoading(false)
      }
    } catch {
      setError('Incorrect password')
      setLoading(false)
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundColor: '#0A0A0A' }}
    >
      <div className="w-full max-w-sm text-center">
        <div className="mb-2 text-6xl">☀</div>
        <h1 className="mb-1 text-2xl font-bold tracking-wide text-white">
          ZUVA COMMAND CENTER
        </h1>
        <p className="mb-8 text-sm font-medium" style={{ color: '#F37B0D' }}>
          Founder Operations Dashboard
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            className="border-[#2A2A2A] bg-[#111111] text-white placeholder:text-[#888888]"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button
            type="submit"
            disabled={loading || !password}
            className="w-full font-bold text-black hover:opacity-90"
            style={{ backgroundColor: '#F37B0D' }}
          >
            {loading ? 'Checking…' : 'Enter Command Center'}
          </Button>
        </form>
      </div>
    </div>
  )
}
