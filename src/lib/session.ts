// Signed session cookie: "<expiry ms>.<HMAC-SHA256 hex>", keyed off
// COMMAND_PASSWORD. Uses Web Crypto so it runs in both middleware and route
// handlers. Changing COMMAND_PASSWORD invalidates every existing session.

export const SESSION_COOKIE = 'zuva_command_session'
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

const encoder = new TextEncoder()

async function sign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(`zuva-command-session:${payload}`))
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('')
}

// Compares every character regardless of where the first mismatch is, so
// response timing doesn't leak how much of a guess was right.
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function createSessionToken(): Promise<string> {
  const secret = process.env.COMMAND_PASSWORD
  if (!secret) throw new Error('COMMAND_PASSWORD is not set')
  const expiry = String(Date.now() + SESSION_MAX_AGE_SECONDS * 1000)
  return `${expiry}.${await sign(expiry, secret)}`
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  const secret = process.env.COMMAND_PASSWORD
  if (!secret || !token) return false

  const [expiry, sig] = token.split('.')
  if (!expiry || !sig || !/^\d+$/.test(expiry)) return false
  if (Number(expiry) < Date.now()) return false

  return constantTimeEqual(sig, await sign(expiry, secret))
}
