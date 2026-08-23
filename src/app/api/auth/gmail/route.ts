import { NextResponse } from 'next/server'
import { getOAuthClient } from '@/lib/gmail'

// gmail.send/gmail.readonly are the two scopes the task asked for; userinfo.email
// is an addition — command_gmail_tokens.email is NOT NULL, and neither Gmail
// scope on its own reveals which address was connected. Needed for the
// callback below to actually populate that column.
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
]

// Initiates the Gmail OAuth flow — redirects to Google's consent screen.
export async function GET() {
  const oauth2Client = getOAuthClient()
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // required to receive a refresh_token
    prompt: 'consent', // forces a refresh_token on every connect, not just the first
    scope: SCOPES,
  })
  return NextResponse.redirect(authUrl)
}
