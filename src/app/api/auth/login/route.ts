import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE = 'zuva_command_session'
const VALID_SESSION_VALUE = 'zuva_command_session_valid'
const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (password !== process.env.COMMAND_PASSWORD) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    const response = NextResponse.json({ success: true })
    response.cookies.set(SESSION_COOKIE, VALID_SESSION_VALUE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: THIRTY_DAYS_SECONDS,
      path: '/',
    })
    return response
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
