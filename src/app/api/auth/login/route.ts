import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, constantTimeEqual, createSessionToken } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()
    const expected = process.env.COMMAND_PASSWORD

    // Without the env-var guard, an unset COMMAND_PASSWORD plus a request
    // with no password field would compare undefined === undefined and log in.
    if (!expected || typeof password !== 'string' || !constantTimeEqual(password, expected)) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    const response = NextResponse.json({ success: true })
    response.cookies.set(SESSION_COOKIE, await createSessionToken(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: '/',
    })
    return response
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
