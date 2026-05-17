import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Clock, Star, Swords, RotateCcw, Send, Crown, Skull, Zap, Shield, Tag, AlertCircle } from 'lucide-react'
import { useTheme } from '@/theme/ThemeContext'
import wordsByLetter from '@/data/wordList'

type GameMode = 'classic' | 'speed' | 'hard' | 'category'
type GameState = 'menu' | 'playing' | 'victory' | 'defeat'
type Player = 'player' | 'ai'

interface WordEntry {
  word: string
  translation: string
  player: Player
  timestamp: Date
}

const CATEGORIES = ['Animals', 'Technology', 'Food', 'Science', 'Nature']

const MODE_INFO: Record<GameMode, { label: string; labelAr: string; icon: typeof Zap; desc: string }> = {
  classic: { label: 'Classic', labelAr: 'كلاسيكي', icon: Swords, desc: 'بدون حدود زمنية أو قيود' },
  speed: { label: 'Speed', labelAr: 'سريع', icon: Zap, desc: '15 ثانية لكل دور' },
  hard: { label: 'Hard', labelAr: 'صعب', icon: Shield, desc: 'الحد الأدنى 5 أحرف، بدون أسماء علم' },
  category: { label: 'Category', labelAr: 'تصنيف', icon: Tag, desc: 'كلمات من فئة محددة فقط' },
}

function getAIWord(lastLetter: string, usedWords: Set<string>): string | null {
  const letter = lastLetter.toLowerCase()
  const candidates = wordsByLetter[letter] || []
  const available = candidates.filter(w => !usedWords.has(w.toLowerCase()))
  if (available.length === 0) return null
  return available[Math.floor(Math.random() * available.length)]
}

