import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Send, User, Bot, Loader2, RotateCcw } from 'lucide-react'
import { useAIAgentStore } from '@/stores/aiAgentStore'
import { agentsAPI } from '@/services/api'
import type { ConversationMessage } from '@/services/api'
import { GlassCard } from '@/components/ui'

interface AgentInfo {
  id: string
  name: string
  description: string
}

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api/v1'

export default function AgentsPage() {
  const { messages, isLoading, addMessage, clearMessages, setIsLoading, currentAgent, setCurrentAgent } = useAIAgentStore()
  const [agents, setAgents] = useState<AgentInfo[]>([])
  const [agentsLoading, setAgentsLoading] = useState(true)
  const [inputValue, setInputValue] = useState('')
  const [streamingContent, setStreamingContent] = useState('')
  const [showAgentList, setShowAgentList] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Fetch agents from API
  useEffect(() => {
    async function fetchAgents() {
      try {
        setAgentsLoading(true)
        const res = await agentsAPI.list()
        const data = res.data as { agents: AgentInfo[] }
        setAgents(data.agents || [])
      } catch {
        setAgents([])
      } finally {
        setAgentsLoading(false)
      }
    }
    fetchAgents()
  }, [])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return

    const userContent = inputValue.trim()
    const userMsg = { role: 'user' as const, content: userContent, timestamp: new Date() }
    addMessage(userMsg)
    setInputValue('')
    setIsLoading(true)
    setStreamingContent('')

    const history: ConversationMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }))

    const abortController = new AbortController()
    abortRef.current = abortController

    try {
      const response = await fetch(`${API_BASE}/agents/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortController.signal,
        body: JSON.stringify({
          message: userContent,
          agent_type: currentAgent,
          conversation_history: history,
        }),
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const contentType = response.headers.get('content-type') || ''
      const isSSE = contentType.includes('text/event-stream') || response.body !== null

      if (isSSE && response.body) {
        // SSE streaming
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let fullContent = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim()
              if (data === '[DONE]') break
              try {
                const parsed = JSON.parse(data)
                const token = parsed.content || parsed.response || parsed.delta || ''
                fullContent += token
                setStreamingContent(fullContent)
              } catch {
                // If not JSON, treat as plain text
                fullContent += data
                setStreamingContent(fullContent)
              }
            }
          }
        }

        addMessage({ role: 'assistant', content: fullContent, timestamp: new Date() })
      } else {
        // Regular JSON response
        const data = await response.json()
        addMessage({
          role: 'assistant',
          content: data.response || data.content || 'عذراً، تعذر الحصول على رد.',
          timestamp: new Date(),
        })
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      addMessage({
        role: 'assistant',
        content: 'عذراً، حدث خطأ في الاتصال. تأكد أن الخادم يعمل.',
        timestamp: new Date(),
      })
    } finally {
      setIsLoading(false)
      setStreamingContent('')
      abortRef.current = null
    }
  }, [inputValue, isLoading, currentAgent, messages, addMessage, setIsLoading])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
      <div className={`lg:col-span-1 ${showAgentList ? 'block' : 'hidden lg:block'}`}>
        <GlassCard className="h-full">
          <h3 className="font-bold text-masar-text mb-4 flex items-center gap-2">
            <Brain size={20} className="text-masar-cyan" /> الوكلاء المتاحة
          </h3>
          <div className="space-y-2">
            {agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => setCurrentAgent(agent.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                  currentAgent === agent.id ? 'bg-masar-cyan/10 border border-masar-cyan/20' : 'hover:bg-masar-surface/50 border border-transparent'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-masar-surface flex items-center justify-center">
                  <Brain size={20} className="text-masar-cyan" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-masar-text">{agent.name}</p>
                  <p className="text-xs text-masar-text-muted">{agent.description}</p>
                </div>
              </button>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Chat Area */}
      <div className="lg:col-span-3 h-full flex flex-col">
        <div className="card flex-1 flex flex-col min-h-0">
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b border-masar-border shrink-0">
            <div className="flex items-center gap-3">
              <Brain size={20} className="text-masar-cyan" />
              <h3 className="font-bold text-masar-text">
                {agents.find((a) => a.id === currentAgent)?.name || 'المساعد الذكي'}
              </h3>
            </div>
            <button
              onClick={clearMessages}
              className="p-2 rounded-lg text-masar-text-muted hover:text-masar-cyan transition-colors"
              title="مسح المحادثة"
            >
              <RotateCcw size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollbarWidth: 'thin' }}>
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-masar-blue/20 text-masar-text border border-masar-blue/20' : 'bg-masar-surface text-masar-text-muted border border-masar-border/50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {msg.role === 'assistant' ? <Bot size={16} className="text-masar-cyan" /> : <User size={16} className="text-masar-blue" />}
                      <span className="text-xs text-masar-text-dark">
                        {new Date(msg.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {currentStream && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-masar-surface border border-masar-border/50 p-4 rounded-2xl">
                  <div className="flex items-center gap-2 text-masar-text-muted text-xs">
                    <div className="w-4 h-4 rounded-full border-2 border-masar-cyan border-t-transparent animate-spin" />
                    {streamingContent}
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-masar-border shrink-0">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="اكتب رسالتك..."
                className="flex-1 px-4 py-3 rounded-xl bg-masar-bg/50 border border-masar-border/50 text-masar-text focus:outline-none focus:border-masar-cyan/50"
                dir="rtl"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !inputValue.trim()}
                className="btn-primary p-3 rounded-xl disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
