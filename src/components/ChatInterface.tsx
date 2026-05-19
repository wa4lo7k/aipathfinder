'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Loader2, ArrowLeft } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

interface ChatInterfaceProps {
  conversationId: string
  onBack: () => void
}

export default function ChatInterface({ conversationId, onBack }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadMessages()
  }, [conversationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadMessages = async () => {
    try {
      setLoadingMessages(true)
      const res = await fetch(`/api/conversations/${conversationId}/messages`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.data || [])
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoadingMessages(false)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setLoading(true)

    // Add user message optimistically
    const tempUserMsg: Message = {
      id: 'temp-' + Date.now(),
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, tempUserMsg])

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      })

      if (res.ok) {
        // Check if it's a streaming response
        const contentType = res.headers.get('content-type')
        if (contentType?.includes('text/event-stream')) {
          // Handle streaming response
          const reader = res.body?.getReader()
          const decoder = new TextDecoder()
          let assistantMessage = ''

          if (reader) {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              const chunk = decoder.decode(value)
              const lines = chunk.split('\n')

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6)
                  if (data === '[DONE]') break
                  try {
                    const parsed = JSON.parse(data)
                    if (parsed.content) {
                      assistantMessage += parsed.content
                      setMessages(prev => {
                        const newMessages = [...prev]
                        const lastMsg = newMessages[newMessages.length - 1]
                        if (lastMsg && lastMsg.role === 'assistant') {
                          lastMsg.content = assistantMessage
                        } else {
                          newMessages.push({
                            id: 'temp-assistant-' + Date.now(),
                            role: 'assistant',
                            content: assistantMessage,
                            created_at: new Date().toISOString()
                          })
                        }
                        return newMessages
                      })
                    }
                  } catch (e) {
                    // Ignore parse errors
                  }
                }
              }
            }
          }
        } else {
          // Handle regular JSON response
          const data = await res.json()
          await loadMessages() // Reload all messages
        }
      } else {
        alert('Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Error sending message')
    } finally {
      setLoading(false)
    }
  }

  if (loadingMessages) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <Loader2 className="animate-spin" size={32} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '600px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text)' }}>
          <ArrowLeft size={20} />
        </button>
        <h3 style={{ margin: 0 }}>AI Career Assistant</h3>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px' }}>
            <p>Start a conversation with your AI career assistant!</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>Ask about career paths, job search tips, or skill development.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                padding: '12px 16px',
                borderRadius: '12px',
                background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg)',
                color: msg.role === 'user' ? 'white' : 'var(--text)',
              }}
            >
              <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.content}</div>
              <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.7 }}>
                {new Date(msg.created_at).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div style={{ alignSelf: 'flex-start', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg)' }}>
            <Loader2 className="animate-spin" size={16} />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} style={{ padding: '16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '12px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={loading}
          style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)' }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            background: 'var(--accent)',
            color: 'white',
            border: 'none',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            opacity: loading || !input.trim() ? 0.5 : 1
          }}
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          Send
        </button>
      </form>
    </div>
  )
}
