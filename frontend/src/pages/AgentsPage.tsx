import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Send, User, Bot, Loader2, RotateCcw, StopCircle, Copy, CheckCircle2, RefreshCw, ChevronDown, Languages, Sparkles } from 'lucide-react'
import { useAIAgentStore } from '@/stores/aiAgentStore'
import { agentsAPI, API_BASE_URL } from '@/services/api'
import type { ConversationMessage } from '@/services/api'
import { useTheme } from '@/theme/ThemeContext'
import MarkdownRenderer from '@/components/MarkdownRenderer'

interface BackendAgent {
  id: string
  name: string
  description: string
}

const getQuickPrompts = (agentId: string) => {
  if (!agentId) return []
  if (agentId.toLowerCase().includes('python')) return ['كيف يمكنني تعريف دالة في بايثون؟', 'اشرح لي القوائم (Lists) في بايثون.', 'اكتب لي كود بايثون لقراءة ملف نصي.']
  if (agentId.toLowerCase().includes('react')) return ['ما هو الفرق بين useState و useEffect؟', 'كيف أقوم بإنشاء مكون في React؟', 'اشرح لي الـ Hooks ببساطة.']
  if (agentId.toLowerCase().includes('math')) return ['ما هي نظرية فيثاغورس؟', 'حل المعادلة 2x + 5 = 15', 'اشرح لي التفاضل والتكامل ببساطة.']
  if (agentId.toLowerCase().includes('english') || agentId.toLowerCase().includes('انجليزي')) return ['كيف أقول "أنا مستعد" بالإنجليزية؟', 'اشرح لي قاعدة المضارع التام.', 'اكتب لي رسالة بريد إلكتروني رسمية.']

  return [
    'اشرح لي كيف تعمل الشبكات العصبية ببساطة.',
    'ما هي أفضل ممارسات كتابة كود نظيف؟',
    'كيف يمكنني التحضير لمقابلة عمل؟'
  ]
}

