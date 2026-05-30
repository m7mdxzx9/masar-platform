import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Clock, Star, Swords, RotateCcw, Send, Crown, Skull, Zap, Shield, Tag, AlertCircle, Download, List, X, Volume2, Search, Cloud } from 'lucide-react'
import { useTheme } from '@/theme/ThemeContext'
import wordsByLetter from '@/data/wordList'
import { API_BASE_URL, agentsAPI } from '@/services/api'
import { getInstantTranslation, FULL_DICTIONARY, LOCAL_DICTIONARY } from '@/services/dictionary'
import { useVocabularyStore } from '@/stores/vocabularyStore'

function speakWord(word: string) {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = 'en-US'
    window.speechSynthesis.speak(utterance)
  }
}

type GameMode = 'classic' | 'speed' | 'hard' | 'category' | 'attack' | 'zen' | 'boss'
type GameState = 'menu' | 'playing' | 'victory' | 'defeat'
type Player = 'player' | 'ai'

interface WordEntry {
  word: string
  translation: string
  meanings?: string[]
  player: Player
  timestamp: Date
  id?: string
}

const CATEGORIES = ['Animals', 'Technology', 'Food', 'Science', 'Nature']

const CATEGORY_WORDS: Record<string, Set<string>> = {
  Animals: new Set([
    'animal', 'ant', 'bear', 'bird', 'camel', 'cat', 'cheetah', 'chicken', 'cow', 'crab', 'deer', 'dog', 'dolphin', 'duck', 'eagle', 'elephant', 'fish', 'fox', 'frog', 'gecko', 'giraffe', 'hippo', 'horse', 'koala', 'leopard', 'lion', 'lizard', 'lobster', 'monkey', 'mouse', 'okapi', 'owl', 'panda', 'parrot', 'peacock', 'penguin', 'pig', 'rabbit', 'rat', 'shark', 'sheep', 'snake', 'spider', 'swan', 'tiger', 'turtle', 'whale', 'wolf', 'zebra'
  ]),
  Technology: new Set([
    'apple', 'battery', 'cable', 'camera', 'chip', 'cloud', 'code', 'computer', 'cyber', 'data', 'database', 'device', 'digital', 'drive', 'email', 'game', 'google', 'hardware', 'intel', 'internet', 'keyboard', 'laptop', 'link', 'memory', 'mobile', 'mouse', 'network', 'nvidia', 'online', 'phone', 'printer', 'processor', 'program', 'python', 'robot', 'router', 'screen', 'server', 'smart', 'software', 'switch', 'tablet', 'virtual', 'website'
  ]),
  Food: new Set([
    'apple', 'banana', 'beef', 'beer', 'berry', 'bread', 'burger', 'butter', 'cake', 'candy', 'carrot', 'cheese', 'chicken', 'coffee', 'cookie', 'egg', 'fish', 'garlic', 'grape', 'honey', 'juice', 'lemon', 'lettuce', 'lime', 'mango', 'meat', 'melon', 'milk', 'noodle', 'onion', 'orange', 'pasta', 'peach', 'pear', 'pepper', 'pie', 'pizza', 'plum', 'potato', 'rice', 'salad', 'salt', 'sandwich', 'soup', 'strawberry', 'sugar', 'tea', 'tomato', 'water', 'wine', 'yogurt'
  ]),
  Science: new Set([
    'acid', 'atom', 'base', 'biology', 'carbon', 'cell', 'chemistry', 'climate', 'comet', 'dna', 'earth', 'electron', 'energy', 'force', 'fossil', 'galaxy', 'gas', 'geology', 'gravity', 'heat', 'hydrogen', 'laser', 'light', 'liquid', 'math', 'metal', 'meteor', 'molecule', 'neutron', 'nitrogen', 'orbit', 'oxygen', 'physics', 'planet', 'proton', 'radiation', 'rna', 'rock', 'science', 'solid', 'sound', 'space', 'star', 'theory', 'volcano', 'water', 'wave', 'weather'
  ]),
  Nature: new Set([
    'air', 'autumn', 'beach', 'cave', 'cloud', 'coast', 'desert', 'dirt', 'earth', 'fire', 'flower', 'forest', 'grass', 'green', 'hill', 'ice', 'island', 'jungle', 'lake', 'leaf', 'light', 'lightning', 'moon', 'mountain', 'nature', 'ocean', 'plant', 'rain', 'river', 'rock', 'sand', 'sea', 'shadow', 'sky', 'snow', 'spring', 'stone', 'storm', 'summer', 'sun', 'thunder', 'tree', 'valley', 'water', 'wind', 'winter', 'wood'
  ])
}

