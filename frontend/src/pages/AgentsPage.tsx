import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Send, User, Bot, Loader2, RotateCcw, StopCircle, Copy, CheckCircle2, RefreshCw } from 'lucide-react'
import { useAIAgentStore } from '@/stores/aiAgentStore'
import { agentsAPI } from '@/services/api'
import type { ConversationMessage } from '@/services/api'
import { useTheme } from '@/theme/ThemeContext'

interface AgentInfo {
  id: string
  name: string
  description: string
  icon?: string
}

const FREE_MODELS = [
  { id: 'openrouter/free', name: 'Auto Router', description: 'أفضل نموذج مجاني متاح تلقائياً', icon: '🔄' },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const API_BASE = (import.meta as any).env?.VITE_API_URL || '/api/v1'

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
  const [agents, setAgents] = useState<AgentInfo[]>([])
  const [agentsLoading, setAgentsLoading] = useState(true)
  const [inputValue, setInputValue] = useState('')
  const [streamingContent, setStreamingContent] = useState('')
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [rateLimitError, setRateLimitError] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Load agents
  useEffect(() => {
    setAgents(FREE_MODELS)
    setAgentsLoading(false)
    if (!currentAgent) {
      setCurrentAgent(FREE_MODELS[0].id)
    }
  }, [])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

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

    const userContent = text.trim()
    const userMsg = { role: 'user' as const, content: userContent, timestamp: new Date() }
    addMessage(userMsg)
    setInputValue('')
    setIsLoading(true)
    setStreamingContent('')
    setRateLimitError(null)

    const history: ConversationMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }))

    const abortController = new AbortController()
    abortRef.current = abortController

    try {
      const openRouterHistory = history.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      let fullContent = ''

      for (let attempt = 0; attempt < FREE_MODELS.length; attempt++) {
        const model = FREE_MODELS[attempt]
        // Skip models until we hit the currently selected one (optional behavior)
        // If currentAgent is set, we can prioritize it, but the prompt says auto-fallback.
        // Let's use the currentAgent for the first attempt, then fallback to others if it fails.
        const targetModelId = attempt === 0 ? currentAgent : model.id
        
        try {
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer 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',
              'Content-Type': 'application/json',
              'HTTP-Referer': 'http://localhost:5173',
              'X-Title': 'Masar',
            },
            signal: abortController.signal,
            body: JSON.stringify({
              model: targetModelId,
              messages: [...openRouterHistory, { role: 'user', content: userContent }],
              stream: true,
            }),
          });

          if (response.status === 429) {
            const errorData = await response.json().catch(() => ({}));
            const retryAfter = errorData?.metadata?.retry_after_seconds || 10;
            if (attempt < FREE_MODELS.length - 1) {
              setRateLimitError(`${targetModelId} مقيّد، تجربة نموذج آخر...`);
              await new Promise(r => setTimeout(r, 2000));
              continue; // Try next model
            }
            throw new Error(`جميع النماذج مشغولة. حاول مرة أخرى بعد ${Math.ceil(retryAfter)} ثانية.`);
          }

          if (!response.ok) {
            const errorText = await response.text();
            if (attempt < FREE_MODELS.length - 1) {
              setRateLimitError(`خطأ في ${targetModelId}، المحاولة بنموذج آخر...`);
              continue;
            }
            throw new Error(`OpenRouter error ${response.status}: ${errorText.slice(0, 200)}`);
          }

          setRateLimitError(null)
          const reader = response.body?.getReader();
          if (!reader) throw new Error('No readable stream returned')

          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed.startsWith(':')) continue;
              if (trimmed === 'data: [DONE]') break;
              if (trimmed.startsWith('data: ')) {
                try {
                  const json = JSON.parse(trimmed.slice(6));
                  const content = json.choices?.[0]?.delta?.content;
                  if (content) {
                    fullContent += content;
                    setStreamingContent(fullContent);
                  }
                } catch {}
              }
            }
          }
          break; // Successfully got the response, exit the fallback loop
        } catch (err: any) {
          if (err.name === 'AbortError') throw err;
          if (attempt === FREE_MODELS.length - 1) throw err;
        }
      }

      addMessage({ role: 'assistant', content: fullContent, timestamp: new Date() })
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      console.error('Chat API Error:', err)
      addMessage({
        role: 'assistant',
        content: `عذراً، حدث خطأ: ${(err as Error).message}`,
        timestamp: new Date(),
        isError: true
      })
    } finally {
      setIsLoading(false)
      setStreamingContent('')
      setRateLimitError(null)
      abortRef.current = null
    }
  }, [inputValue, isLoading, currentAgent, messages, addMessage, setIsLoading])

  const handleRetry = () => {
    if (messages.length > 0) {
      // Find last user message
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
          handleSend(messages[i].content)
          break;
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

  const handleAgentSwitch = (id: string) => {
    if (id !== currentAgent) {
      setCurrentAgent(id)
      clearMessages()
    }
  }

  return (
    <div className="h-[calc(100vh-140px)]">
      {/* Chat Area */}
      <div className="h-full flex flex-col">
        <div
          className="flex-1 flex flex-col min-h-0 rounded-2xl backdrop-blur-[20px] shadow-2xl relative overflow-hidden"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: `1px solid rgba(255, 255, 255, 0.06)` }}
        >

          {/* Chat Header */}
          <div
            className="flex items-center justify-between p-6 shrink-0"
            style={{ borderBottom: `1px solid rgba(255, 255, 255, 0.05)` }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
                <Bot size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold" style={{ color: theme.colors.text }}>
                  {agents.find((a) => a.id === currentAgent)?.name || 'المساعد الذكي'}
                </h3>
                <p className="text-xs" style={{ color: theme.colors.success }}>متصل وجاهز للمساعدة</p>
              </div>
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

          <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ scrollbarWidth: 'thin' }}>
            {/* Rate Limit Banner */}
            {rateLimitError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 mb-4"
                style={{ backgroundColor: theme.colors.warning + '20', color: theme.colors.warning, border: `1px solid ${theme.colors.warning}40` }}
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                {rateLimitError}
              </motion.div>
            )}

            {messages.length === 0 && !streamingContent && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                <Brain size={64} className="mb-4" style={{ color: theme.colors.textDark }} />
                <p className="text-lg font-medium" style={{ color: theme.colors.text }}>ابدأ المحادثة مع {agents.find((a) => a.id === currentAgent)?.name}</p>
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
                    {/* Avatar */}
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
                    
                    {/* Message Bubble */}
                    <div className="flex flex-col gap-1">
                      <div className={`flex items-center gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-xs font-bold" style={{ color: theme.colors.textDark }}>
                          {msg.role === 'user' ? 'أنت' : agents.find((a) => a.id === currentAgent)?.name}
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
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        
                        {/* Actions for Assistant */}
                        {msg.role === 'assistant' && (
                          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <button onClick={() => handleCopy(msg.content, idx)} className="p-1.5 rounded-lg hover:bg-white/10" style={{ color: theme.colors.textMuted }}>
                              {copiedId === idx ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
                            </button>
                            {/* @ts-ignore - isError might be attached */}
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
            
            {/* Streaming Indicator */}
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
                        {agents.find((a) => a.id === currentAgent)?.name}
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
                      <p className="whitespace-pre-wrap text-white">{streamingContent}</p>
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

          {/* Input & Quick Prompts */}
          <div className="p-6 shrink-0" style={{ borderTop: `1px solid rgba(255, 255, 255, 0.05)`, backgroundColor: 'rgba(0,0,0,0.2)' }}>
            
            {/* Quick Prompts */}
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
              
              {isLoading ? (
                <button
                  onClick={stopGeneration}
                  className="p-4 rounded-2xl text-white transition-all hover:bg-red-600"
                  style={{ backgroundColor: theme.colors.error }}
                  title="إيقاف التوليد"
                >
                  <StopCircle size={24} />
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
