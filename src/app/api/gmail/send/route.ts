import { NextRequest, NextResponse } from 'next/server'
import { getGmailClient, buildEmailMessage } from '@/lib/gmail'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { to, subject, body, prospect_id, email_type } = (await request.json()) as {
      to: string
      subject: string
      body: string
      prospect_id: string
      email_type: string
    }

    if (!to || !subject || !body || !prospect_id) {
      return NextResponse.json({ error: 'to, subject, body, and prospect_id are required' }, { status: 400 })
    }

    let gmail
    try {
      gmail = await getGmailClient()
    } catch {
      return NextResponse.json(
        { error: 'Gmail is not connected yet. Connect Gmail from the CRM page to send.' },
        { status: 409 }
      )
    }

    const raw = buildEmailMessage(to, subject, body)
    const sendResult = await gmail.users.messages.send({ userId: 'me', requestBody: { raw } })

    const nowIso = new Date().toISOString()
    const today = nowIso.slice(0, 10)

    const { error: emailInsertError } = await supabaseAdmin.from('command_emails').insert({
      prospect_id,
      email_type: email_type ?? 'unknown',
      subject,
      body,
      sent_at: nowIso,
    })
    if (emailInsertError) throw emailInsertError

    const { data: prospect, error: prospectFetchError } = await supabaseAdmin
      .from('command_prospects')
      .select('emails_sent, stage')
      .eq('id', prospect_id)
      .single()
    if (prospectFetchError) throw prospectFetchError

    const followUpDue = new Date()
    followUpDue.setDate(followUpDue.getDate() + 5)

    const { error: prospectUpdateError } = await supabaseAdmin
      .from('command_prospects')
      .update({
        emails_sent: (prospect?.emails_sent ?? 0) + 1,
        last_contact: today,
        stage: prospect?.stage === 'New Lead' ? 'Contacted' : prospect?.stage,
        follow_up_due: followUpDue.toISOString().slice(0, 10),
        updated_at: nowIso,
      })
      .eq('id', prospect_id)
    if (prospectUpdateError) throw prospectUpdateError

    const { error: activityError } = await supabaseAdmin.from('command_prospect_activity').insert({
      prospect_id,
      activity_type: 'email_sent',
      description: `Sent "${subject}" (${email_type ?? 'unknown'} email)`,
      metadata: { email_type, subject },
    })
    if (activityError) throw activityError

    return NextResponse.json({ success: true, message_id: sendResult.data.id })
  } catch (error) {
    console.error('Gmail send error:', error)
    return NextResponse.json({ error: 'Could not send email via Gmail' }, { status: 500 })
  }
}