const MODE_INFO: Record<GameMode, { label: string; labelAr: string; icon: any; desc: string }> = {
  classic: { label: 'Classic', labelAr: 'كلاسيكي', icon: Swords, desc: 'بدون حدود زمنية أو قيود' },
  speed: { label: 'Speed', labelAr: 'سريع', icon: Zap, desc: '15 ثانية لكل دور' },
  hard: { label: 'Hard', labelAr: 'صعب', icon: Shield, desc: 'الحد الأدنى 5 أحرف، بدون أسماء علم' },
  category: { label: 'Category', labelAr: 'تصنيف', icon: Tag, desc: 'كلمات من فئة محددة فقط' },
  attack: { label: 'Time Attack', labelAr: 'هجوم الوقت', icon: Clock, desc: '60 ثانية إجمالاً، تضاف 3 ثوانٍ لكل إجابة صحيحة' },
  zen: { label: 'Zen', labelAr: 'استرخاء', icon: RotateCcw, desc: 'طور هادئ لتعلم الكلمات وترجمتها دون ضغط أو خسارة' },
  boss: { label: 'Boss Battle', labelAr: 'مواجهة الزعيم', icon: Crown, desc: 'مواجهة صعبة ضد ذكاء اصطناعي سريع يستخدم كلمات طويلة جداً (10 ثوانٍ للدور)' },
}

function getAIWord(lastLetter: string, usedWords: Set<string>, mode: GameMode, category: string): string | null {
  const letter = lastLetter.toLowerCase()
  const candidates = wordsByLetter[letter] || []
  let available = candidates.filter(w => !usedWords.has(w.toLowerCase()))
  
  if (mode === 'category' && category && CATEGORY_WORDS[category]) {
    const catSet = CATEGORY_WORDS[category]
    const catFiltered = available.filter(w => catSet.has(w.toLowerCase()))
    if (catFiltered.length > 0) {
      available = catFiltered
    }
  } else if (mode === 'hard') {
    available = available.filter(w => w.length >= 5)
  } else if (mode === 'boss') {
    available = available.filter(w => w.length >= 6)
  }
  
  if (available.length === 0) {
    if (mode === 'category' || mode === 'boss') {
      const fallbackAvailable = candidates.filter(w => !usedWords.has(w.toLowerCase()))
      if (fallbackAvailable.length === 0) return null
      return fallbackAvailable[Math.floor(Math.random() * fallbackAvailable.length)]
    }
    return null
  }
  return available[Math.floor(Math.random() * available.length)]
}

