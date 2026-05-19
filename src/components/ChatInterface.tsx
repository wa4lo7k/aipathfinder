'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, ArrowLeft, Bot, User, Sparkles } from 'lucide-react'

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
  const inputRef = useRef<HTMLInputElement>(null)

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
        const contentType = res.headers.get('content-type')
        if (contentType?.includes('text/event-stream')) {
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
          await loadMessages()
        }
      } else {
        alert('Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Error sending message')
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  if (loadingMessages) {
    return (
      <div className="chat-container">
        <div className="chat-header">
          <button onClick={onBack} className="chat-back-btn">
            <ArrowLeft size={20} />
          </button>
          <div className="chat-header-info">
            <div className="chat-ai-avatar"><Bot size={18} /></div>
            <div>
              <h3 className="chat-header-title">AI Career Assistant</h3>
              <span className="chat-header-status">Loading...</span>
            </div>
          </div>
        </div>
        <div className="chat-messages">
          <div className="chat-loading-state">
            <div className="dot-flashing"><span></span><span></span><span></span></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <button onClick={onBack} className="chat-back-btn">
          <ArrowLeft size={20} />
        </button>
        <div className="chat-header-info">
          <div className="chat-ai-avatar"><Bot size={18} /></div>
          <div>
            <h3 className="chat-header-title">AI Career Assistant</h3>
            <span className="chat-header-status">
              {loading ? (
                <>Thinking<span className="dot-flashing-inline"><span></span><span></span><span></span></span></>
              ) : (
                <>● Online</>
              )}
            </span>
          </div>
        </div>
        <div className="chat-header-badge">
          <Sparkles size={14} />
          <span>AI Powered</span>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-welcome">
            <div className="chat-welcome-icon">
              <Bot size={36} />
            </div>
            <h3>Hello! I'm your AI Career Assistant</h3>
            <p>Ask me about career paths, job search strategies, skill development, resume tips, or anything career-related!</p>
            <div className="chat-suggestions">
              <button onClick={() => { setInput('What career paths match my skills?'); }} className="chat-suggestion-chip">
                🎯 Career paths for my skills
              </button>
              <button onClick={() => { setInput('Help me improve my resume'); }} className="chat-suggestion-chip">
                📄 Resume improvement tips
              </button>
              <button onClick={() => { setInput('What skills should I learn next?'); }} className="chat-suggestion-chip">
                📚 Skills to learn next
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`chat-msg ${msg.role === 'user' ? 'chat-msg-user' : 'chat-msg-ai'}`}>
              <div className="chat-msg-avatar">
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className="chat-msg-content">
                <div className="chat-msg-bubble">
                  <div className="chat-msg-text">{msg.content}</div>
                </div>
                <div className="chat-msg-time">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="chat-msg chat-msg-ai">
            <div className="chat-msg-avatar"><Bot size={16} /></div>
            <div className="chat-msg-content">
              <div className="chat-msg-bubble chat-typing-bubble">
                <div className="dot-flashing"><span></span><span></span><span></span></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="chat-input-bar">
        <div className="chat-input-wrap">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={loading}
            className="chat-input"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="chat-send-btn"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  )
}
