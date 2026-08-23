import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { getOAuthClient } from '@/lib/gmail'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin
  const code = request.nextUrl.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${appUrl}/crm?gmail_error=missing_code`)
  }

  try {
    const oauth2Client = getOAuthClient()
    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
      // A missing refresh_token usually means the user had already granted
      // consent before and Google didn't re-issue one — prompt=consent on
      // the initiate route (src/app/api/auth/gmail/route.ts) is what
      // guards against this, but the check stays here too as a hard stop
      // rather than silently saving an incomplete row.
      throw new Error('Google did not return a complete token set (missing refresh_token)')
    }

    oauth2Client.setCredentials(tokens)
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const { data: userInfo } = await oauth2.userinfo.get()

    // Only one row ever — clear any previous connection before inserting,
    // since there's no natural unique key to upsert on.
    await supabaseAdmin.from('command_gmail_tokens').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    const { error } = await supabaseAdmin.from('command_gmail_tokens').insert({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
      email: userInfo.email ?? 'unknown',
    })
    if (error) throw error

    return NextResponse.redirect(`${appUrl}/crm?connected=true`)
  } catch (error) {
    console.error('Gmail OAuth callback error:', error)
    return NextResponse.redirect(`${appUrl}/crm?gmail_error=true`)
  }
}
