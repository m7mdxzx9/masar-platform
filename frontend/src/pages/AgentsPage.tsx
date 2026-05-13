import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Send, User, Bot, MessageSquare, Code2, BookOpen, Lightbulb } from 'lucide-react'
import { useAIAgentStore } from '@/stores/aiAgentStore'
import { Button } from '@/components/ui'
import { GlassCard } from '@/components/ui/Card'
import { useTypewriter } from '@/hooks/useTypewriter'

const agents = [
  { id: 'math_tutor', name: 'المعلم الرياضيات', icon: BookOpen, description: 'الجبر الخطي والاحتمالات' },
  { id: 'python_tutor', name: 'معلم Python', icon: Code2, description: 'برمجة الذكاء الاصطناعي' },
  { id: 'ml_theory', name: 'أستاذ التعلم الآلي', icon: MessageSquare, description: 'نظرية ML' },
  { id: 'interview_analyzer', name: 'محلل المقابلات', icon: Brain, description: 'تقييم الأداء البرمجي' },
  { id: 'project_generator', name: 'مولد الأفكار', icon: Lightbulb, description: 'مقترحات مشاريع مبتكرة' },
]

export default function AgentsPage() {
  const { messages, isLoading, addMessage, setIsLoading, currentAgent, setCurrentAgent } = useAIAgentStore()
  const [inputValue, setInputValue] = useState('')
  const [showAgentList, setShowAgentList] = useState(true)
  const [currentStream, setCurrentStream] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMsg = {
      role: 'user' as const,
      content: inputValue.trim(),
      timestamp: new Date(),
    }
    addMessage(userMsg)
    setInputValue('')
    setIsLoading(true)
    setCurrentStream('جاري التفكير...')

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      const response = await fetch('/api/v1/agents/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortController.signal,
        body: JSON.stringify({
          message: userMsg.content,
          agent_type: currentAgent,
          conversation_history: messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! ${response.status}`)
      }

      const data = await response.json()
      setCurrentStream(null)
      addMessage({
        role: 'assistant',
        content: data.response || 'عذراً، تعذر الحصول على رد.',
        timestamp: new Date(),
      })
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setCurrentStream(null)
        return
      }
      setCurrentStream(null)
      addMessage({
        role: 'assistant',
        content: 'عذراً، حدث خطأ في الاتصال.',
        timestamp: new Date(),
      })
    } finally {
      setIsLoading(false)
      setCurrentStream(null)
      abortControllerRef.current = null
    }
  }

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
                  <agent.icon size={20} className="text-masar-cyan" />
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

      <div className="lg:col-span-3 h-full flex flex-col">
        <GlassCard className="flex-1 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-masar-border/50">
            <div className="flex items-center gap-3">
              <Brain size={20} className="text-masar-cyan" />
              <h3 className="font-bold text-masar-text">{agents.find((a) => a.id === currentAgent)?.name}</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowAgentList(!showAgentList)} className="lg:hidden">
              <MessageSquare size={18} />
            </Button>
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
                    {currentStream}
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-masar-border/50">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="اكتب رسالتك..."
                  className="w-full px-4 py-3 rounded-xl bg-masar-bg/50 border border-masar-border/50 text-masar-text focus:outline-none focus:border-masar-cyan/50"
                />
              </div>
              <Button variant="primary" size="sm" onClick={handleSend} disabled={isLoading || !inputValue.trim()}>
                <Send size={16} />
              </Button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
