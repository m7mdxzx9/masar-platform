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

const translateWithProtection = async (text: string, from: string, to: string): Promise<string> => {
  // Regex to capture code blocks and math formulas
  // Code blocks: ```[\s\S]*?```
  // Block Math: \$\$[\s\S]*?\$\$ or \\\[[\s\S]*?\\\]
  // Inline Math: \$[^\$\n]+?\$ or \\\(.*?\\\)
  const blockRegex = /(```[\s\S]*?```|\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\])/g;
  const inlineRegex = /(\$[^\$\n]+?\$|\\\(.*?\\\))/g;

  const blockPlaceholders: string[] = [];
  const inlinePlaceholders: string[] = [];

  // Protect block elements first
  let protectedText = text.replace(blockRegex, (match) => {
    const placeholder = `[[BLOCK_P_${blockPlaceholders.length}]]`;
    blockPlaceholders.push(match);
    return placeholder;
  });

  // Protect inline elements
  protectedText = protectedText.replace(inlineRegex, (match) => {
    const placeholder = `[[INLINE_P_${inlinePlaceholders.length}]]`;
    inlinePlaceholders.push(match);
    return placeholder;
  });

  // Translate the protected text using agentsAPI
  const { data } = await agentsAPI.translate(protectedText, from, to);
  let translatedText = data.translated_text;

  // Restore inline placeholders
  inlinePlaceholders.forEach((original, idx) => {
    const placeholder = `[[INLINE_P_${idx}]]`;
    const escaped = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/_/g, '\\s*?_\\s*?');
    const rx = new RegExp(escaped, 'gi');
    translatedText = translatedText.replace(rx, original);
  });

  // Restore block placeholders
  blockPlaceholders.forEach((original, idx) => {
    const placeholder = `[[BLOCK_P_${idx}]]`;
    const escaped = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/_/g, '\\s*?_\\s*?');
    const rx = new RegExp(escaped, 'gi');
    translatedText = translatedText.replace(rx, original);
  });

  return translatedText;
};

const DEFAULT_RECOMMENDED_MODELS = [
  { id: "gemma4:e2b", name: "Gemma 4 (2B) - نموذج جوجل الحديث للأجهزة المتوسطة", size: "7.2 GB" },
  { id: "gemma4:e4b", name: "Gemma 4 (4B) - ذكي للغاية ومناسب للأجهزة المتوسطة", size: "9.6 GB" },
  { id: "gemma4:31b", name: "Gemma 4 (31B) - نموذج جوجل العملاق للمهام الصعبة", size: "18.0 GB" },
  { id: "llama3.2:1b", name: "Llama 3.2 (1B) - خفيف جداً ومناسب للهواتف واللابتوب", size: "1.3 GB" },
  { id: "llama3.2:3b", name: "Llama 3.2 (3B) - نموذج خفيف ذكي ومتكامل", size: "2.0 GB" },
  { id: "qwen2.5-coder:1.5b", name: "Qwen 2.5 Coder (1.5B) - مخصص للبرمجة وكتابة الكود", size: "1.0 GB" }
]

const isElectron = () => {
  return typeof window !== 'undefined' && (
    (window as any).electronAPI !== undefined ||
    /electron/i.test(navigator.userAgent)
  )
}

