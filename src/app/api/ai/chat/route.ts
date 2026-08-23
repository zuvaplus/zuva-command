import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase'
import { ZUVA_SYSTEM_PROMPT } from '@/lib/systemPrompt'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Not explicitly listed in the original spec's API route list, but the
// Assistant page's "load last 20 messages on mount" requirement (Step 7)
// has nowhere else to fetch that from — supabaseAdmin can only be called
// server-side, never from the "use client" chat page directly.
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('session_id')
    if (!sessionId) {
      return NextResponse.json({ error: 'session_id is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('command_ai_conversations')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error

    return NextResponse.json({ messages: (data ?? []).reverse() })
  } catch (error) {
    console.error('AI chat history error:', error)
    return NextResponse.json({ error: 'Could not load conversation history' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, session_id, history } = (await request.json()) as {
      message: string
      session_id: string
      history: ChatMessage[]
    }

    if (!message || !session_id) {
      return NextResponse.json({ error: 'message and session_id are required' }, { status: 400 })
    }

    const { error: insertUserError } = await supabaseAdmin.from('command_ai_conversations').insert({
      session_id,
      role: 'user',
      content: message,
    })
    if (insertUserError) throw insertUserError

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: ZUVA_SYSTEM_PROMPT,
      messages: [...(history ?? []), { role: 'user', content: message }],
    })

    const textBlock = response.content.find((block) => block.type === 'text')
    const assistantMessage = textBlock && textBlock.type === 'text' ? textBlock.text : ''

    const { error: insertAssistantError } = await supabaseAdmin.from('command_ai_conversations').insert({
      session_id,
      role: 'assistant',
      content: assistantMessage,
    })
    if (insertAssistantError) throw insertAssistantError

    return NextResponse.json({ response: assistantMessage })
  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json({ error: 'Could not get a response from the assistant' }, { status: 500 })
  }
}
