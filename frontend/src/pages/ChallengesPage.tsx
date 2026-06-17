import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Clock, Star, Swords, RotateCcw, Send, Crown, Skull, Zap, Shield, Tag, AlertCircle, Download, List, X, Volume2, Search, Cloud, Sparkles, HelpCircle, Code, Calculator, LayoutGrid } from 'lucide-react'
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

// Types
type ActiveGame = 'menu' | 'word-chain' | 'code-debugging' | 'vocab-blitz' | 'math-duel' | 'prompt-crafting'
type WordChainMode = 'classic' | 'speed' | 'hard' | 'category' | 'attack' | 'zen' | 'boss'
type WordChainState = 'menu' | 'playing' | 'victory' | 'defeat'
type Player = 'player' | 'ai'

interface WordEntry {
  word: string
  translation: string
  meanings?: string[]
  player: Player
  timestamp: Date
  id?: string
}

// ----------------------------------------------------
// Game 2: Code Debugging Data
// ----------------------------------------------------
interface DebugQuestion {
  code: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

const DEBUG_QUESTIONS: DebugQuestion[] = [
  {
    code: `def calculate_sum(a, b)\n    return a + b`,
    question: 'ما هو الخطأ في هذا الكود البرمجي؟',
    options: [
      'إضافة نقطتين (:) في نهاية سطر تعريف الدالة',
      'حذف الكلمة المفتاحية def وتغييرها لـ function',
      'يجب وضع المتغيرات بين علامتي اقتباس',
      'لا يوجد أي خطأ برمجي في الكود المكتوب'
    ],
    correctIndex: 0,
    explanation: 'في لغة بايثون، يجب وضع نقطتين (:) في نهاية سطر تعريف الدالة `def function_name(args):`.'
  },
  {
    code: `my_list = [1, 2, 3]\nprint(my_list[3])`,
    question: 'ماذا سيحدث عند تشغيل هذا الكود؟',
    options: [
      'سيتم طباعة الرقم 3 بنجاح',
      'خطأ في الفهرسة: الفهرس خارج نطاق القائمة (IndexError)',
      'خطأ في الصياغة (SyntaxError)',
      'سيتم طباعة القيمة None'
    ],
    correctIndex: 1,
    explanation: 'حجم القائمة هو 3 عناصر، وفهرستها تبدأ من 0 إلى 2. محاولة الوصول للمؤشر 3 تؤدي لخطأ IndexError.'
  },
  {
    code: `x = "10"\ny = 5\nprint(x + y)`,
    question: 'كيف يمكن تصحيح هذا الكود لجمع القيمتين رياضياً؟',
    options: [
      'print(int(x) + y)',
      'print(x + str(y))',
      'print(float(x) + str(y))',
      'لا يمكن جمع نص مع عدد صحيح في بايثون مطلقاً'
    ],
    correctIndex: 0,
    explanation: 'يجب تحويل النص "10" إلى عدد صحيح باستخدام الدالة `int()` ليصبح الجمع رياضياً ويعطي 15.'
  },
  {
    code: `for i in range(5)\nprint(i)`,
    question: 'ما هي المشكلة الأساسية في جملة التكرار المكتوبة؟',
    options: [
      'غياب النقطتين (:) في نهاية سطر for وعدم وجود مسافة بادئة للطباعة',
      'يجب استخدام الدالة loop بدلاً من for',
      'range(5) يجب أن تبدأ من 1',
      'المتغير i غير معرف مسبقاً'
    ],
    correctIndex: 0,
    explanation: 'تتطلب حلقة for في بايثون نقطتين في نهاية جملة الشرط، ووجود مسافة بادئة (Indentation) للسطور التابعة لها.'
  },
  {
    code: `my_dict = {"name": "Masar"}\nprint(my_dict.name)`,
    question: 'ما هو الأسلوب الصحيح لطباعة قيمة المفتاح "name"؟',
    options: [
      'print(my_dict["name"])',
      'print(my_dict->name)',
      'print(my_dict.get_name())',
      'print(get(my_dict, "name"))'
    ],
    correctIndex: 0,
    explanation: 'للوصول إلى قيمة مفتاح في القاموس، نستخدم الأقواس المربعة واسم المفتاح `dict[key]` أو دالة `dict.get(key)`.'
  }
]

// ----------------------------------------------------
// Game 3: AI Tech Vocab Blitz Data
// ----------------------------------------------------
interface VocabCard {
  id: string
  text: string
  type: 'en' | 'ar'
  pairId: number
  state: 'idle' | 'selected' | 'matched' | 'error'
}

const VOCAB_PAIRS = [
  { id: 1, en: 'Overfitting', ar: 'الفرط في التدريب' },
  { id: 2, en: 'Neural Network', ar: 'الشبكة العصبية' },
  { id: 3, en: 'Gradient Descent', ar: 'النزول التدريجي للمنحدر' },
  { id: 4, en: 'Transformer', ar: 'المحول (نموذج لغوي)' },
  { id: 5, en: 'Supervised Learning', ar: 'التعلم الخاضع للإشراف' },
  { id: 6, en: 'Reinforcement Learning', ar: 'التعلم التعزيزي' },
  { id: 7, en: 'Backpropagation', ar: 'الانتشار العكسي للخطأ' },
  { id: 8, en: 'Machine Learning', ar: 'تعلم الآلة' },
  { id: 9, en: 'Computer Vision', ar: 'الرؤية الحاسوبية' },
  { id: 10, en: 'Natural Language Processing', ar: 'معالجة اللغة الطبيعية' },
]

// ----------------------------------------------------
// Game 4: Math-AI Duel Data
// ----------------------------------------------------
interface MathQuestion {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

const MATH_QUESTIONS: MathQuestion[] = [
  {
    question: 'ما هي قيمة مخرجات دالة التفعيل ReLU عندما يكون المدخل x = -15؟',
    options: ['-15', '0', '1', '15'],
    correctIndex: 1,
    explanation: 'دالة ReLU تعيد الحد الأقصى بين 0 والمدخل: f(x) = max(0, x). للمدخل السالب تعيد 0.'
  },
  {
    question: 'ما هو المشتق الرياضي لدالة السيجمويد (Sigmoid) النشطة f(x)؟',
    options: ['f(x) * (1 - f(x))', '1 - f(x)', 'f(x) ^ 2', 'e^(-x)'],
    correctIndex: 0,
    explanation: 'مشتقة دالة Sigmoid تتميز بصيغتها البسيطة وتساوي حاصل ضرب القيمة في مكملها.'
  },
  {
    question: 'إذا كانت المصفوفة A بحجم 2x3 والمصفوفة B بحجم 3x5، ما هو حجم مصفوفة الضرب A * B؟',
    options: ['3x3', '2x3', '2x5', '5x2'],
    correctIndex: 2,
    explanation: 'حجم مصفوفة الناتج يأخذ عدد أسطر الأولى وعدد أعمدة الثانية فيكون الناتج 2x5.'
  },
  {
    question: 'أي من الدوال التالية تحصر المخرجات دائماً في النطاق بين -1 و 1؟',
    options: ['ReLU', 'tanh (الظل الزائدي)', 'Sigmoid', 'Softmax'],
    correctIndex: 1,
    explanation: 'دالة tanh تحصر القيم بين -1 و 1، بينما Sigmoid تحصر القيم بين 0 و 1.'
  },
  {
    question: 'ما هي الصيغة الرياضية لحساب الاعتلاج (Entropy) للاحتمالية P(x)؟',
    options: ['-∑ P(x) log P(x)', '∑ P(x) log P(x)', '-∑ P(x) e^P(x)', 'log P(x)'],
    correctIndex: 0,
    explanation: 'صيغة حساب الانتروبي هي السالب لمجموع جداء كل احتمال في لوغاريتم الاحتمال نفسه.'
  }
]

// ----------------------------------------------------
// Game 5: Prompt Crafting Arena Data
// ----------------------------------------------------
interface PromptChallenge {
  title: string
  description: string
  systemInstruction: string
  validationTip: string
  validate: (prompt: string) => { success: boolean; feedback: string }
}

const PROMPT_CHALLENGES: PromptChallenge[] = [
  {
    title: 'تحدي الكلمة الواحدة 🤫',
    description: 'اكتب أمراً للنموذج يجيب فيه بكلمة واحدة فقط: ما هي عاصمة فرنسا؟ (تأكد من إلزام النموذج بالدقة وبدون مقدمات)',
    systemInstruction: 'أجب بكلمة واحدة فقط وبدون شرح أو مقدمات.',
    validationTip: 'يجب أن يحتوي أمرك على كلمات إلزامية مثل "كلمة واحدة" أو "فقط" أو "دون شرح"، وأن يقل عن 100 حرف.',
    validate: (prompt: string) => {
      const p = prompt.toLowerCase()
      const hasWordLimit = p.includes('كلمة') || p.includes('word') || p.includes('one') || p.includes('واحد')
      const hasOnly = p.includes('فقط') || p.includes('only') || p.includes('دون') || p.includes('بلا')
      const hasCapital = p.includes('عاصمة') || p.includes('capital') || p.includes('فرنسا') || p.includes('france')
      
      if (prompt.length > 100) {
        return { success: false, feedback: 'الأمر طويل جداً (أكثر من 100 حرف)، يرجى الاختصار لزيادة التركيز.' }
      }
      if (!hasWordLimit) {
        return { success: false, feedback: 'لم تقم بتحديد حد الكلمة الواحدة في أمرك للنموذج.' }
      }
      if (!hasOnly) {
        return { success: false, feedback: 'تحتاج لإضافة كلمات حازمة تمنع النموذج من كتابة مقدمات مثل "فقط" أو "دون شرح".' }
      }
      if (!hasCapital) {
        return { success: false, feedback: 'تأكد من ذكر السؤال المباشر حول عاصمة فرنسا في أمرك.' }
      }
      return { success: true, feedback: 'ممتاز! أمرك واضح ومقيد بشكل كامل. استجابة النموذج: "باريس".' }
    }
  },
  {
    title: 'قالب البيانات الصارم 📁',
    description: 'اكتب أمراً يجعل الذكاء الاصطناعي يرد بصيغة JSON تحتوي على مفتاحين فقط: name و age.',
    systemInstruction: 'أنت خادم واجهة برمجة تطبيقات، يجب أن ترد بصيغة JSON حقيقية وصحيحة تحتوي على name و age فقط.',
    validationTip: 'يجب كتابة الكلمة JSON بشكل صريح في الأمر، وتحديد المفاتيح المطلوبة name و age.',
    validate: (prompt: string) => {
      const p = prompt.toLowerCase()
      const hasJson = p.includes('json') || p.includes('جيسون')
      const hasKeys = p.includes('name') && p.includes('age')
      
      if (!hasJson) {
        return { success: false, feedback: 'يجب إلزام النموذج بصيغة JSON بذكرها صراحة في نص الأمر.' }
      }
      if (!hasKeys) {
        return { success: false, feedback: 'لم تذكر المفاتيح المطلوبة name و age صراحة في الأمر.' }
      }
      return { success: true, feedback: 'رائع جداً! فرضت قيود الهيكلة بنجاح. استجابة النموذج: \n{\n  "name": "أحمد",\n  "age": 25\n}' }
    }
  },
  {
    title: 'تفسير ذكي وموجز 👶',
    description: 'اكتب أمراً يشرح مفهوم الحلقات التكرارية (Loops) لطفل في سن 6 سنوات باستخدام 15 كلمة أو أقل.',
    systemInstruction: 'اشرح الحلقات التكرارية لطفل صغير بأسلوب بسيط جداً وبأقل الكلمات.',
    validationTip: 'يجب أن تطلب شرحاً مبسطاً (لطفل أو 6 سنوات) وأن تضع قيداً لعدد الكلمات (15 كلمة) وأن يكون أمرك نفسه مختصراً.',
    validate: (prompt: string) => {
      const p = prompt.toLowerCase()
      const hasChild = p.includes('طفل') || p.includes('سنتين') || p.includes('سنوات') || p.includes('بسيط') || p.includes('طفلة')
      const hasWordConstraint = p.includes('كلمة') || p.includes('words') || p.includes('أقل')
      const wordCount = prompt.trim().split(/\s+/).length

      if (wordCount > 15) {
        return { success: false, feedback: 'الأمر المكتوب نفسه يجب ألا يتجاوز 15 كلمة، حاول كتابة أمر أقصر!' }
      }
      if (!hasChild) {
        return { success: false, feedback: 'لم تحدد الفئة المستهدفة (الأطفال) لتوجيه لغة الشرح المناسبة.' }
      }
      if (!hasWordConstraint) {
        return { success: false, feedback: 'يجب إضافة قيد لعدد الكلمات للشرح لتجبر النموذج على الإيجاز الشديد.' }
      }
      return { success: true, feedback: 'تصميم هندسي ممتاز ومختصر! استجابة النموذج: "التكرار مثل تدوير عجلة قطار الألعاب، تدور وتدور لتستمر في الحركة!"' }
    }
  }
]

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

const MODE_INFO: Record<WordChainMode, { label: string; labelAr: string; icon: any; desc: string }> = {
  classic: { label: 'Classic', labelAr: 'كلاسيكي', icon: Swords, desc: 'بدون حدود زمنية أو قيود' },
  speed: { label: 'Speed', labelAr: 'سريع', icon: Zap, desc: '15 ثانية لكل دور' },
  hard: { label: 'Hard', labelAr: 'صعب', icon: Shield, desc: 'الحد الأدنى 5 أحرف، بدون أسماء علم' },
  category: { label: 'Category', labelAr: 'تصنيف', icon: Tag, desc: 'كلمات من فئة محددة فقط' },
  attack: { label: 'Time Attack', labelAr: 'هجوم الوقت', icon: Clock, desc: '60 ثانية إجمالاً، تضاف 3 ثوانٍ لكل إجابة صحيحة' },
  zen: { label: 'Zen', labelAr: 'استرخاء', icon: RotateCcw, desc: 'طور هادئ لتعلم الكلمات وترجمتها دون ضغط أو خسارة' },
  boss: { label: 'Boss Battle', labelAr: 'مواجهة الزعيم', icon: Crown, desc: 'مواجهة صعبة ضد ذكاء اصطناعي سريع يستخدم كلمات طويلة جداً (10 ثوانٍ للدور)' },
}

function getAIWord(lastLetter: string, usedWords: Set<string>, mode: WordChainMode, category: string): string | null {
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
  const [activeGame, setActiveGame] = useState<ActiveGame>('menu')

  // ----------------------------------------------------
  // Game 1: Word Chain State & Logic
  // ----------------------------------------------------
  const [wcMode, setWcMode] = useState<WordChainMode>('classic')
  const [wcCategory, setWcCategory] = useState(CATEGORIES[0])
  const [wcGameState, setWcGameState] = useState<WordChainState>('menu')
  const [wcHistory, setWcHistory] = useState<WordEntry[]>([])
  const [wcUsedWords, setWcUsedWords] = useState<Set<string>>(new Set())
  const [wcScore, setWcScore] = useState(0)
  const [wcInput, setWcInput] = useState('')
  const [wcRequiredLetter, setWcRequiredLetter] = useState('')
  const [wcError, setWcError] = useState('')
  const [wcAiThinking, setWcAiThinking] = useState(false)
  const [wcTimer, setWcTimer] = useState(15)
  const [wcIsPlayerTurn, setWcIsPlayerTurn] = useState(false)
  const [wcWinner, setWcWinner] = useState<Player | null>(null)
  
  const wcTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
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
    const logData = wcHistory.map(h => ({
      word: h.word,
      translation: h.translation,
      player: h.player === 'player' ? 'أنت' : 'الذكاء الاصطناعي',
      timestamp: h.timestamp.toISOString(),
      valid: true,
    }))
    const json = JSON.stringify({ game: 'Word Chain Duel', mode: MODE_INFO[wcMode].labelAr, score: wcScore, words: logData }, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `word-chain-log-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [wcHistory, wcMode, wcScore])

  const clearWcTimer = useCallback(() => {
    if (wcTimerRef.current) { clearInterval(wcTimerRef.current); wcTimerRef.current = null }
  }, [])

  useEffect(() => {
    scrollToBottom('smooth')
    const t = setTimeout(() => scrollToBottom('smooth'), 100)
    return () => clearTimeout(t)
  }, [wcHistory, wcAiThinking, scrollToBottom])

  useEffect(() => {
    if (activeGame === 'word-chain' && wcGameState === 'playing') {
      if (wcMode === 'speed' && wcIsPlayerTurn) {
        setWcTimer(15)
        clearWcTimer()
        wcTimerRef.current = setInterval(() => {
          setWcTimer(prev => {
            if (prev <= 1) { clearWcTimer(); endWcGame('ai'); return 0 }
            return prev - 1
          })
        }, 1000)
      } else if (wcMode === 'boss' && wcIsPlayerTurn) {
        setWcTimer(10)
        clearWcTimer()
        wcTimerRef.current = setInterval(() => {
          setWcTimer(prev => {
            if (prev <= 1) { clearWcTimer(); endWcGame('ai'); return 0 }
            return prev - 1
          })
        }, 1000)
      } else if (wcMode === 'attack') {
        clearWcTimer()
        wcTimerRef.current = setInterval(() => {
          setWcTimer(prev => {
            if (prev <= 1) { clearWcTimer(); endWcGame('ai'); return 0 }
            return prev - 1
          })
        }, 1000)
      } else {
        clearWcTimer()
      }
    } else {
      clearWcTimer()
    }
    return clearWcTimer
  }, [wcIsPlayerTurn, wcGameState, wcMode, activeGame])

  const endWcGame = useCallback((w: Player) => {
    if (wcMode === 'zen') return
    clearWcTimer()
    setWcWinner(w)
    setWcGameState(w === 'player' ? 'victory' : 'defeat')
    
    useVocabularyStore.getState().recordMatch(
      wcScore,
      wcMode,
      wcHistory.length,
      wcHistory.map(h => h.word)
    )
  }, [clearWcTimer, wcMode, wcScore, wcHistory])

  const addWcWord = useCallback((word: string, player: Player) => {
    const tempId = Date.now().toString() + Math.random().toString()
    
    const local = getInstantTranslation(word, (meanings, text) => {
      setWcHistory(prev =>
        prev.map(item =>
          item.id === tempId ? { ...item, translation: text, meanings } : item
        )
      )
      useVocabularyStore.getState().addWord(word, meanings)
    })

    useVocabularyStore.getState().addWord(word, local.meanings)

    const entry: WordEntry = {
      word,
      translation: local.text,
      meanings: local.meanings,
      player,
      timestamp: new Date(),
      id: tempId
    }
    
    setWcHistory(prev => [...prev, entry])
    setWcUsedWords(prev => { const s = new Set(prev); s.add(word.toLowerCase()); return s })
    setWcRequiredLetter(word[word.length - 1].toLowerCase())

    if (player === 'player') {
      let pts = 10
      if (word.length > 7) pts += 25
      if (wcMode === 'hard') pts += 50
      if (wcMode === 'boss') pts += 20
      setWcScore(prev => prev + pts)
    }

    setTimeout(() => scrollToBottom('smooth'), 50)
  }, [wcMode, scrollToBottom])

  const startWcGame = useCallback(async () => {
    setWcHistory([]); setWcUsedWords(new Set()); setWcScore(0); setWcError('')
    setIsWcPlayerTurn(false); setWcWinner(null); setWcGameState('playing')
    
    if (wcMode === 'attack') {
      setWcTimer(60)
    } else if (wcMode === 'speed') {
      setWcTimer(15)
    } else if (wcMode === 'boss') {
      setWcTimer(10)
    } else {
      setWcTimer(15)
    }
    
    setWcAiThinking(true)

    const letters = Object.keys(wordsByLetter)
    const randomLetter = letters[Math.floor(Math.random() * letters.length)]
    const firstWord = getAIWord(randomLetter, new Set(), wcMode, wcCategory)
    if (!firstWord) { setWcAiThinking(false); return }

    await new Promise(r => setTimeout(r, 800))
    addWcWord(firstWord, 'ai')
    setWcAiThinking(false)
    setIsWcPlayerTurn(true)
  }, [addWcWord, wcMode, wcCategory])

  const [isWcPlayerTurn, setIsWcPlayerTurn] = useState(false)

  const triggerWcAITurn = useCallback(async (lastLetter: string, currentUsed: Set<string>) => {
    setWcAiThinking(true)
    const delay = wcMode === 'boss' ? (300 + Math.random() * 300) : (600 + Math.random() * 1000)
    await new Promise(r => setTimeout(r, delay))
    const aiWord = getAIWord(lastLetter, currentUsed, wcMode, wcCategory)
    if (!aiWord) { setWcAiThinking(false); endWcGame('player'); return }
    addWcWord(aiWord, 'ai')
    setWcAiThinking(false)
    setIsWcPlayerTurn(true)
  }, [addWcWord, endWcGame, wcMode, wcCategory])

  const handleWcPlayerSubmit = useCallback(async () => {
    if (!wcInput.trim() || wcAiThinking || !isWcPlayerTurn) return
    const word = wcInput.trim().toLowerCase()
    setWcError('')

    if (word[0] !== wcRequiredLetter) { setWcError(`يجب أن تبدأ الكلمة بحرف "${wcRequiredLetter.toUpperCase()}"`); return }
    if (wcUsedWords.has(word)) { setWcError('هذه الكلمة استُخدمت من قبل!'); return }
    if (wcMode === 'hard' && word.length < 5) { setWcError('يجب أن تكون الكلمة 5 أحرف على الأقل!'); return }
    if (wcMode === 'category' && wcCategory && CATEGORY_WORDS[wcCategory]) {
      if (!CATEGORY_WORDS[wcCategory].has(word)) {
        setWcError(`يجب أن تنتمي الكلمة لفئة "${wcCategory}"!`);
        return
      }
    }

    setIsWcPlayerTurn(false)
    setWcInput('')

    let valid = isWordValidLocal(word)
    if (!valid) {
      valid = !!(FULL_DICTIONARY[word] || LOCAL_DICTIONARY[word])
    }
    if (!valid) {
      const trans = getInstantTranslation(word)
      valid = trans.isInstant
    }
    if (!valid) {
      valid = await isRealWord(word)
    }

    if (!valid) {
      setWcError('هذه ليست كلمة إنجليزية صحيحة في قاموسنا المحلي!')
      setIsWcPlayerTurn(true)
      return
    }

    addWcWord(word, 'player')
    if (wcMode === 'attack') {
      setWcTimer(prev => Math.min(prev + 3, 99))
    }
    const newUsed = new Set(wcUsedWords); newUsed.add(word)
    const lastChar = word[word.length - 1].toLowerCase()
    triggerWcAITurn(lastChar, newUsed)
  }, [wcInput, wcAiThinking, isWcPlayerTurn, wcRequiredLetter, wcUsedWords, wcMode, wcCategory, addWcWord, triggerWcAITurn])

  // ----------------------------------------------------
  // Game 2: Code Debugging Race State & Logic
  // ----------------------------------------------------
  const [dbQuestionIndex, setDbQuestionIndex] = useState(0)
  const [dbScore, setDbScore] = useState(0)
  const [dbTimer, setDbTimer] = useState(30)
  const [dbSelectedOption, setDbSelectedOption] = useState<number | null>(null)
  const [dbGameState, setDbGameState] = useState<'playing' | 'feedback' | 'summary'>('playing')
  const [dbIsCorrect, setDbIsCorrect] = useState<boolean | null>(null)
  const dbTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearDbTimer = () => {
    if (dbTimerRef.current) {
      clearInterval(dbTimerRef.current)
      dbTimerRef.current = null
    }
  }

  const startDbGame = () => {
    setDbQuestionIndex(0)
    setDbScore(0)
    setDbTimer(30)
    setDbSelectedOption(null)
    setDbGameState('playing')
    setDbIsCorrect(null)
    startDbQuestionTimer()
  }

  const startDbQuestionTimer = () => {
    clearDbTimer()
    setDbTimer(30)
    dbTimerRef.current = setInterval(() => {
      setDbTimer(prev => {
        if (prev <= 1) {
          clearDbTimer()
          handleDbAnswer(-1) // Time out
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleDbAnswer = (optionIdx: number) => {
    clearDbTimer()
    setDbSelectedOption(optionIdx)
    const currentQ = DEBUG_QUESTIONS[dbQuestionIndex]
    const correct = optionIdx === currentQ.correctIndex
    setDbIsCorrect(correct)
    
    if (correct) {
      const roundPts = 20 + dbTimer
      setDbScore(prev => prev + roundPts)
    }
    setDbGameState('feedback')
  }

  const handleNextDbQuestion = () => {
    if (dbQuestionIndex < DEBUG_QUESTIONS.length - 1) {
      setDbQuestionIndex(prev => prev + 1)
      setDbSelectedOption(null)
      setDbIsCorrect(null)
      setDbGameState('playing')
      startDbQuestionTimer()
    } else {
      setDbGameState('summary')
    }
  }

  // ----------------------------------------------------
  // Game 3: AI Tech Vocab Blitz State & Logic
  // ----------------------------------------------------
  const [blitzCards, setBlitzCards] = useState<VocabCard[]>([])
  const [blitzSelectedEnId, setBlitzSelectedEnId] = useState<string | null>(null)
  const [blitzSelectedArId, setBlitzSelectedArId] = useState<string | null>(null)
  const [blitzRoundsPlayed, setBlitzRoundsPlayed] = useState(0)
  const [blitzScore, setBlitzScore] = useState(0)
  const [blitzGameState, setBlitzGameState] = useState<'playing' | 'victory'>('playing')
  const [blitzBusy, setBlitzBusy] = useState(false)

  const startBlitzGame = () => {
    setBlitzScore(0)
    setBlitzRoundsPlayed(0)
    setBlitzGameState('playing')
    setBlitzSelectedEnId(null)
    setBlitzSelectedArId(null)
    setBlitzBusy(false)
    generateBlitzCards()
  }

  const generateBlitzCards = () => {
    const shuffledPairs = [...VOCAB_PAIRS].sort(() => 0.5 - Math.random())
    const selectedPairs = shuffledPairs.slice(0, 4)

    const cardsList: VocabCard[] = []
    selectedPairs.forEach(pair => {
      cardsList.push({
        id: `en-${pair.id}`,
        text: pair.en,
        type: 'en',
        pairId: pair.id,
        state: 'idle'
      })
      cardsList.push({
        id: `ar-${pair.id}`,
        text: pair.ar,
        type: 'ar',
        pairId: pair.id,
        state: 'idle'
      })
    })

    setBlitzCards(cardsList.sort(() => 0.5 - Math.random()))
  }

  const handleBlitzCardPress = (card: VocabCard) => {
    if (blitzBusy || card.state === 'matched' || card.state === 'selected') return

    let nextEnId = blitzSelectedEnId
    let nextArId = blitzSelectedArId

    if (card.type === 'en') {
      nextEnId = card.id
      setBlitzSelectedEnId(card.id)
    } else {
      nextArId = card.id
      setBlitzSelectedArId(card.id)
    }

    setBlitzCards(prev => prev.map(c => {
      if (c.id === card.id) return { ...c, state: 'selected' }
      if (c.type === card.type && c.state === 'selected') return { ...c, state: 'idle' }
      return c
    }))

    if (nextEnId && nextArId) {
      setBlitzBusy(true)
      const enCard = blitzCards.find(c => c.id === nextEnId)
      const arCard = blitzCards.find(c => c.id === nextArId)

      if (enCard && arCard && enCard.pairId === arCard.pairId) {
        setBlitzScore(prev => prev + 25)
        setTimeout(() => {
          setBlitzCards(prev => {
            const nextList = prev.map(c => {
              if (c.id === nextEnId || c.id === nextArId) {
                return { ...c, state: 'matched' as const }
              }
              return c
            })

            const allMatched = nextList.every(c => c.state === 'matched')
            if (allMatched) {
              const nextRound = blitzRoundsPlayed + 1
              setBlitzRoundsPlayed(nextRound)
              if (nextRound < 3) {
                generateBlitzCards()
              } else {
                setBlitzGameState('victory')
              }
            }

            return nextList
          })
          setBlitzSelectedEnId(null)
          setBlitzSelectedArId(null)
          setBlitzBusy(false)
        }, 400)
      } else {
        setTimeout(() => {
          setBlitzCards(prev => prev.map(c => {
            if (c.id === nextEnId || c.id === nextArId) {
              return { ...c, state: 'error' as const }
            }
            return c
          }))
        }, 150)

        setTimeout(() => {
          setBlitzCards(prev => prev.map(c => {
            if (c.id === nextEnId || c.id === nextArId) {
              return { ...c, state: 'idle' as const }
            }
            return c
          }))
          setBlitzSelectedEnId(null)
          setBlitzSelectedArId(null)
          setBlitzBusy(false)
        }, 800)
      }
    }
  }

  // ----------------------------------------------------
  // Game 4: Math-AI Duel State & Logic
  // ----------------------------------------------------
  const [mathUserHP, setMathUserHP] = useState(100)
  const [mathAiHP, setMathAiHP] = useState(100)
  const [mathQuestionIndex, setMathQuestionIndex] = useState(0)
  const [mathTimer, setMathTimer] = useState(10)
  const [mathGameState, setMathGameState] = useState<'playing' | 'feedback' | 'victory' | 'defeat'>('playing')
  const [mathSelectedOption, setMathSelectedOption] = useState<number | null>(null)
  const [mathAiSelectedOption, setMathAiSelectedOption] = useState<number | null>(null)
  const [mathRoundStatus, setMathRoundStatus] = useState<'user_won' | 'ai_won' | 'both_wrong' | 'waiting'>('waiting')
  
  const mathTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const aiActionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearMathTimers = () => {
    if (mathTimerRef.current) clearInterval(mathTimerRef.current)
    if (aiActionTimerRef.current) clearTimeout(aiActionTimerRef.current)
  }

  const startMathGame = () => {
    setMathUserHP(100)
    setMathAiHP(100)
    setMathQuestionIndex(0)
    setMathGameState('playing')
    setMathSelectedOption(null)
    setMathAiSelectedOption(null)
    setMathRoundStatus('waiting')
    startMathRound()
  }

  const startMathRound = () => {
    clearMathTimers()
    setMathTimer(10)
    setMathSelectedOption(null)
    setMathAiSelectedOption(null)
    setMathRoundStatus('waiting')

    const aiThinkTime = (Math.random() * 3 + 3) * 1000
    aiActionTimerRef.current = setTimeout(() => {
      const currentQ = MATH_QUESTIONS[mathQuestionIndex]
      const correctOption = currentQ.correctIndex
      const isCorrect = Math.random() < 0.8
      const aiChoice = isCorrect ? correctOption : (correctOption + 1) % 4
      
      setMathAiSelectedOption(aiChoice)
      
      if (mathSelectedOption === null) {
        if (aiChoice === correctOption) {
          setMathRoundStatus('ai_won')
          setMathUserHP(prev => Math.max(0, prev - 20))
          setMathGameState('feedback')
          clearMathTimers()
        }
      }
    }, aiThinkTime)

    mathTimerRef.current = setInterval(() => {
      setMathTimer(prev => {
        if (prev <= 1) {
          clearMathTimers()
          setMathRoundStatus('ai_won')
          setMathUserHP(prevHP => Math.max(0, prevHP - 20))
          setMathGameState('feedback')
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleMathAnswer = (optionIdx: number) => {
    clearMathTimers()
    setMathSelectedOption(optionIdx)
    const currentQ = MATH_QUESTIONS[mathQuestionIndex]
    const correct = optionIdx === currentQ.correctIndex

    if (correct) {
      setMathRoundStatus('user_won')
      setMathAiHP(prev => Math.max(0, prev - 20))
    } else {
      setMathRoundStatus('ai_won')
      setMathUserHP(prev => Math.max(0, prev - 20))
    }
    setMathGameState('feedback')
  }

  const handleNextMathRound = () => {
    const nextIdx = mathQuestionIndex + 1
    
    if (mathUserHP <= 0) {
      setMathGameState('defeat')
    } else if (mathAiHP <= 0) {
      setMathGameState('victory')
    } else if (nextIdx >= MATH_QUESTIONS.length) {
      if (mathAiHP < mathUserHP) {
        setMathGameState('victory')
      } else {
        setMathGameState('defeat')
      }
    } else {
      setMathQuestionIndex(nextIdx)
      setMathGameState('playing')
      startMathRound()
    }
  }

  // ----------------------------------------------------
  // Game 5: Prompt Crafting Arena State & Logic
  // ----------------------------------------------------
  const [promptChallengeIndex, setPromptChallengeIndex] = useState(0)
  const [promptInput, setPromptInput] = useState('')
  const [promptResult, setPromptResult] = useState<{ success: boolean; feedback: string } | null>(null)
  const [promptScore, setPromptScore] = useState(0)
  const [promptGameState, setPromptGameState] = useState<'playing' | 'evaluated' | 'summary'>('playing')

  const startPromptGame = () => {
    setPromptChallengeIndex(0)
    setPromptInput('')
    setPromptResult(null)
    setPromptScore(0)
    setPromptGameState('playing')
  }

  const handlePromptSubmit = () => {
    if (!promptInput.trim()) return
    const challenge = PROMPT_CHALLENGES[promptChallengeIndex]
    const result = challenge.validate(promptInput)
    setPromptResult(result)
    
    if (result.success) {
      setPromptScore(prev => prev + 100)
    }
    setPromptGameState('evaluated')
  }

  const handleNextPromptChallenge = () => {
    if (promptChallengeIndex < PROMPT_CHALLENGES.length - 1) {
      setPromptChallengeIndex(prev => prev + 1)
      setPromptInput('')
      setPromptResult(null)
      setPromptGameState('playing')
    } else {
      setPromptGameState('summary')
    }
  }

  // Cleanup effects
  useEffect(() => {
    return () => {
      clearWcTimer()
      clearDbTimer()
      clearMathTimers()
    }
  }, [clearWcTimer])

  // ----------------------------------------------------
  // Render Selection Dashboard Menu
  // ----------------------------------------------------
  const renderSelectionMenu = () => {
    return (
      <div className="max-w-5xl mx-auto space-y-8 mt-6">
        <div className="flex justify-between items-center bg-white/5 p-6 rounded-2xl border border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center rounded-xl" style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">مركز ألعاب مسار التعليمية 🎮</h1>
              <p className="text-sm mt-1 text-white/60">طوّر مهاراتك البرمجية والرياضية والذكية من خلال حزمة تحديات مسار الممتعة.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Game 1: Word Chain */}
          <div className="p-6 rounded-2xl flex flex-col justify-between border border-white/5 bg-white/3 backdrop-blur-md hover:-translate-y-1 transition-all duration-300">
            <div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-indigo-500/10 text-indigo-400 mb-4">
                <Swords className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">سجال الكلمات (Word Chain)</h3>
              <p className="text-sm text-white/50 leading-relaxed mb-6">تحدّ الذكاء الاصطناعي في تكوين سلاسل من المفردات التقنية المترابطة بالإنجليزية مع ترجمة حية فورية.</p>
            </div>
            <button onClick={() => { setActiveGame('word-chain'); setWcGameState('menu'); }} className="w-full py-3 rounded-xl font-bold text-sm bg-indigo-500 text-white hover:bg-indigo-600 transition-colors">
              ابدأ اللعب ▶
            </button>
          </div>

          {/* Game 2: Code Debugging Race */}
          <div className="p-6 rounded-2xl flex flex-col justify-between border border-white/5 bg-white/3 backdrop-blur-md hover:-translate-y-1 transition-all duration-300">
            <div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-500/10 text-orange-400 mb-4">
                <Code className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">سباق تصحيح الأكواد (Debugging)</h3>
              <p className="text-sm text-white/50 leading-relaxed mb-6">سباق سريع ضد الوقت للبحث عن الأخطاء البرمجية (Bugs) في شيفرات بايثون وإصلاحها للفوز بنقاط السرعة.</p>
            </div>
            <button onClick={() => { setActiveGame('code-debugging'); startDbGame(); }} className="w-full py-3 rounded-xl font-bold text-sm bg-orange-500 text-white hover:bg-orange-600 transition-colors">
              ابدأ اللعب ▶
            </button>
          </div>

          {/* Game 3: AI Tech Vocab Blitz */}
          <div className="p-6 rounded-2xl flex flex-col justify-between border border-white/5 bg-white/3 backdrop-blur-md hover:-translate-y-1 transition-all duration-300">
            <div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-500/10 text-purple-400 mb-4">
                <LayoutGrid className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">حرب مصطلحات الذكاء (Vocab Blitz)</h3>
              <p className="text-sm text-white/50 leading-relaxed mb-6">طابق المصطلحات الإنجليزية لتعلم الآلة والبيانات مع ترجمتها العربية المقابلة في أقل وقت ممكن.</p>
            </div>
            <button onClick={() => { setActiveGame('vocab-blitz'); startBlitzGame(); }} className="w-full py-3 rounded-xl font-bold text-sm bg-purple-500 text-white hover:bg-purple-600 transition-colors">
              ابدأ اللعب ▶
            </button>
          </div>

          {/* Game 4: Math-AI Duel */}
          <div className="p-6 rounded-2xl flex flex-col justify-between border border-white/5 bg-white/3 backdrop-blur-md hover:-translate-y-1 transition-all duration-300">
            <div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-rose-500/10 text-rose-400 mb-4">
                <Calculator className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">مبارزة الدوال الحسابية (Math Duel)</h3>
              <p className="text-sm text-white/50 leading-relaxed mb-6">مبارزة ذكاء سريعة حول دوال التنشيط والمصفوفات وقوانين الإحصاء ضد خصم آلي سريع الاستجابة.</p>
            </div>
            <button onClick={() => { setActiveGame('math-duel'); startMathGame(); }} className="w-full py-3 rounded-xl font-bold text-sm bg-rose-500 text-white hover:bg-rose-600 transition-colors">
              ابدأ اللعب ▶
            </button>
          </div>

          {/* Game 5: Prompt Crafting Arena */}
          <div className="p-6 rounded-2xl flex flex-col justify-between border border-white/5 bg-white/3 backdrop-blur-md hover:-translate-y-1 transition-all duration-300">
            <div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-cyan-500/10 text-cyan-400 mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">هندسة الأوامر (Prompt Arena)</h3>
              <p className="text-sm text-white/50 leading-relaxed mb-6">اكتب وصمم أوامر ذكية وهندسها بدقة لإجبار النموذج اللغوي على إعطاء نتائج وقيود هيكلية صارمة.</p>
            </div>
            <button onClick={() => { setActiveGame('prompt-crafting'); startPromptGame(); }} className="w-full py-3 rounded-xl font-bold text-sm bg-cyan-500 text-white hover:bg-cyan-600 transition-colors">
              ابدأ اللعب ▶
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ----------------------------------------------------
  // Render Word Chain (Game 1)
  // ----------------------------------------------------
  const renderWordChain = () => {
    if (wcGameState === 'menu') {
      return (
        <div className="max-w-3xl mx-auto space-y-8 mt-8 text-right">
          <div className="flex items-center justify-between">
            <button onClick={() => setActiveGame('menu')} className="px-5 py-2.5 rounded-xl border border-white/10 text-sm text-white/60 hover:bg-white/5 transition-all flex items-center gap-2">
              ⬅ العودة للمركز
            </button>
            <h2 className="text-2xl font-black text-white">سجال الكلمات الإنجليزية (Word Chain)</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Object.keys(MODE_INFO) as WordChainMode[]).map(m => {
              const info = MODE_INFO[m]; const Icon = info.icon; const active = wcMode === m
              return (
                <button key={m} onClick={() => setWcMode(m)}
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

          {wcMode === 'category' && (
            <div className="p-6 rounded-2xl backdrop-blur-[20px] bg-white/3 border border-white/5">
              <p className="text-base mb-4 font-bold text-white">اختر الفئة:</p>
              <div className="flex flex-wrap gap-3">
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setWcCategory(c)}
                    className="px-6 py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={{
                      backgroundColor: wcCategory === c ? theme.colors.accent + '20' : 'rgba(255,255,255,0.05)',
                      color: wcCategory === c ? theme.colors.accent : theme.colors.textMuted,
                      border: `1px solid ${wcCategory === c ? theme.colors.accent + '50' : 'rgba(255,255,255,0.1)'}`,
                    }}>{c}</button>
                ))}
              </div>
            </div>
          )}

          <button onClick={startWcGame}
            className="w-full py-5 rounded-2xl text-xl font-bold text-white transition-all hover:scale-[1.02] shadow-2xl"
            style={{ background: `linear-gradient(135deg, ${theme.colors.secondary} 0%, ${theme.colors.accent} 100%)` }}>
            ⚔️ ابدأ المبارزة
          </button>
        </div>
      )
    }

    if (wcGameState === 'victory' || wcGameState === 'defeat') {
      const isWin = wcGameState === 'victory'
      return (
        <div className="max-w-2xl mx-auto space-y-6 mt-8">
          <div className="text-center p-12 rounded-3xl backdrop-blur-[20px] shadow-2xl border border-white/5 relative overflow-hidden bg-white/3">
            {isWin ? <Crown size={80} className="mx-auto mb-6 text-green-400" /> : <Skull size={80} className="mx-auto mb-6 text-red-500" />}
            <h2 className="text-4xl font-black mb-4" style={{ color: isWin ? theme.colors.success : theme.colors.error }}>
              {isWin ? 'انتصرت!' : 'هُزمت!'}
            </h2>
            <p className="text-6xl font-black mb-3 text-white">{wcScore}</p>
            <p className="text-lg text-white/60">نقطة • {wcHistory.filter(h => h.player === 'player').length} كلمة</p>
          </div>

          <div className="flex gap-4">
            <button onClick={startWcGame} className="flex-1 py-4 rounded-xl font-bold text-white text-lg bg-indigo-600 hover:bg-indigo-700 transition-colors">
              العب مرة أخرى
            </button>
            <button onClick={() => setWcGameState('menu')} className="px-8 py-4 rounded-xl font-bold text-lg border border-white/10 text-white hover:bg-white/5">
              القائمة
            </button>
          </div>
        </div>
      )
    }

    const lastAIEntry = [...wcHistory].reverse().find(h => h.player === 'ai')
    return (
      <div className="max-w-4xl mx-auto flex flex-col gap-6" style={{ height: 'calc(100vh - 8rem)' }}>
        <div className="flex items-center justify-between shrink-0">
          <button onClick={() => setWcGameState('menu')} className="px-4 py-2 rounded-xl border border-white/10 text-xs text-white/60 hover:bg-white/5">
            🏁 الانسحاب
          </button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-white">
              <Star size={16} className="text-yellow-400" />
              <span className="font-bold">{wcScore}</span>
            </div>
            {(wcMode === 'speed' || wcMode === 'boss' || wcMode === 'attack') && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                <Clock size={16} />
                <span className="font-bold">{wcTimer}s</span>
              </div>
            )}
          </div>
        </div>

        {lastAIEntry && (
          <div className="p-4 rounded-xl border border-white/5 bg-white/3 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white/50">الذكاء الاصطناعي:</span>
              <span className="font-bold text-indigo-400 text-lg">{lastAIEntry.word}</span>
              <span className="text-sm text-white/60">({lastAIEntry.translation})</span>
            </div>
            <div className="flex items-center gap-2 text-right">
              <span className="text-xs text-white/40">اكتب كلمة تبدأ بـ:</span>
              <span className="text-2xl font-black text-indigo-400">{wcRequiredLetter.toUpperCase()}</span>
            </div>
          </div>
        )}

        <div ref={historyContainerRef} className="flex-1 overflow-y-auto rounded-2xl p-6 bg-black/20 border border-white/5">
          {wcHistory.map((h, i) => (
            <div key={i} className={`flex ${h.player === 'player' ? 'justify-end' : 'justify-start'} mb-4`}>
              <div onClick={() => speakWord(h.word)} className="px-5 py-3 rounded-2xl bg-white/3 border border-white/5 text-white hover:bg-white/5 cursor-pointer max-w-[70%]">
                <span className="font-bold text-lg">{h.word}</span>
                <span className="text-sm text-white/50 ml-3">→ {h.translation}</span>
              </div>
            </div>
          ))}
          {wcAiThinking && (
            <div className="flex justify-start">
              <div className="px-5 py-3 rounded-2xl bg-white/3 text-white/50">يفكر...</div>
            </div>
          )}
        </div>

        {wcError && <div className="text-red-400 text-sm font-semibold text-right">{wcError}</div>}

        <div className="flex gap-3 shrink-0">
          <input ref={inputRef} type="text" value={wcInput} onChange={e => { setWcInput(e.target.value); setWcError(''); }}
            onKeyDown={e => { if (e.key === 'Enter') handleWcPlayerSubmit(); }}
            placeholder={isWcPlayerTurn ? `اكتب كلمة إنجليزية تبدأ بـ "${wcRequiredLetter.toUpperCase()}"...` : 'انتظر دور الخصم...'}
            disabled={!isWcPlayerTurn || wcAiThinking}
            className="flex-1 px-6 py-4 rounded-xl bg-white/3 border border-white/10 outline-none text-white text-lg text-right"
            autoComplete="off" />
          <button onClick={handleWcPlayerSubmit} disabled={!isWcPlayerTurn || wcAiThinking || !wcInput.trim()} className="px-8 py-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700">
            إرسال
          </button>
        </div>
      </div>
    )
  }

  // ----------------------------------------------------
  // Render Code Debugging (Game 2)
  // ----------------------------------------------------
  const renderCodeDebugging = () => {
    const currentQ = DEBUG_QUESTIONS[dbQuestionIndex]

    if (dbGameState === 'summary') {
      return (
        <div className="max-w-2xl mx-auto space-y-6 mt-8">
          <div className="text-center p-12 rounded-3xl backdrop-blur-[20px] shadow-2xl border border-white/5 relative overflow-hidden bg-white/3">
            <Trophy size={80} className="mx-auto mb-6 text-green-400" />
            <h2 className="text-4xl font-black mb-4 text-green-400">اكتمل سباق التصحيح! 🎉</h2>
            <p className="text-6xl font-black mb-3 text-white">{dbScore}</p>
            <p className="text-lg text-white/60">لقد أتممت فحص 5 كتل برمجية واكتشفت الأخطاء بها.</p>
          </div>

          <div className="flex gap-4">
            <button onClick={startDbGame} className="flex-1 py-4 rounded-xl font-bold text-white text-lg bg-orange-500 hover:bg-orange-600 transition-colors">
              العب مرة أخرى
            </button>
            <button onClick={() => setActiveGame('menu')} className="px-8 py-4 rounded-xl font-bold text-lg border border-white/10 text-white hover:bg-white/5">
              العودة للمركز
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="max-w-4xl mx-auto space-y-6 mt-6 text-right">
        <div className="flex items-center justify-between shrink-0">
          <button onClick={() => setActiveGame('menu')} className="px-4 py-2 rounded-xl border border-white/10 text-xs text-white/60 hover:bg-white/5">
            🏁 الانسحاب
          </button>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 font-bold">
              النقاط: {dbScore}
            </div>
            <div className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold">
              المؤقت: {dbTimer}s
            </div>
            <span className="text-white/60">السؤال {dbQuestionIndex + 1} / 5</span>
          </div>
        </div>

        {/* Code Console */}
        <div className="rounded-xl border border-white/5 bg-black/40 overflow-hidden font-mono text-left">
          <div className="bg-black/80 px-4 py-2 text-white/40 text-xs flex justify-between">
            <span>main.py (تحدي التصحيح)</span>
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            </div>
          </div>
          <pre className="p-6 text-green-400 text-sm whitespace-pre">{currentQ.code}</pre>
        </div>

        <h3 className="text-xl font-bold text-white my-4">{currentQ.question}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentQ.options.map((opt, idx) => {
            const isSelected = dbSelectedOption === idx
            const isCorrectOption = idx === currentQ.correctIndex
            let cardBg = 'rgba(255,255,255,0.03)'
            let cardBorder = 'rgba(255,255,255,0.08)'

            if (dbGameState === 'feedback') {
              if (isCorrectOption) {
                cardBg = 'rgba(39, 201, 63, 0.15)'
                cardBorder = '#27C93F'
              } else if (isSelected) {
                cardBg = 'rgba(255, 95, 86, 0.15)'
                cardBorder = '#FF5F56'
              }
            } else if (isSelected) {
              cardBg = 'rgba(255, 136, 0, 0.1)'
              cardBorder = '#FF8800'
            }

            return (
              <button
                key={idx}
                disabled={dbGameState === 'feedback'}
                onClick={() => handleDbAnswer(idx)}
                style={{ backgroundColor: cardBg, borderColor: cardBorder }}
                className="p-5 rounded-2xl text-right border text-white font-medium hover:bg-white/5 transition-all text-base"
              >
                {opt}
              </button>
            )
          })}
        </div>

        {dbGameState === 'feedback' && (
          <div className="p-6 rounded-2xl border border-white/5 bg-white/3 text-right">
            <h4 className={`text-lg font-bold mb-2 ${dbIsCorrect ? 'text-green-400' : 'text-red-400'}`}>
              {dbIsCorrect ? 'إجابة صحيحة! ⭐️' : 'إجابة خاطئة أو انتهى الوقت! ❌'}
            </h4>
            <p className="text-sm text-white/70 mb-4">{currentQ.explanation}</p>
            <button onClick={handleNextDbQuestion} className="px-6 py-3 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-colors">
              {dbQuestionIndex < DEBUG_QUESTIONS.length - 1 ? 'السؤال التالي ➡️' : 'عرض النتائج 🏆'}
            </button>
          </div>
        )}
      </div>
    )
  }

  // ----------------------------------------------------
  // Render AI Tech Vocab Blitz (Game 3)
  // ----------------------------------------------------
  const renderVocabBlitz = () => {
    if (blitzGameState === 'victory') {
      return (
        <div className="max-w-2xl mx-auto space-y-6 mt-8">
          <div className="text-center p-12 rounded-3xl backdrop-blur-[20px] shadow-2xl border border-white/5 relative overflow-hidden bg-white/3">
            <Trophy size={80} className="mx-auto mb-6 text-green-400" />
            <h2 className="text-4xl font-black mb-4 text-green-400">انتصرت في حرب المصطلحات! 🎉</h2>
            <p className="text-6xl font-black mb-3 text-white">{blitzScore}</p>
            <p className="text-lg text-white/60">لقد قمت بمطابقة كافة مصطلحات الذكاء الاصطناعي بنجاح تام.</p>
          </div>

          <div className="flex gap-4">
            <button onClick={startBlitzGame} className="flex-1 py-4 rounded-xl font-bold text-white text-lg bg-purple-600 hover:bg-purple-700 transition-colors">
              العب مرة أخرى
            </button>
            <button onClick={() => setActiveGame('menu')} className="px-8 py-4 rounded-xl font-bold text-lg border border-white/10 text-white hover:bg-white/5">
              العودة للمركز
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="max-w-4xl mx-auto space-y-6 mt-6 text-right">
        <div className="flex items-center justify-between shrink-0">
          <button onClick={() => setActiveGame('menu')} className="px-4 py-2 rounded-xl border border-white/10 text-xs text-white/60 hover:bg-white/5">
            🏁 الانسحاب
          </button>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold">
              النقاط: {blitzScore}
            </div>
            <span className="text-white/60">الجولة {blitzRoundsPlayed + 1} / 3</span>
          </div>
        </div>

        <h3 className="text-xl font-bold text-white text-center">طابق المصطلح الإنجليزي بمعناه العربي المقابل:</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
          {blitzCards.map((card) => {
            const isMatched = card.state === 'matched'
            const isSelected = card.state === 'selected'
            const isError = card.state === 'error'

            let cardBg = 'rgba(255,255,255,0.03)'
            let cardBorder = 'rgba(255,255,255,0.08)'
            let txtColor = 'text-white'

            if (isMatched) {
              cardBg = 'rgba(39, 201, 63, 0.1)'
              cardBorder = '#27C93F'
              txtColor = 'text-green-400'
            } else if (isSelected) {
              cardBg = 'rgba(157, 0, 255, 0.15)'
              cardBorder = '#9D00FF'
              txtColor = 'text-purple-400'
            } else if (isError) {
              cardBg = 'rgba(255, 95, 86, 0.15)'
              cardBorder = '#FF5F56'
              txtColor = 'text-red-400'
            }

            return (
              <button
                key={card.id}
                disabled={isMatched || blitzBusy}
                onClick={() => handleBlitzCardPress(card)}
                style={{ backgroundColor: cardBg, borderColor: cardBorder }}
                className={`h-28 rounded-2xl border flex items-center justify-center p-4 font-bold text-center text-base transition-all hover:scale-[1.02] ${txtColor}`}
              >
                {card.text}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ----------------------------------------------------
  // Render Math-AI Duel (Game 4)
  // ----------------------------------------------------
  const renderMathDuel = () => {
    const currentQ = MATH_QUESTIONS[mathQuestionIndex]

    if (mathGameState === 'victory' || mathGameState === 'defeat') {
      const userWon = mathGameState === 'victory'
      return (
        <div className="max-w-2xl mx-auto space-y-6 mt-8">
          <div className="text-center p-12 rounded-3xl backdrop-blur-[20px] shadow-2xl border border-white/5 relative overflow-hidden bg-white/3">
            {userWon ? <Crown size={80} className="mx-auto mb-6 text-green-400" /> : <Skull size={80} className="mx-auto mb-6 text-red-500" />}
            <h2 className="text-4xl font-black mb-4" style={{ color: userWon ? theme.colors.success : theme.colors.error }}>
              {userWon ? 'انتصرت في المبارزة الحسابية! ⚡' : 'هزمت في المبارزة الحسابية! 💀'}
            </h2>
            <p className="text-lg text-white/60">صحتك المتبقية: {mathUserHP}%</p>
          </div>

          <div className="flex gap-4">
            <button onClick={startMathGame} className="flex-1 py-4 rounded-xl font-bold text-white text-lg bg-rose-600 hover:bg-rose-700 transition-colors">
              العب مرة أخرى
            </button>
            <button onClick={() => setActiveGame('menu')} className="px-8 py-4 rounded-xl font-bold text-lg border border-white/10 text-white hover:bg-white/5">
              العودة للمركز
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="max-w-4xl mx-auto space-y-6 mt-6 text-right">
        <div className="flex items-center justify-between shrink-0">
          <button onClick={() => setActiveGame('menu')} className="px-4 py-2 rounded-xl border border-white/10 text-xs text-white/60 hover:bg-white/5">
            🏁 الانسحاب
          </button>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold">
              المؤقت: {mathTimer}s
            </div>
            <span className="text-white/60">المسألة {mathQuestionIndex + 1} / 5</span>
          </div>
        </div>

        {/* Health bars */}
        <div className="grid grid-cols-2 gap-8 p-4 rounded-2xl border border-white/5 bg-white/3">
          {/* User HP */}
          <div className="space-y-2">
            <div className="flex justify-between font-bold">
              <span className="text-green-400">{mathUserHP} HP</span>
              <span className="text-white">أنت 🧑‍💻</span>
            </div>
            <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${mathUserHP}%` }} />
            </div>
          </div>
          {/* AI HP */}
          <div className="space-y-2 text-left">
            <div className="flex justify-between font-bold" style={{ flexDirection: 'row-reverse' }}>
              <span className="text-red-400">{mathAiHP} HP</span>
              <span className="text-white">الخصم الآلي 🤖</span>
            </div>
            <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${mathAiHP}%` }} />
            </div>
          </div>
        </div>

        <div className="p-10 rounded-2xl border border-white/5 bg-black/30 text-center font-bold text-xl text-white">
          {currentQ.question}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentQ.options.map((opt, idx) => {
            const isUserSelected = mathSelectedOption === idx
            const isAiSelected = mathAiSelectedOption === idx
            const isCorrect = idx === currentQ.correctIndex

            let cardBg = 'rgba(255,255,255,0.03)'
            let cardBorder = 'rgba(255,255,255,0.08)'

            if (mathGameState === 'feedback') {
              if (isCorrect) {
                cardBg = 'rgba(39, 201, 63, 0.15)'
                cardBorder = '#27C93F'
              } else if (isUserSelected) {
                cardBg = 'rgba(255, 95, 86, 0.15)'
                cardBorder = '#FF5F56'
              }
            } else if (isUserSelected) {
              cardBg = 'rgba(255, 0, 85, 0.1)'
              cardBorder = '#FF0055'
            }

            return (
              <button
                key={idx}
                disabled={mathGameState === 'feedback'}
                onClick={() => handleMathAnswer(idx)}
                style={{ backgroundColor: cardBg, borderColor: cardBorder }}
                className="p-5 rounded-2xl border text-white font-medium hover:bg-white/5 transition-all text-base flex justify-between items-center"
              >
                {isAiSelected && (
                  <span className="px-2.5 py-1 rounded bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20">🤖 الخصم</span>
                )}
                <span>{opt}</span>
              </button>
            )
          })}
        </div>

        {mathGameState === 'feedback' && (
          <div className="p-6 rounded-2xl border border-white/5 bg-white/3 text-right">
            <h4 className={`text-lg font-bold mb-2 ${mathRoundStatus === 'user_won' ? 'text-green-400' : 'text-red-400'}`}>
              {mathRoundStatus === 'user_won' ? 'ضربة قاضية! أصبت الهدف ⚡' : 'هجوم الخصم! أصابك الضرر 💥'}
            </h4>
            <p className="text-sm text-white/70 mb-4">{currentQ.explanation}</p>
            <button onClick={handleNextMathRound} className="px-6 py-3 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 transition-colors">
              {mathQuestionIndex < MATH_QUESTIONS.length - 1 && mathUserHP > 0 && mathAiHP > 0 ? 'الجولة التالية ➡️' : 'عرض النتائج النهائية 🏆'}
            </button>
          </div>
        )}
      </div>
    )
  }

  // ----------------------------------------------------
  // Render Prompt Crafting Arena (Game 5)
  // ----------------------------------------------------
  const renderPromptCrafting = () => {
    const challenge = PROMPT_CHALLENGES[promptChallengeIndex]

    if (promptGameState === 'summary') {
      return (
        <div className="max-w-2xl mx-auto space-y-6 mt-8">
          <div className="text-center p-12 rounded-3xl backdrop-blur-[20px] shadow-2xl border border-white/5 relative overflow-hidden bg-white/3">
            <Trophy size={80} className="mx-auto mb-6 text-green-400" />
            <h2 className="text-4xl font-black mb-4 text-green-400">اكتمل تحدي الأوامر! 🏆</h2>
            <p className="text-6xl font-black mb-3 text-white">{promptScore}</p>
            <p className="text-lg text-white/60">لقد صممت أوامر برمجية صارمة تحقق شروط النماذج الذكية.</p>
          </div>

          <div className="flex gap-4">
            <button onClick={startPromptGame} className="flex-1 py-4 rounded-xl font-bold text-white text-lg bg-cyan-600 hover:bg-cyan-700 transition-colors">
              العب مرة أخرى
            </button>
            <button onClick={() => setActiveGame('menu')} className="px-8 py-4 rounded-xl font-bold text-lg border border-white/10 text-white hover:bg-white/5">
              العودة للمركز
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="max-w-4xl mx-auto space-y-6 mt-6 text-right">
        <div className="flex items-center justify-between shrink-0">
          <button onClick={() => setActiveGame('menu')} className="px-4 py-2 rounded-xl border border-white/10 text-xs text-white/60 hover:bg-white/5">
            🏁 الانسحاب
          </button>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold">
              النقاط: {promptScore}
            </div>
            <span className="text-white/60">التحدي {promptChallengeIndex + 1} / 3</span>
          </div>
        </div>

        {/* Objective card */}
        <div className="p-6 rounded-2xl border border-white/5 bg-white/3 space-y-4">
          <div className="flex items-center gap-2 justify-end text-cyan-400">
            <span className="font-bold text-lg">{challenge.title}</span>
            <Sparkles size={20} />
          </div>
          <p className="text-white text-base leading-relaxed">{challenge.description}</p>
          <p className="text-sm text-white/50">💡 تلميح: {challenge.validationTip}</p>
        </div>

        <h4 className="text-lg font-bold text-white mt-4">اكتب أمرك الهندسي:</h4>
        <textarea
          value={promptInput}
          onChange={e => setPromptInput(e.target.value)}
          placeholder="اكتب أمرك الموجه للذكاء الاصطناعي..."
          disabled={promptGameState === 'evaluated'}
          className="w-full h-36 p-5 rounded-2xl bg-white/3 border border-white/10 text-white text-base outline-none resize-none text-right"
        />

        {promptGameState === 'playing' && (
          <button onClick={handlePromptSubmit} className="w-full py-4 rounded-xl font-bold bg-cyan-600 text-white hover:bg-cyan-700 transition-colors">
            إرسال للتقييم
          </button>
        )}

        {promptGameState === 'evaluated' && promptResult && (
          <div className={`p-6 rounded-2xl border text-right space-y-4 ${promptResult.success ? 'border-green-500 bg-green-500/5' : 'border-red-500 bg-red-500/5'}`}>
            <h4 className={`text-lg font-bold ${promptResult.success ? 'text-green-400' : 'text-red-400'}`}>
              {promptResult.success ? 'نجاح صياغة الأمر! 🎉 (+100 نقطة)' : 'فشل تحقيق القيود البرمجية ❌'}
            </h4>
            <p className="text-sm text-white">{promptResult.feedback}</p>
            <button onClick={handleNextPromptChallenge} className="px-6 py-3 rounded-xl bg-cyan-600 text-white font-bold hover:bg-cyan-700 transition-colors">
              {promptChallengeIndex < PROMPT_CHALLENGES.length - 1 ? 'التحدي التالي ➡️' : 'عرض النتائج النهائية 🏆'}
            </button>
          </div>
        )}
      </div>
    )
  }

  // ----------------------------------------------------
  // Root Game Selector
  // ----------------------------------------------------
  switch (activeGame) {
    case 'word-chain':
      return renderWordChain()
    case 'code-debugging':
      return renderCodeDebugging()
    case 'vocab-blitz':
      return renderVocabBlitz()
    case 'math-duel':
      return renderMathDuel()
    case 'prompt-crafting':
      return renderPromptCrafting()
    default:
      return renderSelectionMenu()
  }
}