export default function AgentsPage() {
  const { theme } = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
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
  const [provider, setProvider] = useState<'google' | 'openrouter' | 'ollama'>(() => {
    const saved = localStorage.getItem('llm_provider') as 'google' | 'openrouter' | 'ollama'
    if (saved === 'ollama' && !isElectron()) {
      return 'openrouter'
    }
    return saved || 'openrouter'
  })

  const [localModels, setLocalModels] = useState<string[]>([])
  const [recommendedLocalModels, setRecommendedLocalModels] = useState<{ id: string; name: string; size: string }[]>(DEFAULT_RECOMMENDED_MODELS)
  const [activeLocalModel, setActiveLocalModel] = useState<string>(() => {
    return localStorage.getItem('active_local_model') || 'gemma4:e4b'
  })
  const [showModelManager, setShowModelManager] = useState(false)
  const [downloadingModel, setDownloadingModel] = useState<string | null>(null)
  const [downloadStatus, setDownloadStatus] = useState<string>('idle')
  const [isOllamaOffline, setIsOllamaOffline] = useState(false)

  const fetchLocalModels = useCallback(async () => {
    try {
      const { data } = await agentsAPI.listLocalModels()
      if (data.status === 'online') {
        setLocalModels(data.installed)
        setRecommendedLocalModels(data.recommended && data.recommended.length > 0 ? data.recommended : DEFAULT_RECOMMENDED_MODELS)
        setIsOllamaOffline(false)
        if (data.installed.length > 0 && !data.installed.includes(activeLocalModel)) {
          setActiveLocalModel(data.installed[0])
          localStorage.setItem('active_local_model', data.installed[0])
        }
      } else {
        setIsOllamaOffline(true)
        setLocalModels([])
        setRecommendedLocalModels(data.recommended && data.recommended.length > 0 ? data.recommended : DEFAULT_RECOMMENDED_MODELS)
      }
    } catch (err) {
      console.error('Failed to fetch local models:', err)
      setIsOllamaOffline(true)
      setRecommendedLocalModels(DEFAULT_RECOMMENDED_MODELS)
    }
  }, [activeLocalModel])

  useEffect(() => {
    if (provider === 'ollama') {
      fetchLocalModels()
    }
  }, [provider, fetchLocalModels])

  const handleProviderChange = (newProvider: 'google' | 'openrouter' | 'ollama') => {
    setProvider(newProvider)
    localStorage.setItem('llm_provider', newProvider)
  }

  const handlePullModel = async (modelName: string) => {
    setDownloadingModel(modelName)
    setDownloadStatus('loading')
    try {
      await agentsAPI.pullModel(modelName)
      const interval = setInterval(async () => {
        try {
          const { data } = await agentsAPI.getPullStatus(modelName)
          if (data.status === 'completed') {
            clearInterval(interval)
            setDownloadStatus('completed')
            setDownloadingModel(null)
            fetchLocalModels()
          } else if (data.status.startsWith('failed')) {
            clearInterval(interval)
            setDownloadStatus('error')
            alert(`فشل تحميل النموذج: ${data.status}`)
            setDownloadingModel(null)
          } else {
            setDownloadStatus(data.status)
          }
        } catch {
          clearInterval(interval)
          setDownloadStatus('error')
          setDownloadingModel(null)
        }
      }, 3000)
    } catch (err) {
      setDownloadStatus('error')
      setDownloadingModel(null)
      alert('فشل الاتصال بالخادم لبدء تحميل النموذج.')
    }
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

  // Load chat history for the selected agent
  useEffect(() => {
    if (!currentAgent) return
    (async () => {
      try {
        const { data } = await agentsAPI.getHistory(currentAgent)
        const loadedMessages = data.messages.map((m: any) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
          displayContent: m.displayContent,
          timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
        }))
        useAIAgentStore.getState().setMessages(loadedMessages)
      } catch (err) {
        console.error('Failed to load chat history:', err)
        useAIAgentStore.getState().setMessages([])
      }
    })()
  }, [currentAgent])

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
        englishContent = await translateWithProtection(rawContent, 'ar', 'en')
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
    const userMsgToStore = {
      role: 'user' as const,
      content: isTranslated ? englishContent : rawContent,
      ...(isTranslated ? { displayContent: rawContent } : {}),
      timestamp: new Date(),
    }
    addMessage(userMsgToStore)
    
    const validIds = backendAgents.map(a => a.id)
    const agentType = (currentAgent && validIds.includes(currentAgent)) ? currentAgent : (backendAgents[0]?.id || 'general')
    
    try {
      await agentsAPI.saveMessage(agentType, 'user', userMsgToStore.content, userMsgToStore.displayContent)
    } catch (err) {
      console.error('Failed to save user message to history:', err)
    }

    const abortController = new AbortController()
    abortRef.current = abortController

    try {
      
      const requestUrl = reactMode 
        ? `${API_BASE_URL}/agents/react-run`
        : `${API_BASE_URL}/agents/chat`
        
      const requestPayload = reactMode
        ? { message: englishContent, provider: provider, model: provider === 'ollama' ? activeLocalModel : undefined }
        : {
            message: englishContent,
            agent_type: agentType,
            conversation_history: history,
            provider: provider,
            model: provider === 'ollama' ? activeLocalModel : undefined,
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
            } else if (trimmed === 'data:') {
              fullEnglishResponse += '\n'
            }
          } else {
            if (trimmed.startsWith('data: ')) {
              const token = trimmed.slice(6)
              fullEnglishResponse += token
            } else if (trimmed === 'data:') {
              fullEnglishResponse += '\n'
            }
          }
          setStreamingContent(fullEnglishResponse)
        }
      }

      if (fullEnglishResponse) {
        if (autoTranslate) {
          setIsTranslating(true)
          try {
            const translatedText = await translateWithProtection(fullEnglishResponse, 'en', 'ar')
            const assistantMsg = {
              role: 'assistant' as const,
              content: fullEnglishResponse,
              displayContent: translatedText,
              timestamp: new Date(),
            }
            addMessage(assistantMsg)
            await agentsAPI.saveMessage(agentType, 'assistant', assistantMsg.content, assistantMsg.displayContent)
          } catch {
            const assistantMsg = { role: 'assistant' as const, content: fullEnglishResponse, timestamp: new Date() }
            addMessage(assistantMsg)
            await agentsAPI.saveMessage(agentType, 'assistant', assistantMsg.content)
          } finally {
            setIsTranslating(false)
          }
        } else {
          const assistantMsg = { role: 'assistant' as const, content: fullEnglishResponse, timestamp: new Date() }
          addMessage(assistantMsg)
          await agentsAPI.saveMessage(agentType, 'assistant', assistantMsg.content)
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
  }, [inputValue, isLoading, currentAgent, messages, addMessage, setIsLoading, backendAgents, autoTranslate, provider, activeLocalModel])

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

  const handleClearChat = async () => {
    try {
      if (currentAgent) {
        await agentsAPI.clearHistory(currentAgent)
      }
    } catch (err) {
      console.error('Failed to clear chat history:', err)
    }
    clearMessages()
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
    <div className="h-full flex flex-col min-h-0">
      <div className="flex-1 flex flex-col min-h-0">
        <div
          className="flex-1 flex flex-col min-h-0 rounded-2xl backdrop-blur-[20px] shadow-2xl relative overflow-hidden"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: `1px solid rgba(255, 255, 255, 0.06)` }}
        >
          <div
            className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center p-4 sm:p-6 shrink-0"
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
                {isElectron() && (
                  <button
                    onClick={() => handleProviderChange('ollama')}
                    className="px-2.5 py-1 rounded-md text-[10px] font-bold transition-all"
                    style={{
                      color: provider === 'ollama' ? '#fff' : theme.colors.textMuted,
                      background: provider === 'ollama' ? `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` : 'transparent',
                      boxShadow: provider === 'ollama' ? `0 0 8px ${theme.colors.accent}40` : 'none',
                    }}
                  >
                    Local Ollama
                  </button>
                )}
              </div>
              
              {provider === 'ollama' && (() => {
                const displayModels = Array.from(new Set([...localModels, ...recommendedLocalModels.map(m => m.id)]))
                return (
                  <div className="flex items-center gap-2">
                    {displayModels.length > 0 ? (
                      <select
                        value={activeLocalModel}
                        onChange={(e) => {
                          setActiveLocalModel(e.target.value)
                          localStorage.setItem('active_local_model', e.target.value)
                        }}
                        className="bg-[#0f172a] text-white border border-white/10 rounded-lg px-2 py-1 text-xs outline-none"
                      >
                        {displayModels.map((m) => {
                          const isInstalled = localModels.includes(m)
                          return (
                            <option key={m} value={m}>
                              {m}{isInstalled ? '' : ' (غير مثبت)'}
                            </option>
                          )
                        })}
                      </select>
                    ) : (
                      <span className="text-[10px] text-red-500 font-bold">لا توجد نماذج</span>
                    )}
                    {isOllamaOffline && (
                      <span className="text-[9px] text-red-400 font-medium" title="خادم Ollama المحلي غير متصل">غير متصل</span>
                    )}
                    <button
                      onClick={() => setShowModelManager(true)}
                      className="p-1 rounded-lg hover:bg-white/5 text-[10px] font-medium flex items-center gap-1 border border-white/5 bg-white/5 transition-colors"
                      style={{ color: theme.colors.accent }}
                    >
                      <Sparkles size={12} />
                      <span>تنزيل نموذج</span>
                    </button>
                  </div>
                )
              })()}
              <button
                onClick={handleClearChat}
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
            className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6"
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
                  className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 sm:gap-4 w-full max-w-[92%] sm:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
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

                    <div className="flex flex-col gap-1 w-full min-w-0">
                      <div className={`flex items-center gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-xs font-bold" style={{ color: theme.colors.textDark }}>
                          {msg.role === 'user' ? 'أنت' : (currentAgentInfo?.name || 'المساعد')}
                        </span>
                        <span className="text-[10px]" style={{ color: theme.colors.textMuted }}>
                          {new Date(msg.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div
                        className="p-3.5 sm:p-5 rounded-2xl text-sm sm:text-[15px] leading-relaxed relative group w-full"
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
                className="flex justify-start w-full"
              >
                <div className="flex gap-2 sm:gap-4 w-full max-w-[92%] sm:max-w-[85%]">
                  <div className="shrink-0">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                      style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}
                    >
                      <Bot size={20} className="text-white" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 w-full min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold" style={{ color: theme.colors.textDark }}>
                        {currentAgentInfo?.name || 'المساعد'}
                      </span>
                    </div>
                    <div
                      className="p-5 rounded-2xl text-[15px] leading-relaxed w-full"
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

          <div className="p-4 sm:p-6 shrink-0" style={{ borderTop: `1px solid rgba(255, 255, 255, 0.05)`, backgroundColor: 'rgba(0,0,0,0.2)' }}>
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
        {/* Local Model Manager Modal */}
        {showModelManager && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl p-6 border shadow-2xl" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                <h3 className="text-lg font-bold" style={{ color: theme.colors.text }}>إدارة النماذج المحلية (Ollama)</h3>
                <button
                  onClick={() => setShowModelManager(false)}
                  className="text-white/60 hover:text-white text-sm"
                >
                  إغلاق
                </button>
              </div>

              {isOllamaOffline && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs text-right mb-4">
                  تنبيه: تطبيق Ollama غير مشغل أو غير قابل للوصول. يرجى تشغيل تطبيق Ollama على جهازك للتمكن من تحميل واستخدام النماذج المحلية.
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-white/50 mb-2 text-right">النماذج المثبتة حالياً</h4>
                  {localModels.length > 0 ? (
                    <div className="flex flex-wrap gap-2 justify-end">
                      {localModels.map((m) => (
                        <span key={m} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-white/80">
                          {m}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-white/40 text-right">لا توجد نماذج مثبتة حالياً.</p>
                  )}
                </div>

                <div className="border-t border-white/5 pt-4">
                  <h4 className="text-xs font-bold text-white/50 mb-3 text-right">النماذج الموصى بها للتحميل</h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {recommendedLocalModels.map((m) => {
                      const isInstalled = localModels.includes(m.id) || localModels.includes(m.id + ':latest')
                      const isDownloading = downloadingModel === m.id
                      return (
                        <div key={m.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                          <div className="text-left">
                            <span className="text-xs text-white/40 font-mono block">{m.size}</span>
                          </div>
                          <div className="text-right flex-1 pr-3">
                            <span className="text-sm font-bold text-white block">{m.id}</span>
                            <span className="text-xs text-white/60 block">{m.name}</span>
                          </div>
                          <div>
                            {isInstalled ? (
                              <span className="text-xs text-green-500 font-bold px-3 py-1 bg-green-500/10 rounded-lg border border-green-500/20">مثبت</span>
                            ) : isDownloading ? (
                              <span className="text-xs text-amber-500 font-bold px-3 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20 animate-pulse">
                                {downloadStatus === 'loading' ? 'جاري التحميل...' : downloadStatus}
                              </span>
                            ) : (
                              <button
                                onClick={() => handlePullModel(m.id)}
                                disabled={isOllamaOffline || downloadingModel !== null}
                                className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                              >
                                تنزيل
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
