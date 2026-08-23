'use client'

import { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SESSION_KEY = 'zuva_command_ai_session_id'

function getOrCreateSessionId(): string {
  let sessionId = sessionStorage.getItem(SESSION_KEY)
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    sessionStorage.setItem(SESSION_KEY, sessionId)
  }
  return sessionId
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-bounce rounded-full"
          style={{ backgroundColor: '#888888', animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )
}

export default function AssistantPage() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const id = getOrCreateSessionId()
    setSessionId(id)
    ;(async () => {
      try {
        const res = await fetch(`/api/ai/chat?session_id=${id}`)
        const data = await res.json()
        if (res.ok && Array.isArray(data.messages)) {
          setMessages(data.messages.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })))
        }
      } finally {
        setHistoryLoaded(true)
      }
    })()
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  function handleNewConversation() {
    const id = crypto.randomUUID()
    sessionStorage.setItem(SESSION_KEY, id)
    setSessionId(id)
    setMessages([])
  }

  async function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || loading || !sessionId) return

    const nextMessages: Message[] = [...messages, { role: 'user', content: trimmed }]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          session_id: sessionId,
          history: messages,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not get a response')
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: err instanceof Error ? err.message : 'Something went wrong.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <div
        className="flex items-center justify-between px-8 py-5"
        style={{ borderBottom: '1px solid #2A2A2A' }}
      >
        <h1 className="text-xl font-bold text-white">AI Assistant</h1>
        <Button
          onClick={handleNewConversation}
          variant="outline"
          size="sm"
          className="border-[#2A2A2A] text-[#F0F0F0] hover:bg-[#1A1A1A]"
        >
          New Conversation
        </Button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-8 py-6">
        {historyLoaded && messages.length === 0 && (
          <p className="text-sm" style={{ color: '#888888' }}>
            Ask about Zuva strategy, draft an outreach email, or get a Claude Code prompt written for you.
          </p>
        )}
        {messages.map((message, i) => (
          <div key={i} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[70%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed"
              style={
                message.role === 'user'
                  ? { backgroundColor: '#F37B0D', color: '#0A0A0A' }
                  : { backgroundColor: '#1A1A1A', color: '#F0F0F0', border: '1px solid #2A2A2A' }
              }
            >
              {message.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-2" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
              <TypingDots />
            </div>
          </div>
        )}
      </div>

      <div className="px-8 py-5" style={{ borderTop: '1px solid #2A2A2A' }}>
        <div className="flex items-end gap-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message the assistant…"
            rows={1}
            className="max-h-40 min-h-[44px] flex-1 resize-none border-[#2A2A2A] bg-[#111111] text-white placeholder:text-[#888888]"
          />
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="font-bold text-black hover:opacity-90"
            style={{ backgroundColor: '#F37B0D' }}
          >
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  )
}
