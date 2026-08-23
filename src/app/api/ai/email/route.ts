import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase'
import { ZUVA_SYSTEM_PROMPT } from '@/lib/zuva-system-prompt'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const EMAIL_TYPE_GUIDANCE = `Email type descriptions:
- cold: First cold outreach. Warm, direct, culturally intelligent. 150-220 words. Lead with Zuva's specific audience match for their brand.
- follow1: First follow-up, 5 days after initial, no response. Add a new angle, stat, or insight. Never just "checking in."
- follow2: Second follow-up, 10 days after initial. Short, creates mild urgency. Reference their audience specifically.
- nurture: For a warm lead who responded but hasn't committed. Address objections, offer a pilot campaign idea or specific package recommendation.

Format your response EXACTLY as:
SUBJECT: [subject line here]
BODY:
[email body here]

Sender: Dexter Musarurwa, Founder & CEO, Zuva Media (zuva.tv)`

interface ProspectInput {
  company: string
  contact?: string | null
  email: string
  industry?: string | null
  market?: string | null
  size?: string | null
  website?: string | null
  notes?: string | null
  emails_sent?: number
  stage?: string | null
}

function parseEmailResponse(text: string): { subject: string; body: string } {
  const subjectMatch = text.match(/SUBJECT:\s*(.+)/)
  const bodyMatch = text.match(/BODY:\s*([\s\S]*)/)
  return {
    subject: subjectMatch ? subjectMatch[1].trim() : 'Follow up from Zuva Media',
    body: bodyMatch ? bodyMatch[1].trim() : text.trim(),
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prospect, email_type, prospect_id } = (await request.json()) as {
      prospect: ProspectInput
      email_type: 'cold' | 'follow1' | 'follow2' | 'nurture'
      prospect_id?: string | null
    }

    if (!prospect || !email_type) {
      return NextResponse.json({ error: 'prospect and email_type are required' }, { status: 400 })
    }

    const userMessage = `Write a ${email_type} email for this advertiser prospect:
Company: ${prospect.company}
Contact: ${prospect.contact ?? 'Unknown'}
Email: ${prospect.email}
Industry: ${prospect.industry ?? 'Unknown'}
Market (who they serve): ${prospect.market ?? 'Unknown'}
Company size: ${prospect.size ?? 'Unknown'}
Website: ${prospect.website ?? 'Unknown'}
Notes: ${prospect.notes ?? 'None'}
Emails already sent: ${prospect.emails_sent ?? 0}
Current pipeline stage: ${prospect.stage ?? 'New Lead'}

${EMAIL_TYPE_GUIDANCE}`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: ZUVA_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    const textBlock = response.content.find((block) => block.type === 'text')
    const rawText = textBlock && textBlock.type === 'text' ? textBlock.text : ''
    const { subject, body } = parseEmailResponse(rawText)

    const { data: emailRow, error: insertError } = await supabaseAdmin
      .from('command_emails')
      .insert({
        prospect_id: prospect_id ?? null,
        email_type,
        subject,
        body,
        sent_at: null,
      })
      .select()
      .single()
    if (insertError) throw insertError

    if (prospect_id) {
      await supabaseAdmin.from('command_prospect_activity').insert({
        prospect_id,
        activity_type: 'email_generated',
        description: `Generated a ${email_type} email draft`,
        metadata: { email_type, subject },
      })
    }

    return NextResponse.json({ subject, body, email_id: emailRow.id })
  } catch (error) {
    console.error('AI email generation error:', error)
    return NextResponse.json({ error: 'Could not generate the email' }, { status: 500 })
  }
}
