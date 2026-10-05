import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase'
import { ZUVA_SYSTEM_PROMPT } from '@/lib/zuva-system-prompt'
import { DM_TYPES, DM_VARIANTS, isBoostCategory, type DmType, type DmVariant } from '@/lib/creators'
import { buildCreatorDmPrompt, dmRuleViolations } from '@/lib/creatorDm'
import { hasLivePayoutRoute } from '@/lib/payoutRoutes'
import { errorMessage } from '@/lib/creatorInput'
import type { CommandCreator } from '@/lib/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const { creator_id, variant, dm_type } = (await request.json()) as {
      creator_id?: string
      variant?: DmVariant
      dm_type?: DmType
    }
    if (!creator_id || !variant || !dm_type) {
      return NextResponse.json({ error: 'creator_id, variant and dm_type are required' }, { status: 400 })
    }
    if (!DM_VARIANTS.some((v) => v.value === variant) || !DM_TYPES.some((t) => t.value === dm_type)) {
      return NextResponse.json({ error: 'Unknown variant or message type' }, { status: 400 })
    }

    const { data: creator, error } = await supabaseAdmin.from('command_creators').select('*').eq('id', creator_id).single()
    if (error || !creator) return NextResponse.json({ error: 'Creator not found' }, { status: 404 })

    const ctx = { boost: isBoostCategory(creator.content_category), payoutLive: hasLivePayoutRoute(creator.country) }
    let issues: string[] = []
    let message = ''
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 400,
        system: ZUVA_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildCreatorDmPrompt(creator as CommandCreator, variant, dm_type, issues) }],
      })
      const textBlock = response.content.find((block) => block.type === 'text')
      message = (textBlock && textBlock.type === 'text' ? textBlock.text : '').trim().replace(/^["“]|["”]$/g, '')
      issues = dmRuleViolations(message, dm_type, ctx)
      if (issues.length === 0) break
    }

    // After one retry, still show the draft but with the problems listed,
    // so it's edited before sending rather than silently passed off as fine.
    return NextResponse.json({ message, warnings: issues })
  } catch (error) {
    console.error('Creator DM generation error:', error)
    return NextResponse.json({ error: `Could not generate the DM: ${errorMessage(error)}` }, { status: 500 })
  }
}