async function fetchTranslation(word: string): Promise<string> {
  try {
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|ar`)
    if (!res.ok) return '—'
    const data = await res.json()
    return data?.responseData?.translatedText || '—'
  } catch { return '—' }
}

async function isRealWord(word: string): Promise<boolean> {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
    return res.ok
  } catch { return false }
}

export default function ChallengesPage() {
  const { theme } = useTheme()
  const [mode, setMode] = useState<GameMode>('classic')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [gameState, setGameState] = useState<GameState>('menu')
  const [history, setHistory] = useState<WordEntry[]>([])
  const [usedWords, setUsedWords] = useState<Set<string>>(new Set())
  const [score, setScore] = useState(0)
  const [input, setInput] = useState('')
  const [requiredLetter, setRequiredLetter] = useState('')
  const [error, setError] = useState('')
  const [aiThinking, setAiThinking] = useState(false)
  const [timer, setTimer] = useState(15)
  const [isPlayerTurn, setIsPlayerTurn] = useState(false)
  const [winner, setWinner] = useState<Player | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const historyEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  useEffect(() => { historyEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [history])

  useEffect(() => {
    if (mode === 'speed' && isPlayerTurn && gameState === 'playing') {
      setTimer(15)
      clearTimer()
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) { clearTimer(); endGame('ai'); return 0 }
          return prev - 1
        })
      }, 1000)
    } else { clearTimer() }
    return clearTimer
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlayerTurn, gameState, mode])

  const endGame = useCallback((w: Player) => {
    clearTimer()
    setWinner(w)
    setGameState(w === 'player' ? 'victory' : 'defeat')
  }, [clearTimer])

  const addWord = useCallback(async (word: string, player: Player) => {
    const translation = await fetchTranslation(word)
    const entry: WordEntry = { word, translation, player, timestamp: new Date() }
    setHistory(prev => [...prev, entry])
    setUsedWords(prev => { const s = new Set(prev); s.add(word.toLowerCase()); return s })
    setRequiredLetter(word[word.length - 1].toLowerCase())

    if (player === 'player') {
      let pts = 10
      if (word.length > 7) pts += 25
      if (mode === 'hard') pts += 50
      setScore(prev => prev + pts)
    }
  }, [mode])

  const startGame = useCallback(async () => {
    setHistory([]); setUsedWords(new Set()); setScore(0); setError('')
    setIsPlayerTurn(false); setWinner(null); setGameState('playing')
    setAiThinking(true)

    // AI picks first word
    const letters = Object.keys(wordsByLetter)
    const randomLetter = letters[Math.floor(Math.random() * letters.length)]
    const firstWord = getAIWord(randomLetter, new Set())
    if (!firstWord) { setAiThinking(false); return }

    await new Promise(r => setTimeout(r, 800))
    await addWord(firstWord, 'ai')
    setAiThinking(false)
    setIsPlayerTurn(true)
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [addWord])

  const aiTurn = useCallback(async (lastLetter: string, currentUsed: Set<string>) => {
    setAiThinking(true)
    await new Promise(r => setTimeout(r, 600 + Math.random() * 1000))
    const aiWord = getAIWord(lastLetter, currentUsed)
    if (!aiWord) { setAiThinking(false); endGame('player'); return }
    await addWord(aiWord, 'ai')
    setAiThinking(false)
    setIsPlayerTurn(true)
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [addWord, endGame])

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || aiThinking || !isPlayerTurn) return
    const word = input.trim().toLowerCase()
    setError('')

    if (word[0] !== requiredLetter) { setError(`يجب أن تبدأ الكلمة بحرف "${requiredLetter.toUpperCase()}"`); return }
    if (usedWords.has(word)) { setError('هذه الكلمة استُخدمت من قبل!'); return }
    if (mode === 'hard' && word.length < 5) { setError('يجب أن تكون الكلمة 5 أحرف على الأقل!'); return }

    setIsPlayerTurn(false)
    setInput('')

    const valid = await isRealWord(word)
    if (!valid) { setError('هذه ليست كلمة إنجليزية صحيحة!'); setIsPlayerTurn(true); return }

    await addWord(word, 'player')
    const newUsed = new Set(usedWords); newUsed.add(word)
    const lastChar = word[word.length - 1].toLowerCase()
    aiTurn(lastChar, newUsed)
  }, [input, aiThinking, isPlayerTurn, requiredLetter, usedWords, mode, addWord, aiTurn])

  // ── MENU SCREEN ──
  if (gameState === 'menu') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-8 mt-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
              <Swords size={32} className="text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold" style={{ color: theme.colors.text }}>Word Chain Duel</h1>
          <p className="text-lg" style={{ color: theme.colors.textMuted }}>تحدَّ الذكاء الاصطناعي! كل كلمة تبدأ بآخر حرف من الكلمة السابقة</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Object.keys(MODE_INFO) as GameMode[]).map(m => {
            const info = MODE_INFO[m]; const Icon = info.icon; const active = mode === m
            return (
              <button key={m} onClick={() => setMode(m)}
                className="p-6 rounded-2xl text-right transition-all duration-300 backdrop-blur-[20px] shadow-lg hover:-translate-y-1"
                style={{
                  backgroundColor: active ? theme.colors.accent + '20' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${active ? theme.colors.accent : 'rgba(255, 255, 255, 0.06)'}`,
                }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: active ? theme.colors.accent : 'rgba(255,255,255,0.05)' }}>
                    <Icon size={20} style={{ color: active ? '#fff' : theme.colors.textMuted }} />
                  </div>
                  <span className="text-xl font-bold" style={{ color: active ? theme.colors.accent : theme.colors.text }}>{info.labelAr}</span>
                  <span className="text-sm" style={{ color: theme.colors.textDark }}>({info.label})</span>
                </div>
                <p className="text-sm pr-12" style={{ color: theme.colors.textMuted }}>{info.desc}</p>
              </button>
            )
          })}
        </div>

        {mode === 'category' && (
          <div className="p-6 rounded-2xl backdrop-blur-[20px]" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.06)` }}>
            <p className="text-base mb-4 font-bold" style={{ color: theme.colors.text }}>اختر الفئة:</p>
            <div className="flex flex-wrap gap-3">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategory(c)}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    backgroundColor: category === c ? theme.colors.accent + '20' : 'rgba(255,255,255,0.05)',
                    color: category === c ? theme.colors.accent : theme.colors.textMuted,
                    border: `1px solid ${category === c ? theme.colors.accent + '50' : 'rgba(255,255,255,0.1)'}`,
                  }}>{c}</button>
              ))}
            </div>
          </div>
        )}

        <button onClick={startGame}
          className="w-full py-5 rounded-2xl text-xl font-bold text-white transition-all hover:scale-[1.02] shadow-2xl"
          style={{ background: `linear-gradient(135deg, ${theme.colors.secondary} 0%, ${theme.colors.accent} 100%)`, boxShadow: `0 10px 30px -10px ${theme.colors.accent}` }}>
          ⚔️ ابدأ المبارزة
        </button>
      </motion.div>
    )
  }

  // ── VICTORY / DEFEAT SCREEN ──
  if (gameState === 'victory' || gameState === 'defeat') {
    const isWin = gameState === 'victory'
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto space-y-6 mt-8">
        <div className="text-center p-12 rounded-3xl backdrop-blur-[20px] shadow-2xl relative overflow-hidden" 
          style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `2px solid ${isWin ? theme.colors.success : theme.colors.error}30` }}>
          <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle at center, ${isWin ? theme.colors.success : theme.colors.error}, transparent)` }} />
          {isWin ? <Crown size={80} className="mx-auto mb-6 relative z-10" style={{ color: theme.colors.success }} /> : <Skull size={80} className="mx-auto mb-6 relative z-10" style={{ color: theme.colors.error }} />}
          <h2 className="text-4xl font-black mb-4 relative z-10" style={{ color: isWin ? theme.colors.success : theme.colors.error }}>
            {isWin ? 'انتصرت!' : 'هُزمت!'}
          </h2>
          <p className="text-6xl font-black mb-3 relative z-10" style={{ color: theme.colors.text }}>{score}</p>
          <p className="text-lg relative z-10" style={{ color: theme.colors.textMuted }}>نقطة • {history.filter(h => h.player === 'player').length} كلمة</p>
        </div>

        <div className="p-6 rounded-2xl max-h-64 overflow-y-auto backdrop-blur-[20px] shadow-lg" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.06)` }}>
          <h3 className="font-bold mb-4 text-lg" style={{ color: theme.colors.text }}>سجل الكلمات</h3>
          {history.map((h, i) => (
            <div key={i} className="flex items-center gap-3 py-3 text-base" style={{ borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
              <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-md"
                style={{ backgroundColor: h.player === 'player' ? theme.colors.accent + '20' : theme.colors.secondary + '20', color: h.player === 'player' ? theme.colors.accent : theme.colors.secondary }}>
                {h.player === 'player' ? 'أنت' : 'ذكاء'}
              </span>
              <span className="font-bold" style={{ color: theme.colors.text }}>{h.word}</span>
              <span className="text-sm" style={{ color: theme.colors.textDark }}>→ {h.translation}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <button onClick={startGame} className="flex-1 py-4 rounded-xl font-bold text-white text-lg transition-transform hover:scale-105 shadow-lg"
            style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
            <RotateCcw size={20} className="inline mr-2" /> العب مرة أخرى
          </button>
          <button onClick={() => setGameState('menu')} className="px-8 py-4 rounded-xl font-bold text-lg transition-all hover:bg-white/5"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: theme.colors.text, border: `1px solid rgba(255,255,255,0.1)` }}>
            القائمة
          </button>
        </div>
      </motion.div>
    )
  }

  // ── PLAYING SCREEN ──
  const lastAIEntry = [...history].reverse().find(h => h.player === 'ai')
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto flex flex-col gap-6" style={{ height: 'calc(100vh - 8rem)' }}>
      {/* Top bar: Score + Mode + Timer */}
      <div className="flex flex-wrap items-center justify-between shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-6 py-3 rounded-2xl backdrop-blur-md shadow-lg" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.06)` }}>
            <Star size={24} style={{ color: theme.colors.accent }} />
            <span className="text-2xl font-black" style={{ color: theme.colors.accent }}>{score}</span>
          </div>
          <span className="px-4 py-2 rounded-xl text-sm font-bold backdrop-blur-md" style={{ backgroundColor: theme.colors.accent + '20', color: theme.colors.accent, border: `1px solid ${theme.colors.accent}40` }}>
            {MODE_INFO[mode].labelAr}
          </span>
        </div>
        {mode === 'speed' && (
          <div className="flex items-center gap-3 px-6 py-3 rounded-2xl backdrop-blur-md shadow-lg" style={{ backgroundColor: timer <= 5 ? theme.colors.error + '20' : 'rgba(255,255,255,0.03)', border: `1px solid ${timer <= 5 ? theme.colors.error + '50' : 'rgba(255,255,255,0.06)'}` }}>
            <Clock size={24} style={{ color: timer <= 5 ? theme.colors.error : theme.colors.warning }} className={timer <= 5 ? 'animate-pulse' : ''} />
            <span className="text-2xl font-black tabular-nums" style={{ color: timer <= 5 ? theme.colors.error : theme.colors.text }}>{timer}s</span>
          </div>
        )}
        <button onClick={() => endGame('ai')} className="px-6 py-3 rounded-2xl text-sm font-bold transition-colors hover:bg-red-500/20 hover:text-red-400"
          style={{ color: theme.colors.textMuted, backgroundColor: 'rgba(255,255,255,0.05)' }}>استسلام</button>
      </div>

      {/* AI's last word display */}
      {lastAIEntry && (
        <div className="text-center p-8 rounded-3xl shrink-0 backdrop-blur-[30px] shadow-2xl relative overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid rgba(255,255,255,0.08)` }}>
          <div className="absolute inset-0 opacity-5" style={{ background: `linear-gradient(45deg, ${theme.colors.secondary}, ${theme.colors.accent})` }} />
          <p className="text-sm font-bold mb-2 relative z-10" style={{ color: theme.colors.textMuted }}>🤖 الذكاء الاصطناعي لعب:</p>
          <h2 className="text-5xl font-black mb-2 relative z-10" style={{ color: theme.colors.text }}>{lastAIEntry.word}</h2>
          <p className="text-lg font-medium mb-6 relative z-10" style={{ color: theme.colors.textDark }}>→ {lastAIEntry.translation}</p>
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl relative z-10" style={{ backgroundColor: theme.colors.accent + '20', border: `1px solid ${theme.colors.accent}40` }}>
            <span className="font-medium" style={{ color: theme.colors.textMuted }}>الحرف المطلوب للبدء:</span>
            <span className="text-3xl font-black" style={{ color: theme.colors.accent }}>{requiredLetter.toUpperCase()}</span>
          </div>
        </div>
      )}

      {/* Word history */}
      <div className="flex-1 min-h-0 overflow-y-auto rounded-3xl p-6 backdrop-blur-[20px] shadow-inner" style={{ backgroundColor: 'rgba(0,0,0,0.2)', border: `1px solid rgba(255,255,255,0.05)` }}>
        <AnimatePresence initial={false}>
          {history.map((h, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: h.player === 'player' ? 30 : -30 }} animate={{ opacity: 1, x: 0 }}
              className={`flex ${h.player === 'player' ? 'justify-end' : 'justify-start'} mb-4`}>
              <div className="px-5 py-3 rounded-2xl max-w-[70%] shadow-lg" style={{
                backgroundColor: h.player === 'player' ? theme.colors.accent + '15' : theme.colors.secondary + '15',
                border: `1px solid ${h.player === 'player' ? theme.colors.accent + '30' : theme.colors.secondary + '30'}`,
                borderRadius: h.player === 'player' ? '20px 20px 4px 20px' : '20px 20px 20px 4px'
              }}>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg" style={{ color: h.player === 'player' ? theme.colors.text : theme.colors.text }}>{h.word}</span>
                  <span className="text-sm" style={{ color: theme.colors.textDark }}>{h.translation}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {aiThinking && (
          <div className="flex justify-start mb-4">
            <div className="px-5 py-3 rounded-2xl shadow-lg" style={{ backgroundColor: theme.colors.secondary + '15', borderRadius: '20px 20px 20px 4px', border: `1px solid ${theme.colors.secondary}30` }}>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ color: theme.colors.secondary, animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ color: theme.colors.secondary, animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ color: theme.colors.secondary, animationDelay: '300ms' }} />
                </div>
                <span className="text-sm font-medium ml-2" style={{ color: theme.colors.secondary }}>يفكر...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={historyEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 space-y-3">
        {error && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 px-5 py-3 rounded-xl backdrop-blur-md"
            style={{ backgroundColor: theme.colors.error + '20', border: `1px solid ${theme.colors.error}40` }}>
            <AlertCircle size={20} style={{ color: theme.colors.error }} />
            <span className="font-bold" style={{ color: theme.colors.error }}>{error}</span>
          </motion.div>
        )}
        <div className="flex gap-3">
          <input ref={inputRef} type="text" value={input} onChange={e => { setInput(e.target.value); setError('') }}
            onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
            disabled={!isPlayerTurn || aiThinking}
            placeholder={isPlayerTurn ? `اكتب كلمة تبدأ بـ "${requiredLetter.toUpperCase()}"...` : 'انتظر دور الذكاء الاصطناعي...'}
            className="flex-1 px-6 py-5 rounded-2xl outline-none text-xl font-bold disabled:opacity-50 transition-all backdrop-blur-[20px]"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.1)`, color: theme.colors.text }}
            dir="ltr" autoComplete="off" />
          <button onClick={handleSubmit} disabled={!isPlayerTurn || aiThinking || !input.trim()}
            className="px-8 py-5 rounded-2xl font-bold text-white disabled:opacity-40 transition-all hover:scale-105 active:scale-95 shadow-xl"
            style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
            <Send size={28} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}