export default function AgentsPage() {
  const { theme } = useTheme()
  const { messages, isLoading, addMessage, clearMessages, setIsLoading, currentAgent, setCurrentAgent } = useAIAgentStore()
  const [backendAgents, setBackendAgents] = useState<BackendAgent[]>([])
  const [agentsLoading, setAgentsLoading] = useState(true)
  const [inputValue, setInputValue] = useState('')
  const [streamingContent, setStreamingContent] = useState('')
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [showAgentMenu, setShowAgentMenu] = useState(false)
  const [autoTranslate, setAutoTranslate] = useState(() => localStorage.getItem('autoTranslate') !== 'false')
  const [reactMode, setReactMode] = useState<boolean>(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [provider, setProvider] = useState<'google' | 'openrouter'>(() => {
    return (localStorage.getItem('llm_provider') as 'google' | 'openrouter') || 'google'
  })

  const handleProviderChange = (newProvider: 'google' | 'openrouter') => {
    setProvider(newProvider)
    localStorage.setItem('llm_provider', newProvider)
  }

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const isAtBottomRef = useRef(true)
  const userJustSent = useRef(false)

  const handleScroll = () => {
    const container = chatContainerRef.current
    if (!container) return
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50
    isAtBottomRef.current = isAtBottom
  }

  const scrollToBottom = useCallback((force = false) => {
    const container = chatContainerRef.current
    if (!container) return
    if (force || userJustSent.current || isAtBottomRef.current) {
      if (force || userJustSent.current) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        userJustSent.current = false
      } else {
        container.scrollTop = container.scrollHeight
      }
    }
  }, [])

  // Load agents from backend
  useEffect(() => {
    (async () => {
      try {
        const { data } = await agentsAPI.list()
        const validIds = data.agents.map((a: BackendAgent) => a.id)
        setBackendAgents(data.agents)
        if (data.agents.length > 0 && (!currentAgent || !validIds.includes(currentAgent))) {
          setCurrentAgent(data.agents[0].id)
        }
      } catch {
        setBackendAgents([{ id: 'general', name: 'General Assistant', description: 'المساعد العام' }])
        if (!currentAgent) setCurrentAgent('general')
      } finally {
        setAgentsLoading(false)
      }
    })()
  }, [])

  // Auto-scroll on new message (force scroll only when user sends a new message)
  useEffect(() => {
    const lastMsg = messages[messages.length - 1]
    const isUserMsg = lastMsg?.role === 'user'
    scrollToBottom(isUserMsg)
  }, [messages.length, scrollToBottom])

  // Auto-scroll on streaming content (follow stream only if already at the bottom)
  useEffect(() => {
    scrollToBottom(false)
  }, [streamingContent, scrollToBottom])

  const stopGeneration = () => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
      setIsLoading(false)
      if (streamingContent) {
        addMessage({ role: 'assistant', content: streamingContent + ' [تم الإيقاف]', timestamp: new Date() })
        setStreamingContent('')
      }
    }
  }

  const handleSend = useCallback(async (text: string = inputValue) => {
    if (!text.trim() || isLoading) return

    const rawContent = text.trim()
    userJustSent.current = true
    setInputValue('')
    setIsLoading(true)
    setStreamingContent('')

    // Translate user message Arabic→English if auto-translate is on and text is Arabic
    let englishContent = rawContent
    const needsTranslation = autoTranslate && !isMostlyLatin(rawContent)
    if (needsTranslation) {
      setIsTranslating(true)
      try {
        const { data } = await agentsAPI.translate(rawContent, 'ar', 'en')
        englishContent = data.translated_text
      } catch {
        // fallback: send original
      } finally {
        setIsTranslating(false)
      }
    }

    // Build history using English/internal content (never the translated display text)
    const history: ConversationMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }))

    // Add user message: store English in content, Arabic in displayContent for UI
    const isTranslated = needsTranslation && englishContent !== rawContent
    addMessage({
      role: 'user',
      content: isTranslated ? englishContent : rawContent,
      ...(isTranslated ? { displayContent: rawContent } : {}),
      timestamp: new Date(),
    })

    const abortController = new AbortController()
    abortRef.current = abortController

    try {
      const validIds = backendAgents.map(a => a.id)
      const agentType = (currentAgent && validIds.includes(currentAgent)) ? currentAgent : (backendAgents[0]?.id || 'general')
      
      const requestUrl = reactMode 
        ? `${API_BASE_URL}/agents/react-run`
        : `${API_BASE_URL}/agents/chat`
        
      const requestPayload = reactMode
        ? { message: englishContent, provider: provider }
        : {
            message: englishContent,
            agent_type: agentType,
            conversation_history: history,
            provider: provider,
          }

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortController.signal,
        body: JSON.stringify(requestPayload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Server error ${response.status}: ${errorText.slice(0, 200)}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No readable stream returned')

      const decoder = new TextDecoder()
      let buffer = ''
      let fullEnglishResponse = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed.startsWith(':')) continue
          if (trimmed === 'data: [DONE]') continue
          
          if (reactMode) {
            if (trimmed.startsWith('data: [START_AGENT_LOOP]')) {
              fullEnglishResponse += "🤖 **بدء التفكير والحل الاستقلالي (ReAct Agent)...**\n\n"
            } else if (trimmed.startsWith('data: [THINKING_STEP]')) {
              const step = trimmed.replace('data: [THINKING_STEP] ', '')
              fullEnglishResponse += `\n🔍 **${step}**\n`
            } else if (trimmed.startsWith('data: [AGENT_THOUGHT]')) {
              // Header tag
            } else if (trimmed.startsWith('data: [RUNNING_TOOL]')) {
              const tool = trimmed.replace('data: [RUNNING_TOOL] ', '')
              fullEnglishResponse += `\n\n🛠️ **${tool}**\n`
            } else if (trimmed.startsWith('data: [TOOL_OBSERVATION]')) {
              fullEnglishResponse += "\n👁️ **المخرجات من المفسر (Observation):**\n"
            } else if (trimmed.startsWith('data: [FINAL_ANSWER]')) {
              fullEnglishResponse += "\n\n🎯 **الجواب النهائي:**\n"
            } else if (trimmed.startsWith('data: [AGENT_ERROR]')) {
              const err = trimmed.replace('data: [AGENT_ERROR] ', '')
              fullEnglishResponse += `\n❌ **خطأ:** ${err}\n`
            } else if (trimmed.startsWith('data: ')) {
              const token = trimmed.slice(6)
              fullEnglishResponse += token
            }
          } else {
            if (trimmed.startsWith('data: ')) {
              const token = trimmed.slice(6)
              fullEnglishResponse += token
            }
          }
          setStreamingContent(fullEnglishResponse)
        }
      }

      if (fullEnglishResponse) {
        if (autoTranslate) {
          setIsTranslating(true)
          try {
            const { data } = await agentsAPI.translate(fullEnglishResponse, 'en', 'ar')
            addMessage({
              role: 'assistant',
              content: fullEnglishResponse,
              displayContent: data.translated_text,
              timestamp: new Date(),
            })
          } catch {
            addMessage({ role: 'assistant', content: fullEnglishResponse, timestamp: new Date() })
          } finally {
            setIsTranslating(false)
          }
        } else {
          addMessage({ role: 'assistant', content: fullEnglishResponse, timestamp: new Date() })
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      console.error('Chat API Error:', err)
      addMessage({
        role: 'assistant',
        content: `عذراً، حدث خطأ: ${(err as Error).message}`,
        timestamp: new Date(),
        isError: true,
      })
    } finally {
      setIsLoading(false)
      setStreamingContent('')
      abortRef.current = null
    }
  }, [inputValue, isLoading, currentAgent, messages, addMessage, setIsLoading, backendAgents, autoTranslate, provider])

  const handleRetry = () => {
    if (messages.length > 0) {
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
          handleSend(messages[i].displayContent || messages[i].content)
          break
        }
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedId(index)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleAgentSelect = (id: string) => {
    if (id !== currentAgent) {
      setCurrentAgent(id)
      clearMessages()
    }
    setShowAgentMenu(false)
  }

  const currentAgentInfo = backendAgents.find((a) => a.id === currentAgent)

  const toggleAutoTranslate = () => {
    setAutoTranslate(prev => {
      const next = !prev
      localStorage.setItem('autoTranslate', String(next))
      return next
    })
  }

  const isMostlyLatin = (text: string) => {
    const latinCount = (text.match(/[a-zA-Z0-9\s.,!?;:'"(){}\[\]<>\-+=_@#$%^&*|\\/~`]/g) || []).length
    return latinCount / text.length > 0.6
  }

  return (
    <div className="h-[calc(100vh-140px)]">
      <div className="h-full flex flex-col">
        <div
          className="flex-1 flex flex-col min-h-0 rounded-2xl backdrop-blur-[20px] shadow-2xl relative overflow-hidden"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: `1px solid rgba(255, 255, 255, 0.06)` }}
        >
          <div
            className="flex items-center justify-between p-6 shrink-0"
            style={{ borderBottom: `1px solid rgba(255, 255, 255, 0.05)` }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
                <Bot size={24} className="text-white" />
              </div>
              <div>
                <div className="relative">
                  <button
                    onClick={() => setShowAgentMenu(!showAgentMenu)}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    <h3 className="text-xl font-bold" style={{ color: theme.colors.text }}>
                      {agentsLoading ? 'جاري التحميل...' : (currentAgentInfo?.name || 'المساعد الذكي')}
                    </h3>
                    <ChevronDown size={16} style={{ color: theme.colors.textMuted }} />
                  </button>
                  {showAgentMenu && (
                    <div
                      className="absolute top-full right-0 mt-2 w-64 rounded-xl border shadow-2xl z-50 overflow-hidden"
                      style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}
                    >
                      {backendAgents.map((agent) => (
                        <button
                          key={agent.id}
                          onClick={() => handleAgentSelect(agent.id)}
                          className="w-full text-right px-4 py-3 text-sm font-medium transition-colors hover:bg-white/5 flex items-center gap-3"
                          style={{
                            color: agent.id === currentAgent ? theme.colors.accent : theme.colors.text,
                            backgroundColor: agent.id === currentAgent ? `${theme.colors.accent}10` : 'transparent',
                          }}
                        >
                          <Bot size={16} />
                          <div className="flex flex-col">
                            <span>{agent.name}</span>
                            <span className="text-[10px]" style={{ color: theme.colors.textMuted }}>{agent.description.slice(0, 60)}...</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs" style={{ color: theme.colors.success }}>متصل وجاهز للمساعدة</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex p-0.5 rounded-lg backdrop-blur-md" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <button
                  onClick={() => handleProviderChange('google')}
                  className="px-2.5 py-1 rounded-md text-[10px] font-bold transition-all"
                  style={{
                    color: provider === 'google' ? '#fff' : theme.colors.textMuted,
                    background: provider === 'google' ? `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` : 'transparent',
                    boxShadow: provider === 'google' ? `0 0 8px ${theme.colors.accent}40` : 'none',
                  }}
                >
                  Gemini Direct
                </button>
                <button
                  onClick={() => handleProviderChange('openrouter')}
                  className="px-2.5 py-1 rounded-md text-[10px] font-bold transition-all"
                  style={{
                    color: provider === 'openrouter' ? '#fff' : theme.colors.textMuted,
                    background: provider === 'openrouter' ? `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` : 'transparent',
                    boxShadow: provider === 'openrouter' ? `0 0 8px ${theme.colors.accent}40` : 'none',
                  }}
                >
                  OpenRouter
                </button>
              </div>
              <button
                onClick={clearMessages}
                className="p-3 rounded-xl transition-all hover:bg-white/10 flex items-center gap-2"
                style={{ color: theme.colors.textMuted }}
                title="مسح المحادثة"
              >
                <RotateCcw size={18} />
                <span className="text-sm font-medium hidden sm:inline">مسح</span>
              </button>
            </div>
          </div>

          <div
            ref={chatContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-6 space-y-6"
            style={{ scrollbarWidth: 'thin' }}
          >
            {messages.length === 0 && !streamingContent && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                <Brain size={64} className="mb-4" style={{ color: theme.colors.textDark }} />
                <p className="text-lg font-medium" style={{ color: theme.colors.text }}>
                  ابدأ المحادثة مع {currentAgentInfo?.name || 'المساعد الذكي'}
                </p>
              </div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className="shrink-0">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                        style={{
                          background: msg.role === 'user' ? theme.colors.surfaceHover : `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})`,
                          border: `1px solid rgba(255,255,255,0.1)`
                        }}
                      >
                        {msg.role === 'assistant' ? <Bot size={20} className="text-white" /> : <User size={20} style={{ color: theme.colors.text }} />}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className={`flex items-center gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-xs font-bold" style={{ color: theme.colors.textDark }}>
                          {msg.role === 'user' ? 'أنت' : (currentAgentInfo?.name || 'المساعد')}
                        </span>
                        <span className="text-[10px]" style={{ color: theme.colors.textMuted }}>
                          {new Date(msg.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div
                        className="p-5 rounded-2xl text-[15px] leading-relaxed relative group"
                        style={{
                          backgroundColor: msg.role === 'user' ? theme.colors.secondary + '20' : 'rgba(255,255,255,0.03)',
                          color: msg.role === 'user' ? theme.colors.text : theme.colors.textMuted,
                          border: `1px solid ${msg.role === 'user' ? theme.colors.secondary + '40' : 'rgba(255,255,255,0.1)'}`,
                          borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px'
                        }}
                      >
                        <MarkdownRenderer content={msg.displayContent || msg.content} />
                        {msg.displayContent && (
                          <div className="flex items-center gap-1 mt-2">
                            <Languages size={10} style={{ color: theme.colors.accent }} />
                            <span className="text-[10px]" style={{ color: theme.colors.accent }}>مترجم</span>
                          </div>
                        )}

                        {msg.role === 'assistant' && (
                          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <button onClick={() => handleCopy(msg.displayContent || msg.content, idx)} className="p-1.5 rounded-lg hover:bg-white/10" style={{ color: theme.colors.textMuted }}>
                              {copiedId === idx ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
                            </button>
                            {msg.isError && (
                              <button onClick={handleRetry} className="p-1.5 rounded-lg hover:bg-white/10" style={{ color: theme.colors.error }}>
                                <RefreshCw size={16} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {streamingContent && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="flex gap-4 max-w-[85%]">
                  <div className="shrink-0">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                      style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}
                    >
                      <Bot size={20} className="text-white" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold" style={{ color: theme.colors.textDark }}>
                        {currentAgentInfo?.name || 'المساعد'}
                      </span>
                    </div>
                    <div
                      className="p-5 rounded-2xl text-[15px] leading-relaxed"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        border: `1px solid rgba(255,255,255,0.1)`,
                        borderRadius: '20px 20px 20px 4px'
                      }}
                    >
                      <MarkdownRenderer content={streamingContent} />
                      {isTranslating && (
                        <div className="mt-2 flex items-center gap-1 text-xs" style={{ color: theme.colors.accent }}>
                          <Loader2 size={12} className="animate-spin" />
                          ترجمة...
                        </div>
                      )}
                      <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: theme.colors.accent }}>
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        جارِ الكتابة...
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-6 shrink-0" style={{ borderTop: `1px solid rgba(255, 255, 255, 0.05)`, backgroundColor: 'rgba(0,0,0,0.2)' }}>
            {messages.length === 0 && currentAgent && (
              <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
                {getQuickPrompts(currentAgent).map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt)}
                    className="px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all hover:scale-105"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: theme.colors.text, border: `1px solid rgba(255,255,255,0.1)` }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between mb-3">
              <button
                onClick={toggleAutoTranslate}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  autoTranslate ? 'bg-opacity-20' : 'opacity-50'
                }`}
                style={{
                  backgroundColor: autoTranslate ? `${theme.colors.accent}20` : 'rgba(255,255,255,0.05)',
                  color: autoTranslate ? theme.colors.accent : theme.colors.textMuted,
                  border: `1px solid ${autoTranslate ? theme.colors.accent + '40' : 'rgba(255,255,255,0.1)'}`,
                }}
              >
                <Languages size={14} />
                <span>ترجمة تلقائية</span>
                <span
                  className={`w-4 h-4 rounded-full border transition-colors flex items-center justify-center ${
                    autoTranslate ? 'bg-current' : ''
                  }`}
                  style={{
                    borderColor: autoTranslate ? theme.colors.accent : theme.colors.textMuted,
                  }}
                >
                  {autoTranslate && <span className="w-2 h-2 rounded-full bg-white" />}
                </span>
              </button>
              {autoTranslate && (
                <span className="text-[10px]" style={{ color: theme.colors.textMuted }}>
                  الترجمة التلقائية تستخدم OpenRouter المجاني
                </span>
              )}
            </div>

            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="اكتب رسالتك للمساعد الذكي..."
                  className="w-full px-5 py-4 pr-12 rounded-2xl outline-none resize-none min-h-[60px] max-h-[200px]"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: `1px solid rgba(255,255,255,0.1)`,
                    color: theme.colors.text,
                  }}
                  rows={1}
                  dir="rtl"
                />
              </div>

              {isLoading || isTranslating ? (
                <button
                  onClick={isLoading ? stopGeneration : undefined}
                  className="p-4 rounded-2xl text-white transition-all"
                  style={{ backgroundColor: isLoading ? theme.colors.error : theme.colors.accent }}
                  title={isLoading ? 'إيقاف التوليد' : 'جاري الترجمة...'}
                >
                  {isLoading ? <StopCircle size={24} /> : <Loader2 size={24} className="animate-spin" />}
                </button>
              ) : (
                <button
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim()}
                  className="p-4 rounded-2xl disabled:opacity-50 text-white transition-transform hover:scale-105 shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${theme.colors.secondary} 0%, ${theme.colors.accent} 100%)`,
                  }}
                >
                  <Send size={24} className="rtl:-scale-x-100" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
