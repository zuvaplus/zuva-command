import { google } from 'googleapis'

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
}

export async function getGmailClient() {
  const { supabaseAdmin } = await import('./supabase')
  const { data } = await supabaseAdmin
    .from('command_gmail_tokens')
    .select('*')
    .single()

  if (!data) throw new Error('No Gmail tokens found. Please connect Gmail first.')

  const oauth2Client = getOAuthClient()
  oauth2Client.setCredentials({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expiry_date: data.expiry_date,
  })

  // Auto-refresh if expired
  oauth2Client.on('tokens', async (tokens) => {
    await supabaseAdmin.from('command_gmail_tokens').update({
      access_token: tokens.access_token || data.access_token,
      expiry_date: tokens.expiry_date || data.expiry_date,
      updated_at: new Date().toISOString(),
    }).eq('id', data.id)
  })

  return google.gmail({ version: 'v1', auth: oauth2Client })
}

export function buildEmailMessage(to: string, subject: string, body: string, from: string = 'zuvaplustv@gmail.com') {
  const message = [
    `From: Dexter Musarurwa <${from}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    '',
    body,
  ].join('\n')
  return Buffer.from(message).toString('base64url')
}