function isWordValidLocal(word: string): boolean {
  const firstLetter = word[0].toLowerCase()
  const list = wordsByLetter[firstLetter] || []
  return list.some(w => w.toLowerCase() === word)
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
  const historyContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [showWordLog, setShowWordLog] = useState(false)
  const [showLedger, setShowLedger] = useState(false)
  const [ledgerSearch, setLedgerSearch] = useState('')
  const vocabularyWords = useVocabularyStore(s => s.words)

  const scrollToBottom = useCallback((behavior: 'smooth' | 'auto' = 'smooth') => {
    if (historyContainerRef.current) {
      historyContainerRef.current.scrollTo({
        top: historyContainerRef.current.scrollHeight,
        behavior
      })
    }
  }, [])

  const exportWordLog = useCallback(() => {
    const logData = history.map(h => ({
      word: h.word,
      translation: h.translation,
      player: h.player === 'player' ? 'أنت' : 'الذكاء الاصطناعي',
      timestamp: h.timestamp.toISOString(),
      valid: true,
    }))
    const json = JSON.stringify({ game: 'Word Chain Duel', mode: MODE_INFO[mode].labelAr, score, words: logData }, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `word-chain-log-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [history, mode, score])

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  useEffect(() => {
    scrollToBottom('smooth')
    const t = setTimeout(() => scrollToBottom('smooth'), 100)
    return () => clearTimeout(t)
  }, [history, aiThinking, scrollToBottom])

  useEffect(() => {
    if (gameState === 'playing') {
      if (mode === 'speed' && isPlayerTurn) {
        setTimer(15)
        clearTimer()
        timerRef.current = setInterval(() => {
          setTimer(prev => {
            if (prev <= 1) { clearTimer(); endGame('ai'); return 0 }
            return prev - 1
          })
        }, 1000)
      } else if (mode === 'boss' && isPlayerTurn) {
        setTimer(10)
        clearTimer()
        timerRef.current = setInterval(() => {
          setTimer(prev => {
            if (prev <= 1) { clearTimer(); endGame('ai'); return 0 }
            return prev - 1
          })
        }, 1000)
      } else if (mode === 'attack') {
        clearTimer()
        timerRef.current = setInterval(() => {
          setTimer(prev => {
            if (prev <= 1) { clearTimer(); endGame('ai'); return 0 }
            return prev - 1
          })
        }, 1000)
      } else {
        clearTimer()
      }
    } else {
      clearTimer()
    }
    return clearTimer
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlayerTurn, gameState, mode])

  const endGame = useCallback((w: Player) => {
    if (mode === 'zen') return
    clearTimer()
    setWinner(w)
    setGameState(w === 'player' ? 'victory' : 'defeat')
    
    // Save match to persistent database ledger in background
    useVocabularyStore.getState().recordMatch(
      score,
      mode,
      history.length,
      history.map(h => h.word)
    )
  }, [clearTimer, mode, score, history])

  // Auto-focus input when it's player's turn
  useEffect(() => {
    if (isPlayerTurn && gameState === 'playing') {
      inputRef.current?.focus()
    }
  }, [isPlayerTurn, gameState])

  // Polysemy details modal
  const [selectedWord, setSelectedWord] = useState<WordEntry | null>(null)

  const addWord = useCallback((word: string, player: Player) => {
    const tempId = Date.now().toString() + Math.random().toString()
    
    // Resolve translation instantly, and update persistent store in background
    const local = getInstantTranslation(word, (meanings, text) => {
      setHistory(prev =>
        prev.map(item =>
          item.id === tempId ? { ...item, translation: text, meanings } : item
        )
      )
      useVocabularyStore.getState().addWord(word, meanings)
    })

    // Save initial word to persistent store instantly
    useVocabularyStore.getState().addWord(word, local.meanings)

    const entry: WordEntry = {
      word,
      translation: local.text,
      meanings: local.meanings,
      player,
      timestamp: new Date(),
      id: tempId
    }
    
    setHistory(prev => [...prev, entry])
    setUsedWords(prev => { const s = new Set(prev); s.add(word.toLowerCase()); return s })
    setRequiredLetter(word[word.length - 1].toLowerCase())

    if (player === 'player') {
      let pts = 10
      if (word.length > 7) pts += 25
      if (mode === 'hard') pts += 50
      if (mode === 'boss') pts += 20
      setScore(prev => prev + pts)
    }

    setTimeout(() => scrollToBottom('smooth'), 50)
  }, [mode, scrollToBottom])

  const startGame = useCallback(async () => {
    setHistory([]); setUsedWords(new Set()); setScore(0); setError('')
    setIsPlayerTurn(false); setWinner(null); setGameState('playing')
    
    if (mode === 'attack') {
      setTimer(60)
    } else if (mode === 'speed') {
      setTimer(15)
    } else if (mode === 'boss') {
      setTimer(10)
    } else {
      setTimer(15)
    }
    
    setAiThinking(true)

    // AI picks first word
    const letters = Object.keys(wordsByLetter)
    const randomLetter = letters[Math.floor(Math.random() * letters.length)]
    const firstWord = getAIWord(randomLetter, new Set(), mode, category)
    if (!firstWord) { setAiThinking(false); return }

    await new Promise(r => setTimeout(r, 800))
    addWord(firstWord, 'ai')
    setAiThinking(false)
    setIsPlayerTurn(true)
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [addWord, mode, category])

  const aiTurn = useCallback(async (lastLetter: string, currentUsed: Set<string>) => {
    setAiThinking(true)
    const delay = mode === 'boss' ? (300 + Math.random() * 300) : (600 + Math.random() * 1000)
    await new Promise(r => setTimeout(r, delay))
    const aiWord = getAIWord(lastLetter, currentUsed, mode, category)
    if (!aiWord) { setAiThinking(false); endGame('player'); return }
    addWord(aiWord, 'ai')
    setAiThinking(false)
    setIsPlayerTurn(true)
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [addWord, endGame, mode, category])

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || aiThinking || !isPlayerTurn) return
    const word = input.trim().toLowerCase()
    setError('')

    if (word[0] !== requiredLetter) { setError(`يجب أن تبدأ الكلمة بحرف "${requiredLetter.toUpperCase()}"`); setTimeout(() => inputRef.current?.focus(), 0); return }
    if (usedWords.has(word)) { setError('هذه الكلمة استُخدمت من قبل!'); setTimeout(() => inputRef.current?.focus(), 0); return }
    if (mode === 'hard' && word.length < 5) { setError('يجب أن تكون الكلمة 5 أحرف على الأقل!'); setTimeout(() => inputRef.current?.focus(), 0); return }
    if (mode === 'category' && category && CATEGORY_WORDS[category]) {
      if (!CATEGORY_WORDS[category].has(word)) {
        setError(`يجب أن تنتمي الكلمة لفئة "${category}"!`);
        setTimeout(() => inputRef.current?.focus(), 0);
        return
      }
    }

    setIsPlayerTurn(false)
    setInput('')

    // Lag-free instant local check
    let valid = isWordValidLocal(word)
    if (!valid) {
      // Check full loaded and local CS dictionaries
      valid = !!(FULL_DICTIONARY[word] || LOCAL_DICTIONARY[word])
    }
    if (!valid) {
      // Check cached translated words
      const trans = getInstantTranslation(word)
      valid = trans.isInstant
    }
    if (!valid) {
      // Fallback to online API
      valid = await isRealWord(word)
    }

    if (!valid) {
      setError('هذه ليست كلمة إنجليزية صحيحة في قاموسنا المحلي!')
      setIsPlayerTurn(true)
      setTimeout(() => inputRef.current?.focus(), 0)
      return
    }

    addWord(word, 'player')
    if (mode === 'attack') {
      setTimer(prev => Math.min(prev + 3, 99))
    }
    const newUsed = new Set(usedWords); newUsed.add(word)
    const lastChar = word[word.length - 1].toLowerCase()
    aiTurn(lastChar, newUsed)
  }, [input, aiThinking, isPlayerTurn, requiredLetter, usedWords, mode, category, addWord, aiTurn])

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

        <button onClick={() => {
          useVocabularyStore.getState().fetchVocabulary();
          setShowLedger(true);
        }}
          className="w-full py-4 rounded-2xl text-lg font-bold text-white transition-all hover:scale-[1.02] backdrop-blur-md"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          📖 دفتر مفرداتي (Vocabulary Ledger)
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
        {(mode === 'speed' || mode === 'attack') && (
          <div className="flex items-center gap-3 px-6 py-3 rounded-2xl backdrop-blur-md shadow-lg" style={{ backgroundColor: timer <= 5 ? theme.colors.error + '20' : 'rgba(255, 255, 255, 0.03)', border: `1px solid ${timer <= 5 ? theme.colors.error + '50' : 'rgba(255, 255, 255, 0.06)'}` }}>
            <Clock size={24} style={{ color: timer <= 5 ? theme.colors.error : theme.colors.warning }} className={timer <= 5 ? 'animate-pulse' : ''} />
            <span className="text-2xl font-black tabular-nums" style={{ color: timer <= 5 ? theme.colors.error : theme.colors.text }}>{timer}s</span>
          </div>
        )}
        <button onClick={() => endGame('ai')} className="px-6 py-3 rounded-2xl text-sm font-bold transition-colors hover:bg-red-500/20 hover:text-red-400"
          style={{ color: theme.colors.textMuted, backgroundColor: 'rgba(255,255,255,0.05)' }}>استسلام</button>
      </div>

      {/* AI's last word display */}
      {lastAIEntry && (
        <div className="flex items-center gap-4 px-6 py-3 rounded-2xl shrink-0 backdrop-blur-[30px] shadow-lg relative overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid rgba(255,255,255,0.08)` }}>
          <div className="absolute inset-0 opacity-5" style={{ background: `linear-gradient(45deg, ${theme.colors.secondary}, ${theme.colors.accent})` }} />
          <span className="text-sm font-bold relative z-10 whitespace-nowrap" style={{ color: theme.colors.textMuted }}>🤖 {lastAIEntry.word}</span>
          <span className="text-sm relative z-10" style={{ color: theme.colors.textDark }}>→ {lastAIEntry.translation}</span>
          <div className="flex items-center gap-2 mr-auto relative z-10">
            <span className="text-xs font-medium" style={{ color: theme.colors.textMuted }}>ابدأ بـ:</span>
            <span className="text-2xl font-black" style={{ color: theme.colors.accent }}>{requiredLetter.toUpperCase()}</span>
          </div>
        </div>
      )}

      {/* Word history chat bubbles */}
      <div ref={historyContainerRef} className="flex-1 min-h-0 overflow-y-auto rounded-3xl p-6 backdrop-blur-[20px] shadow-inner" style={{ backgroundColor: 'rgba(0,0,0,0.2)', border: `1px solid rgba(255,255,255,0.05)` }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <List size={16} style={{ color: theme.colors.textMuted }} />
            <span className="text-sm font-bold" style={{ color: theme.colors.textMuted }}>سجل الكلمات ({history.length})</span>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button onClick={exportWordLog} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all hover:bg-white/10"
                style={{ color: theme.colors.textMuted, border: `1px solid rgba(255,255,255,0.1)` }}>
                <Download size={12} />
                تصدير السجل
              </button>
            )}
            <button onClick={() => setShowWordLog(!showWordLog)} className="text-xs px-3 py-1.5 rounded-xl transition-all hover:bg-white/10"
              style={{ color: theme.colors.accent, border: `1px solid ${theme.colors.accent}40` }}>
              {showWordLog ? 'إخفاء السجل' : 'عرض السجل'}
            </button>
          </div>
        </div>

        {showWordLog && history.length > 0 && (
          <div className="mb-4 rounded-2xl overflow-hidden" style={{ border: `1px solid rgba(255,255,255,0.08)` }}>
            <div className="grid grid-cols-4 gap-2 px-4 py-2 text-xs font-bold" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: theme.colors.textMuted, borderBottom: `1px solid rgba(255,255,255,0.08)` }}>
              <span>الكلمة</span>
              <span>الترجمة</span>
              <span>اللاعب</span>
              <span>الحالة</span>
            </div>
            {history.map((h, i) => (
              <div key={i} className="grid grid-cols-4 gap-2 px-4 py-2 text-sm"
                style={{
                  backgroundColor: h.player === 'player' ? `${theme.colors.accent}08` : `${theme.colors.secondary}08`,
                  borderBottom: i < history.length - 1 ? `1px solid rgba(255,255,255,0.04)` : 'none',
                }}>
                <span className="font-bold" style={{ color: theme.colors.text }}>{h.word}</span>
                <span style={{ color: theme.colors.textMuted }}>{h.translation}</span>
                <span style={{ color: h.player === 'player' ? theme.colors.accent : theme.colors.secondary }}>
                  {h.player === 'player' ? 'أنت' : 'الذكاء الاصطناعي'}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs" style={{ color: theme.colors.success }}>صحيحة</span>
                </span>
              </div>
            ))}
          </div>
        )}

        <AnimatePresence initial={false}>
          {history.map((h, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: h.player === 'player' ? 30 : -30 }} animate={{ opacity: 1, x: 0 }}
              className={`flex ${h.player === 'player' ? 'justify-end' : 'justify-start'} mb-4`}>
              <div 
                onClick={() => {
                  speakWord(h.word);
                  setSelectedWord(h);
                }}
                className="px-5 py-3 rounded-2xl max-w-[70%] shadow-lg cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center gap-2" 
                style={{
                  backgroundColor: h.player === 'player' ? theme.colors.accent + '15' : theme.colors.secondary + '15',
                  border: `1px solid ${h.player === 'player' ? theme.colors.accent + '30' : theme.colors.secondary + '30'}`,
                  borderRadius: h.player === 'player' ? '20px 20px 4px 20px' : '20px 20px 20px 4px'
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg" style={{ color: h.player === 'player' ? theme.colors.text : theme.colors.text }}>{h.word}</span>
                  <span className="text-sm" style={{ color: theme.colors.textDark }}>{h.translation}</span>
                  <Volume2 size={14} className="opacity-40 hover:opacity-100 transition-opacity" style={{ color: h.player === 'player' ? theme.colors.accent : theme.colors.secondary }} />
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
            onFocus={() => {
              setTimeout(() => {
                scrollToBottom('smooth')
              }, 150)
            }}
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

      {/* Polysemy Meaning Modal */}
      <AnimatePresence>
        {selectedWord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-6 rounded-3xl backdrop-blur-[30px] border shadow-2xl text-right"
              style={{ backgroundColor: '#131926', borderColor: 'rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center justify-between mb-6">
                <button onClick={() => setSelectedWord(null)} className="p-2 rounded-xl hover:bg-white/5 transition-colors">
                  <X size={20} style={{ color: theme.colors.textMuted }} />
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={() => speakWord(selectedWord.word)} className="p-1.5 rounded-lg hover:bg-white/10 text-accent transition-colors">
                    <Volume2 size={18} />
                  </button>
                  <h3 className="text-2xl font-black text-white">{selectedWord.word}</h3>
                </div>
              </div>
              
              <p className="text-sm mb-4 font-bold text-left" style={{ color: theme.colors.accent, direction: 'rtl' }}>جميع المعاني والسياقات المتاحة:</p>
              
              <div className="space-y-3" style={{ direction: 'rtl' }}>
                {selectedWord.meanings && selectedWord.meanings.length > 0 ? (
                  selectedWord.meanings.map((meaning, index) => (
                    <div key={index} className="p-4 rounded-2xl border text-sm font-medium transition-all text-white text-right"
                      style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                      <span className="text-white/40 ml-2">{index + 1}.</span> {meaning}
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-2xl border text-sm font-medium text-white/60 text-right"
                    style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                    {selectedWord.translation}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Vocabulary Ledger Modal */}
      <AnimatePresence>
        {showLedger && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl p-6 rounded-3xl backdrop-blur-[30px] border shadow-2xl text-right flex flex-col max-h-[85vh]"
              style={{ backgroundColor: '#131926', borderColor: 'rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center justify-between mb-6 shrink-0">
                <button onClick={() => setShowLedger(false)} className="p-2 rounded-xl hover:bg-white/5 transition-colors">
                  <X size={20} style={{ color: theme.colors.textMuted }} />
                </button>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-accent/20 text-accent">{vocabularyWords.length} كلمة</span>
                  <h3 className="text-2xl font-black text-white">دفتر الكلمات الدائم (Vocabulary Ledger)</h3>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative mb-4 shrink-0" style={{ direction: 'rtl' }}>
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                <input
                  type="text"
                  placeholder="ابحث عن كلمة..."
                  value={ledgerSearch}
                  onChange={e => setLedgerSearch(e.target.value)}
                  className="w-full pr-12 pl-4 py-3 rounded-2xl outline-none border transition-all text-white text-right"
                  style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}
                />
              </div>

              {/* Word List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin" style={{ direction: 'rtl' }}>
                {vocabularyWords
                  .filter(w => w.word.toLowerCase().includes(ledgerSearch.toLowerCase()))
                  .map((w, index) => (
                    <div key={index} className="p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                      style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                      <div className="text-right flex-1">
                        <div className="flex items-center gap-3 justify-start mb-2">
                          <span className="text-xl font-bold text-white">{w.word}</span>
                          <button onClick={() => speakWord(w.word)} className="p-1.5 rounded-lg hover:bg-white/10 text-accent transition-colors" title="استمع للنطق">
                            <Volume2 size={18} />
                          </button>
                          {w.is_local_only && (
                            <span className="flex items-center gap-1 text-xs text-yellow-500" title="بانتظار المزامنة">
                              <Cloud size={14} /> Local
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {w.meanings.map((m, mIdx) => (
                            <span key={mIdx} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/5 text-white/70">
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                {vocabularyWords.filter(w => w.word.toLowerCase().includes(ledgerSearch.toLowerCase())).length === 0 && (
                  <p className="text-center text-white/40 py-8">لا توجد كلمات مطابقة للبحث.</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}