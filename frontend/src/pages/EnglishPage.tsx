import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Globe, BookOpen, Brain, MessageSquare, Plus, Check, 
  Loader2, Volume2, BookMarked, Sparkles, Send, HelpCircle,
  CheckCircle2, Mic, MicOff, Award, AlertCircle, Search, 
  ChevronLeft, ChevronRight, BookOpenCheck, Lock, Unlock, 
  Flame, ArrowLeft, Headphones, RefreshCw
} from 'lucide-react'
import { useTheme } from '@/theme/ThemeContext'
import { api } from '@/services/api'
import vocabData from '@/data/vocab_bank.json'

// Preloaded CEFR lessons for Lute Reader
const CURRICULUM = {
  a1: [
    {
      title: "1. الكلمات والجمل البسيطة (Basic Sentences)",
      text: "Hello! My name is Mohammed. I have a computer. I read books and write simple code. Please help me learn English."
    }
  ],
  a2: [
    {
      title: "2. المكونات والعمليات الأساسية (Basic Functions)",
      text: "A variable is used to store data. We can click buttons on the screen to save files. The program runs and shows output."
    }
  ],
  b1: [
    {
      title: "3. هيكلة وبناء الأكواد (Loops and Arrays)",
      text: "We use a loop to run a block of code multiple times. Arrays store lists of values. Functions return values when they are called."
    }
  ],
  b2: [
    {
      title: "4. نشر التطبيقات وإدارة التحديثات (Deployment & Git)",
      text: "We deploy the application to the server. Before merging a branch, you must open a pull request. Make sure all tests pass."
    }
  ],
  c1: [
    {
      title: "5. مقدمة في خوارزميات التعلم الآلي (Intro to ML)",
      text: "Supervised learning models train on labeled datasets to make predictions. Loss functions measure the difference between predicted and actual values."
    }
  ],
  c2: [
    {
      title: "6. هندسة المحولات والذكاء الاصطناعي التوليدي (Transformer NLP)",
      text: "Transformers use self-attention mechanisms to model relationships in sequence. Vector databases enable semantic search for Retrieval-Augmented Generation."
    }
  ]
}

interface SavedWord {
  id: number
  word: string
  meanings: string[]
}

interface Flashcard {
  id: number
  front: string
  back: string
  is_due: boolean
}

interface Message {
  sender: 'user' | 'tutor'
  text: string
  timestamp: Date
}

interface NewsStory {
  id: number
  title: string
  type: 'news' | 'novel'
  summary: string
  level: string
}

type CEFRLevel = 'a1' | 'a2' | 'b1' | 'b2' | 'c1' | 'c2';

export default function EnglishPage() {
  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useState<'reader' | 'news' | 'vocab-bank' | 'pronunciation' | 'anki' | 'tutor'>('reader')
  
  // ==================== STATE: CURRICULUM ====================
  const [currentLevel, setCurrentLevel] = useState<CEFRLevel>('a1')
  const [selectedText, setSelectedText] = useState(CURRICULUM.a1[0].text)

  // ==================== STATE: LUTE READER & PHRASE SELECTION ====================
  const [customText, setCustomText] = useState('')
  const [isPlaying, setIsPlaying] = useState(true)
  const [clickedWord, setClickedWord] = useState<string | null>(null)
  const [translation, setTranslation] = useState<{ meanings: string[]; text: string } | null>(null)
  const [translating, setTranslating] = useState(false)
  const [savingWord, setSavingWord] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [vocabList, setVocabList] = useState<SavedWord[]>([])

  // Highlight-to-translate state
  const [selectedPhrase, setSelectedPhrase] = useState('')
  const [floatingCoords, setFloatingCoords] = useState<{ x: number; y: number } | null>(null)

  // ==================== STATE: NEWS & STORY FEED ====================
  const [feedItems, setFeedItems] = useState<NewsStory[]>([])
  const unlockedCount = 99; // Remove all restrictions as requested by the user
  const [loadingFeed, setLoadingFeed] = useState(false)
  const [loadingArticle, setLoadingArticle] = useState<number | null>(null)
  const [unlockNotification, setUnlockNotification] = useState<string | null>(null)

  // ==================== STATE: VOCABULARY BANK ====================
  const [bankSearch, setBankSearch] = useState('')
  const [bankCategoryFilter, setBankCategoryFilter] = useState<'all' | 'tech' | 'general'>('all')
  const [bankPage, setBankPage] = useState(1)
  const itemsPerPage = 12
  const [bankSavingWord, setBankSavingWord] = useState<string | null>(null)
  const [generatingSentenceForWord, setGeneratingSentenceForWord] = useState<string | null>(null)

  // ==================== STATE: PRONUNCIATION EVALUATOR ====================
  const [practiceSentence, setPracticeSentence] = useState(CURRICULUM.a1[0].text.split('.')[0] + '.')
  const [isListening, setIsListening] = useState(false)
  const [speechTranscript, setSpeechTranscript] = useState('')
  const [pronunciationScore, setPronunciationScore] = useState<number | null>(null)
  const [evaluatedWords, setEvaluatedWords] = useState<{ word: string; isCorrect: boolean }[]>([]);
  const [recognitionError, setRecognitionError] = useState<string | null>(null)
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null)

  // ==================== STATE: ANKI CARD REVIEW ====================
  const [deckId, setDeckId] = useState<number | null>(null)
  const [dueCards, setDueCards] = useState<Flashcard[]>([])
  const [totalCardsCount, setTotalCardsCount] = useState(0)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [loadingAnki, setLoadingAnki] = useState(false)
  const [submittingReview, setSubmittingReview] = useState(false)

  // ==================== STATE: AI TUTOR ====================
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'tutor',
      text: "Hello! I am your Masar AI English Tutor. How can I help you practice your English today? You can write to me in English or Arabic, and I will correct any mistakes you make! \n\nمرحباً! أنا مدرس اللغة الإنجليزية الخاص بك في مسار. كيف يمكنني مساعدتك في التدرب على الإنجليزية اليوم؟ يمكنك الكتابة لي بالإنجليزية أو العربية، وسأقوم بتصحيح أخطائك!",
      timestamp: new Date()
    }
  ])
  const [userInput, setUserInput] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Fetch saved vocabulary on mount
  const fetchVocabulary = async () => {
    try {
      const { data } = await api.get<SavedWord[]>('/vocabulary/')
      setVocabList(data)
    } catch (err) {
      console.error('Failed to load vocabulary list', err)
    }
  }

  // Fetch news feed list on mount
  const fetchNewsFeed = async (refresh: boolean = false) => {
    setLoadingFeed(true)
    try {
      const url = refresh ? '/english/news?refresh=true' : '/english/news'
      const { data } = await api.get<NewsStory[]>(url)
      setFeedItems(data)
    } catch (err) {
      console.error('Failed to fetch news feed', err)
    } finally {
      setLoadingFeed(false)
    }
  }

  useEffect(() => {
    fetchVocabulary()
    fetchNewsFeed()
  }, [])

  // Highlight phrase selection listener
  const handleTextSelection = () => {
    const selection = window.getSelection()
    if (!selection) return
    const text = selection.toString().trim()
    // Require at least two words
    if (text && text.split(/\s+/).length > 1) {
      setSelectedPhrase(text)
      
      try {
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        const parentElem = document.getElementById('lute-reader-container')
        if (parentElem) {
          const parentRect = parentElem.getBoundingClientRect()
          setFloatingCoords({
            x: rect.left - parentRect.left + rect.width / 2,
            y: rect.top - parentRect.top - 45
          })
        }
      } catch (e) {
        setFloatingCoords(null)
      }
    } else {
      setSelectedPhrase('')
      setFloatingCoords(null)
    }
  }

  useEffect(() => {
    document.addEventListener('selectionchange', handleTextSelection)
    return () => {
      document.removeEventListener('selectionchange', handleTextSelection)
    }
  }, [])

  // ==================== FUNCTIONS: LUTE READER ====================
  const handleWordClick = async (word: string) => {
    const cleanedWord = word.replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, "").trim();
    if (!cleanedWord || cleanedWord.match(/^\d+$/)) return;
    
    setClickedWord(cleanedWord)
    setTranslating(true)
    setTranslation(null)
    setSaveSuccess(false)
    
    try {
      const { data } = await api.post<{ meanings: string[]; translated_text: string }>('/translate/', {
        text: cleanedWord,
        source_lang: 'en',
        target_lang: 'ar'
      })
      setTranslation({ meanings: data.meanings, text: data.translated_text })
    } catch (err) {
      console.error('Translation failed', err)
      setTranslation({ meanings: [], text: "تعذر ترجمة الكلمة حالياً." })
    } finally {
      setTranslating(false)
    }
  }

  // Translates highlighted phrase
  const handleTranslateSelection = async () => {
    if (!selectedPhrase) return
    const phrase = selectedPhrase
    setSelectedPhrase('') // clear selection UI
    setFloatingCoords(null)

    setClickedWord(phrase)
    setTranslating(true)
    setTranslation(null)
    setSaveSuccess(false)

    try {
      const { data } = await api.post<{ meanings: string[]; translated_text: string }>('/translate/', {
        text: phrase,
        source_lang: 'en',
        target_lang: 'ar'
      })
      setTranslation({ meanings: data.meanings, text: data.translated_text })
    } catch (err) {
      console.error('Phrase translation failed', err)
      setTranslation({ meanings: [], text: "تعذر ترجمة العبارة حالياً." })
    } finally {
      setTranslating(false)
    }
  }

  const handleSaveWord = async () => {
    if (!clickedWord || !translation) return
    setSavingWord(true)
    try {
      await api.post('/vocabulary/', {
        word: clickedWord,
        meanings: translation.meanings.length > 0 ? translation.meanings : [translation.text]
      })
      setSaveSuccess(true)
      fetchVocabulary()
    } catch (err) {
      console.error('Failed to save vocabulary', err)
    } finally {
      setSavingWord(false)
    }
  }

  const parseTextTokens = (text: string) => {
    return text.split(/(\s+|[.,/#!$%^&*;:{}=\-_`~()?"'])/g).filter(Boolean);
  }

  // ==================== FUNCTIONS: NEWS & NOVELS FEED ====================
  const handleSelectArticle = async (item: NewsStory) => {
    setLoadingArticle(item.id)
    try {
      const { data } = await api.post<{ text: string, arabic_title: string, vocabulary: any[] }>('/english/news/content', {
        id: item.id,
        title: item.title,
        type: item.type,
        level: item.level
      })
      setSelectedText(data.text)
      setPracticeSentence(data.text.split('.')[0] + '.')
      setCurrentLevel(item.level as any)
      setIsPlaying(true)
      setActiveTab('reader')
    } catch (err) {
      console.error('Failed to load article content', err)
    } finally {
      setLoadingArticle(null)
    }
  }

  // ==================== FUNCTIONS: VOCABULARY BANK ====================
  const handleSaveBankWord = async (word: string, translation: string) => {
    setBankSavingWord(word)
    try {
      await api.post('/vocabulary/', {
        word: word,
        meanings: [translation]
      })
      setSaveSuccess(true)
      fetchVocabulary()
    } catch (err) {
      console.error('Failed to save word', err)
    } finally {
      setBankSavingWord(null)
    }
  }

  const handlePracticeVocab = async (word: string) => {
    setTranslating(true) // Reuse loader for simplicity
    try {
      const { data } = await api.post<{ sentence: string, translation: string }>('/english/generate-sentence', {
        word: word,
        level: currentLevel
      })
      setPracticeSentence(data.sentence)
      setActiveTab('pronunciation')
    } catch (err) {
      console.error('Failed to generate sentence', err)
    } finally {
      setTranslating(false)
    }
  }

  // Sets a single word as the practice target
  const handlePracticeWordAlone = (word: string) => {
    const cleanedWord = word.replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, "").trim();
    setPracticeSentence(cleanedWord)
    setPronunciationScore(null)
    setSpeechTranscript('')
    setEvaluatedWords([])
    setActiveTab('pronunciation')
  }

  // Generates a custom sentence containing the selected word for pronunciation training
  const handlePracticeWordInSentence = async (word: string) => {
    setGeneratingSentenceForWord(word)
    try {
      const { data } = await api.post<{ sentence: string, translation: string }>('/english/generate-sentence', {
        word: word,
        level: currentLevel
      })
      setPracticeSentence(data.sentence)
      setPronunciationScore(null)
      setSpeechTranscript('')
      setEvaluatedWords([])
      setActiveTab('pronunciation')
    } catch (err) {
      console.error('Failed to generate sentence for word training', err)
    } finally {
      setGeneratingSentenceForWord(null)
    }
  }

  // Filter words from JSON database
  const getFilteredBankWords = () => {
    const words = (vocabData as any)[currentLevel] || [];
    return words.filter((item: any) => {
      const matchesSearch = 
        item.w.toLowerCase().includes(bankSearch.toLowerCase()) || 
        item.t.includes(bankSearch);
      
      const matchesCategory = 
        bankCategoryFilter === 'all' || 
        item.c === bankCategoryFilter;
        
      return matchesSearch && matchesCategory;
    });
  };

  const filteredWords = getFilteredBankWords();
  const totalPages = Math.ceil(filteredWords.length / itemsPerPage);
  const displayedBankWords = filteredWords.slice((bankPage - 1) * itemsPerPage, bankPage * itemsPerPage);

  // Reset page when switching search/category/level
  useEffect(() => {
    setBankPage(1)
  }, [bankSearch, bankCategoryFilter, currentLevel])

  // ==================== FUNCTIONS: PRONUNCIATION EVALUATOR ====================
  const toggleListening = () => {
    if (isListening) {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
      setIsListening(false);
    } else {
      startListening();
    }
  }

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setRecognitionError("متصفحك لا يدعم خاصية التعرف على الصوت. يرجى استخدام Google Chrome أو Edge.");
      return;
    }
    
    setRecognitionError(null);
    setSpeechTranscript('');
    setPronunciationScore(null);
    setEvaluatedWords([]);
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    recognition.onstart = () => {
      setIsListening(true);
    };
    
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setRecognitionError("فشل التعرف على الصوت: " + event.error);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSpeechTranscript(transcript);
      evaluatePronunciation(transcript, practiceSentence);
    };
    
    setRecognitionInstance(recognition);
    recognition.start();
  };

  const evaluatePronunciation = (spokenText: string, targetText: string) => {
    const cleanSpoken = spokenText.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, "").split(/\s+/).filter(Boolean);
    const cleanTarget = targetText.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, "").split(/\s+/).filter(Boolean);
    
    let correctCount = 0;
    const evaluated = cleanTarget.map(word => {
      const isCorrect = cleanSpoken.includes(word);
      if (isCorrect) correctCount++;
      return { word, isCorrect };
    });
    
    const score = cleanTarget.length > 0 ? Math.round((correctCount / cleanTarget.length) * 100) : 0;
    setPronunciationScore(score);
    setEvaluatedWords(evaluated);
  };

  // ==================== FUNCTIONS: ANKI REVIEW ====================
  const loadAnkiDeck = async () => {
    setLoadingAnki(true)
    try {
      const { data: decksData } = await api.get<{ decks: { id: number; title: string }[] }>('/flashcards/decks')
      let targetDeck = decksData.decks.find(d => d.title === "اللغة الإنجليزية")
      
      if (!targetDeck) {
        const { data: createData } = await api.post<{ id: number; title: string }>('/flashcards/decks', {
          title: "اللغة الإنجليزية",
          description: "مفردات اللغة الإنجليزية المحفوظة تلقائياً من منصة مسار"
        })
        targetDeck = createData
      }
      
      setDeckId(targetDeck.id)

      const { data: cardsData } = await api.get<{ cards: Flashcard[] }>(`/flashcards/decks/${targetDeck.id}/cards`)
      
      setDueCards(cardsData.cards.filter(c => c.is_due))
      setTotalCardsCount(cardsData.cards.length)
      setCurrentCardIndex(0)
      setIsFlipped(false)
    } catch (err) {
      console.error('Failed to load Anki data', err)
    } finally {
      setLoadingAnki(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'anki') {
      loadAnkiDeck()
    }
  }, [activeTab])

  const handleReviewCard = async (quality: number) => {
    if (dueCards.length === 0 || submittingReview) return
    setSubmittingReview(true)
    const currentCard = dueCards[currentCardIndex]
    try {
      await api.post(`/flashcards/cards/${currentCard.id}/review`, { quality })
      setIsFlipped(false)
      setTimeout(() => {
        setCurrentCardIndex(prev => prev + 1)
        setSubmittingReview(false)
      }, 200)
    } catch (err) {
      console.error('Failed to submit card review', err)
      setSubmittingReview(false)
    }
  }

  // ==================== FUNCTIONS: AI TUTOR & SPEECH SYNTHESIS ====================
  const handleSendMessage = async () => {
    if (!userInput.trim() || sendingMessage) return
    const currentMsg = userInput
    setUserInput('')
    
    const userMessageObj: Message = { sender: 'user', text: currentMsg, timestamp: new Date() }
    setMessages(prev => [...prev, userMessageObj])
    setSendingMessage(true)

    const contextLines = messages.slice(-8).map(m => `${m.sender === 'user' ? 'Student' : 'Tutor'}: ${m.text}`)
    const chatContext = contextLines.join("\n")

    try {
      const { data } = await api.post<{ response: string }>('/tutor/ask', {
        query: currentMsg,
        context: chatContext,
        mode: 'english'
      })

      const tutorMessageObj: Message = { sender: 'tutor', text: data.response, timestamp: new Date() }
      setMessages(prev => [...prev, tutorMessageObj])
      
      speakText(data.response)
    } catch (err) {
      console.error('Tutor request failed', err)
      setMessages(prev => [...prev, {
        sender: 'tutor',
        text: "Sorry, I had trouble processing that request. Please try again! \n\nعذراً، واجهت مشكلة في معالجة طلبك. يرجى المحاولة مرة أخرى!",
        timestamp: new Date()
      }])
    } finally {
      setSendingMessage(false)
    }
  }

  const speakText = (text: string) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = 0.85 // Clear, learner-friendly speech rate
    utterance.pitch = 1.05 // Clear human-like pitch tuning
    
    // Choose premium high-quality voice if available in the browser
    const voices = window.speechSynthesis.getVoices()
    const bestVoice = voices.find(voice => 
      voice.lang.startsWith('en') && 
      (voice.name.includes('Google') || voice.name.includes('Natural') || voice.name.includes('Microsoft'))
    ) || voices.find(voice => voice.lang.startsWith('en'))
    
    if (bestVoice) {
      utterance.voice = bestVoice
    }
    
    window.speechSynthesis.speak(utterance)
  }

  return (
    <div className="h-full flex flex-col overflow-hidden animate-fadeIn" style={{ direction: 'rtl' }}>
      
      {/* CEFR Level Selector Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-black/45 p-4 border-b shrink-0 gap-3 border-white/5 shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white/50">المستوى الدراسي القياسي (CEFR):</span>
          <div className="flex gap-1 bg-black/40 p-1.5 rounded-xl border border-white/10">
            {(['a1', 'a2', 'b1', 'b2', 'c1', 'c2'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => {
                  setCurrentLevel(lvl)
                  setSelectedText(CURRICULUM[lvl][0].text)
                  setPracticeSentence(CURRICULUM[lvl][0].text.split('.')[0] + '.')
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase ${
                  currentLevel === lvl 
                    ? 'text-black shadow-md font-extrabold scale-105' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
                style={{
                  backgroundColor: currentLevel === lvl ? theme.colors.accent : 'transparent',
                }}
              >
                {lvl.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-[10px] font-bold text-white/40 flex items-center gap-1.5">
            <BookOpenCheck size={14} className="text-accent" />
            منهج متكامل A1-C2 (1,800 كلمة مفصلة)
          </div>
        </div>
      </div>

      {/* Dynamic Unlock Floating Notification Popup */}
      <AnimatePresence>
        {unlockNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 16 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute left-1/2 -translate-x-1/2 z-50 max-w-md px-6 py-4 rounded-2xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-400 text-xs font-bold shadow-2xl flex items-center gap-3 backdrop-blur-md"
          >
            <Sparkles className="animate-spin text-green-400 shrink-0" size={16} />
            <p>{unlockNotification}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Tab Navigation Menu */}
      <div className="flex gap-3 p-4 border-b shrink-0 overflow-x-auto bg-black/25 border-white/5 shadow-inner">
        <button 
          onClick={() => setActiveTab('reader')}
          className="flex items-center gap-2 px-4.5 py-3 rounded-xl font-bold text-xs transition-all whitespace-nowrap"
          style={{ 
            backgroundColor: activeTab === 'reader' ? `${theme.colors.accent}15` : 'transparent',
            color: activeTab === 'reader' ? theme.colors.accent : theme.colors.textMuted,
            border: `1px solid ${activeTab === 'reader' ? `${theme.colors.accent}40` : 'transparent'}`
          }}
        >
          <BookOpen size={16} />
          القارئ الذكي (Lute)
        </button>
        <button 
          onClick={() => setActiveTab('news')}
          className="flex items-center gap-2 px-4.5 py-3 rounded-xl font-bold text-xs transition-all whitespace-nowrap animate-pulse"
          style={{ 
            backgroundColor: activeTab === 'news' ? `${theme.colors.accent}15` : 'transparent',
            color: activeTab === 'news' ? theme.colors.accent : theme.colors.textMuted,
            border: `1px solid ${activeTab === 'news' ? `${theme.colors.accent}40` : 'transparent'}`
          }}
        >
          <Headphones size={16} />
          الأخبار والروايات
        </button>
        <button 
          onClick={() => setActiveTab('vocab-bank')}
          className="flex items-center gap-2 px-4.5 py-3 rounded-xl font-bold text-xs transition-all whitespace-nowrap"
          style={{ 
            backgroundColor: activeTab === 'vocab-bank' ? `${theme.colors.accent}15` : 'transparent',
            color: activeTab === 'vocab-bank' ? theme.colors.accent : theme.colors.textMuted,
            border: `1px solid ${activeTab === 'vocab-bank' ? `${theme.colors.accent}40` : 'transparent'}`
          }}
        >
          <BookMarked size={16} />
          بنك الكلمات الـ 300
        </button>
        <button 
          onClick={() => setActiveTab('pronunciation')}
          className="flex items-center gap-2 px-4.5 py-3 rounded-xl font-bold text-xs transition-all whitespace-nowrap"
          style={{ 
            backgroundColor: activeTab === 'pronunciation' ? `${theme.colors.accent}15` : 'transparent',
            color: activeTab === 'pronunciation' ? theme.colors.accent : theme.colors.textMuted,
            border: `1px solid ${activeTab === 'pronunciation' ? `${theme.colors.accent}40` : 'transparent'}`
          }}
        >
          <Mic size={16} />
          مقيّم النطق الصوتي
        </button>
        <button 
          onClick={() => setActiveTab('anki')}
          className="flex items-center gap-2 px-4.5 py-3 rounded-xl font-bold text-xs transition-all whitespace-nowrap"
          style={{ 
            backgroundColor: activeTab === 'anki' ? `${theme.colors.accent}15` : 'transparent',
            color: activeTab === 'anki' ? theme.colors.accent : theme.colors.textMuted,
            border: `1px solid ${activeTab === 'anki' ? `${theme.colors.accent}40` : 'transparent'}`
          }}
        >
          <Brain size={16} />
          مراجعة البطاقات (Anki)
        </button>
        <button 
          onClick={() => setActiveTab('tutor')}
          className="flex items-center gap-2 px-4.5 py-3 rounded-xl font-bold text-xs transition-all whitespace-nowrap"
          style={{ 
            backgroundColor: activeTab === 'tutor' ? `${theme.colors.accent}15` : 'transparent',
            color: activeTab === 'tutor' ? theme.colors.accent : theme.colors.textMuted,
            border: `1px solid ${activeTab === 'tutor' ? `${theme.colors.accent}40` : 'transparent'}`
          }}
        >
          <MessageSquare size={16} />
          مدرس الإنجليزية الذكي
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          
          {/* ==================== TAB: LUTE READER ==================== */}
          {activeTab === 'reader' && (
            <motion.div 
              key="reader"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="h-full flex flex-col md:flex-row overflow-hidden p-5 gap-5"
            >
              {/* Lute Reader Panel */}
              <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                <div 
                  id="lute-reader-container"
                  className="flex-1 rounded-3xl p-6 border flex flex-col overflow-hidden relative shadow-2xl backdrop-blur-md"
                  style={{ backgroundColor: `${theme.colors.surface}45`, borderColor: 'rgba(255,255,255,0.06)' }}
                >
                  <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/5">
                    <span className="text-xs font-bold flex items-center gap-2" style={{ color: theme.colors.accent }}>
                      <Sparkles size={14} className="animate-pulse" /> 
                      حدد أي عبارة لتظليلها وترجمتها، أو انقر على أي كلمة مفردة
                    </span>
                    <button 
                      onClick={() => setActiveTab('news')}
                      className="text-[10px] font-bold px-3 py-2 rounded-xl hover:bg-white/10 transition-all border border-white/5 text-accent"
                    >
                      تصفح الروايات والأخبار 📖
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto leading-relaxed text-lg tracking-wide text-right whitespace-pre-wrap select-text p-2 font-sans"
                    style={{ color: theme.colors.text, direction: 'ltr' }}
                  >
                    {parseTextTokens(selectedText).map((token, idx) => {
                      const isWord = token.trim() && !token.match(/[.,/#!$%^&*;:{}=\-_`~()?"']/g);
                      if (isWord) {
                        const isClicked = clickedWord?.toLowerCase() === token.replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, "").toLowerCase();
                        return (
                          <span 
                            key={idx}
                            onClick={() => handleWordClick(token)}
                            className={`transition-all rounded-md px-1 cursor-pointer inline-block ${
                              isClicked 
                                ? 'font-bold bg-accent/20 text-accent scale-105 shadow-md border border-accent/30' 
                                : 'hover:bg-white/10 hover:text-accent'
                            }`}
                            style={{ 
                              textShadow: isClicked ? `0 0 10px ${theme.colors.accent}40` : 'none',
                              color: isClicked ? theme.colors.accent : 'inherit'
                            }}
                          >
                            {token}
                          </span>
                        )
                      }
                      return <span key={idx}>{token}</span>
                    })}
                  </div>

                  {/* Floating Selection Translation Button */}
                  {floatingCoords && selectedPhrase && (
                    <button
                      onClick={handleTranslateSelection}
                      className="absolute z-40 px-3.5 py-2.5 rounded-xl text-[10px] font-bold text-white shadow-2xl flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 border border-white/10"
                      style={{ 
                        left: floatingCoords.x, 
                        top: floatingCoords.y, 
                        transform: 'translateX(-50%)',
                        background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})`
                      }}
                    >
                      <Globe size={12} /> ترجمة العبارة المحددة 🌐
                    </button>
                  )}
                </div>
              </div>

              {/* Translation Details & Dictionary Pane */}
              <div className="w-full md:w-80 shrink-0 flex flex-col gap-4 overflow-hidden">
                <div className="rounded-3xl border p-5 flex flex-col h-[340px] shadow-2xl backdrop-blur-md"
                  style={{ backgroundColor: `${theme.colors.surface}45`, borderColor: 'rgba(255,255,255,0.06)' }}
                >
                  <h3 className="font-extrabold text-xs mb-3 pb-2 border-b flex items-center gap-2 border-white/5" 
                    style={{ color: theme.colors.text }}
                  >
                    <Globe size={14} className="text-accent" />
                    الترجمة الفورية الفائقة
                  </h3>

                  {clickedWord ? (
                    <div className="flex-1 flex flex-col justify-between overflow-y-auto">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-extrabold text-sm tracking-wide font-sans text-white text-left truncate max-w-[150px]">{clickedWord}</span>
                          <button 
                            onClick={() => speakText(clickedWord)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-accent transition-all border border-white/5"
                            title="استمع للنطق"
                          >
                            <Volume2 size={12} />
                          </button>
                        </div>

                        {/* Pronunciation options */}
                        <div className="flex gap-1.5 mb-3">
                          <button 
                            onClick={() => handlePracticeWordAlone(clickedWord)}
                            className="flex-1 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-all border border-emerald-500/20 flex items-center justify-center gap-1 text-[9px] font-bold"
                          >
                            <Mic size={10} /> نطق الكلمة
                          </button>
                          <button 
                            onClick={() => handlePracticeWordInSentence(clickedWord)}
                            disabled={generatingSentenceForWord === clickedWord}
                            className="flex-1 py-1.5 rounded-lg bg-accent/10 hover:bg-accent/20 text-accent transition-all border border-accent/20 flex items-center justify-center gap-1 text-[9px] font-bold disabled:opacity-50"
                          >
                            {generatingSentenceForWord === clickedWord ? (
                              <Loader2 size={10} className="animate-spin" />
                            ) : (
                              <Sparkles size={10} />
                            )}
                            نطق في جملة
                          </button>
                        </div>

                        {translating ? (
                          <div className="flex items-center gap-2 py-4 text-xs text-white/50">
                            <Loader2 size={12} className="animate-spin" /> جاري الترجمة...
                          </div>
                        ) : translation ? (
                          <div className="space-y-2">
                            <p className="text-[9px] text-white/40">المعاني الفورية للمستند:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {translation.meanings.length > 0 ? (
                                translation.meanings.map((meaning, idx) => (
                                  <span key={idx} className="text-[10px] px-2.5 py-1 rounded-lg font-bold text-white bg-white/5 border border-white/5">
                                    {meaning}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[10px] px-2.5 py-1 rounded-lg font-semibold text-white/70 bg-white/5 border border-white/5">
                                  {translation.text}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : null}
                      </div>

                      {translation && !translating && (
                        <div className="mt-2 pt-2 border-t border-white/5">
                          {saveSuccess ? (
                            <div className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                              <Check size={12} /> تم الحفظ في مفرداتي!
                            </div>
                          ) : (
                            <button
                              onClick={handleSaveWord}
                              disabled={savingWord}
                              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-bold text-white hover:scale-[1.02] transition-all disabled:opacity-50 border border-white/5 shadow-md"
                              style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}
                            >
                              {savingWord ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <Plus size={12} />
                              )}
                              حفظ كبطاقة فلاشكارد (Anki)
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center text-[10px] text-white/40 p-4 border border-dashed border-white/5 rounded-2xl">
                      <HelpCircle size={24} className="mb-2 opacity-30 text-accent" />
                      اضغط على الكلمات أو حدد عبارة كاملة لعرض المعاني والترجمات، وممارسة نطق الكلمة داخل جمل مخصصة.
                    </div>
                  )}
                </div>

                {/* Vocabulary stats */}
                <div className="rounded-3xl border p-5 flex flex-col overflow-hidden flex-1 shadow-2xl backdrop-blur-md"
                  style={{ backgroundColor: `${theme.colors.surface}45`, borderColor: 'rgba(255,255,255,0.06)' }}
                >
                  <h3 className="font-extrabold text-xs mb-3 pb-2 border-b flex items-center gap-2 border-white/5" 
                    style={{ color: theme.colors.text }}
                  >
                    <BookMarked size={14} className="text-accent" />
                    مفرداتي المحفوظة ({vocabList.length})
                  </h3>
                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                    {vocabList.length === 0 ? (
                      <p className="text-[10px] text-white/30 text-center py-8">لا توجد كلمات محفوظة حتى الآن.</p>
                    ) : (
                      vocabList.slice().reverse().map((word) => (
                        <div key={word.id} className="flex flex-col p-2.5 rounded-xl hover:bg-white/5 transition-all text-[11px] border border-transparent hover:border-white/5 gap-2">
                          <div className="flex justify-between items-center">
                            <span className="font-bold font-sans text-white text-left truncate max-w-[120px]">{word.word}</span>
                            <span className="text-white/60 font-semibold truncate max-w-[120px] text-right" title={word.meanings.join("، ")}>
                              {word.meanings.slice(0, 2).join("، ")}
                            </span>
                          </div>
                          <button
                            onClick={() => handlePracticeVocab(word.word)}
                            className="w-full py-1.5 text-[10px] font-bold bg-white/5 rounded-lg border border-white/10 text-blue-400 hover:bg-blue-500/20 transition-all flex items-center justify-center gap-1.5"
                          >
                            <Mic size={12} /> تدرب على الكلمة في جملة
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ==================== TAB: NEWS & NOVELS FEED ==================== */}
          {activeTab === 'news' && (
            <motion.div 
              key="news"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="h-full flex flex-col p-5 gap-4 overflow-hidden"
            >
              <div className="rounded-3xl p-6 border flex flex-col overflow-hidden shadow-2xl flex-1"
                style={{ backgroundColor: `${theme.colors.surface}45`, borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/5">
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                    <BookOpen size={16} className="text-accent" />
                    روايات إنجليزية وقصص وأخبار تقنية يومية
                  </h3>
                  <button
                    onClick={() => fetchNewsFeed(true)}
                    disabled={loadingFeed}
                    className="text-[10px] font-bold px-3 py-1.5 rounded-xl hover:bg-white/10 transition-all border border-white/5 text-accent flex items-center gap-1 disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={loadingFeed ? "animate-spin" : ""} />
                    تحديث القائمة
                  </button>
                </div>

                <p className="text-[11px] text-white/50 mb-4 leading-relaxed">
                  تدرب على نطق الكلمات والعبارات في تبويب **مقيّم النطق**. قم بقراءة وترجمة هذه الأخبار والروايات في تبويب **القارئ الذكي**.
                </p>

                {loadingFeed ? (
                  <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="animate-spin text-accent" size={28} />
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pr-1">
                    {feedItems.map((item, index) => {
                      const isLocked = index >= unlockedCount;
                      const isLoading = loadingArticle === item.id;

                      return (
                        <div 
                          key={item.id}
                          className={`p-4.5 rounded-2xl border flex flex-col justify-between gap-4 relative overflow-hidden transition-all shadow-lg ${
                            isLocked ? 'opacity-55' : 'hover:scale-[1.01] hover:border-white/20'
                          }`}
                          style={{ 
                            backgroundColor: isLocked ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.02)',
                            borderColor: 'rgba(255,255,255,0.05)'
                          }}
                        >
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className={`text-[8px] px-2 py-0.5 rounded font-extrabold uppercase tracking-wide border ${
                                item.type === 'news' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-pink-500/10 text-pink-400 border-pink-500/20'
                              }`}>
                                {item.type === 'news' ? 'أخبار 📰' : 'رواية 📖'}
                              </span>
                              <span className="text-[9px] font-bold text-accent font-sans bg-accent/10 px-2 py-0.5 rounded">
                                {item.level.toUpperCase()}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-white mb-1.5 text-left font-sans" style={{ direction: 'ltr' }}>{item.title}</h4>
                            <p className="text-[10px] text-white/40 text-left line-clamp-3" style={{ direction: 'ltr' }}>{item.summary}</p>
                          </div>

                          <div className="flex justify-end mt-2 pt-2 border-t border-white/5">
                            {isLocked ? (
                              <span className="text-[9px] font-bold text-white/40 flex items-center gap-1 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">
                                <Lock size={10} /> مغلق (أكمل اختبار النطق للفتح)
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSelectArticle(item)}
                                disabled={isLoading}
                                className="px-3.5 py-2 rounded-xl text-[10px] font-bold text-white hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1 border border-white/5"
                                style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}
                              >
                                {isLoading ? (
                                  <Loader2 size={10} className="animate-spin" />
                                ) : (
                                  <Unlock size={10} />
                                )}
                                فتح في القارئ الذكي
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ==================== TAB: VOCABULARY BANK ==================== */}
          {activeTab === 'vocab-bank' && (
            <motion.div 
              key="vocab-bank"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="h-full flex flex-col p-5 gap-4 overflow-hidden"
            >
              {/* Search and Category Filter Toolbar */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-black/45 p-4 rounded-3xl border border-white/5 shadow-lg">
                <div className="relative w-full sm:w-72">
                  <input
                    type="text"
                    placeholder="ابحث عن كلمة إنجليزية أو ترجمة عربية..."
                    value={bankSearch}
                    onChange={(e) => setBankSearch(e.target.value)}
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-accent text-right"
                    style={{ 
                      backgroundColor: `${theme.colors.bg}85`, 
                      borderColor: 'rgba(255,255,255,0.06)',
                      color: theme.colors.text
                    }}
                  />
                  <Search size={16} className="absolute right-3.5 top-3 text-white/40" />
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white/50">تصفية التصنيف:</span>
                  <div className="flex gap-1 bg-black/25 p-1 rounded-xl">
                    {(['all', 'tech', 'general'] as const).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setBankCategoryFilter(cat)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                          bankCategoryFilter === cat ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/80'
                        }`}
                      >
                        {cat === 'all' ? 'الكل' : cat === 'tech' ? 'تقني 💻' : 'عام 🌐'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Vocabulary Grid */}
              <div className="flex-1 overflow-y-auto pr-1">
                {displayedBankWords.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center text-white/40 gap-2">
                    <HelpCircle size={24} className="opacity-50" />
                    <p className="text-xs">لم نجد أي كلمة تطابق بحثك أو تصنيفك المختار.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {displayedBankWords.map((item: any, idx: number) => {
                      const isAlreadySaved = vocabList.some(v => v.word.toLowerCase() === item.w.toLowerCase());
                      const isSaving = bankSavingWord === item.w;
                      const isGeneratingSentence = generatingSentenceForWord === item.w;
                      
                      return (
                        <div 
                          key={idx}
                          className="p-4.5 rounded-2xl border flex flex-col justify-between gap-4 transition-all hover:scale-[1.01] hover:border-white/10 shadow-lg"
                          style={{ 
                            backgroundColor: `${theme.colors.surface}45`, 
                            borderColor: 'rgba(255,255,255,0.05)' 
                          }}
                        >
                          <div>
                            <div className="flex justify-between items-start">
                              <span className="font-extrabold text-sm tracking-wide font-sans text-white text-left truncate max-w-[130px]" style={{ direction: 'ltr' }}>
                                {item.w}
                              </span>
                              <span className={`text-[8px] px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wide ${
                                item.c === 'tech' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}>
                                {item.c === 'tech' ? 'تقني' : 'عام'}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-accent/80 truncate mt-2 pb-1 text-right" title={item.t}>
                              {item.t}
                            </p>
                          </div>
                          
                          <div className="flex flex-col gap-2 border-t border-white/5 pt-3">
                            {/* Pronunciation options */}
                            <div className="flex gap-1 w-full">
                              <button 
                                onClick={() => handlePracticeWordAlone(item.w)}
                                className="flex-1 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-all border border-emerald-500/20 flex items-center justify-center gap-1 text-[9px] font-bold"
                              >
                                <Mic size={10} /> نطق الكلمة
                              </button>
                              <button 
                                onClick={() => handlePracticeWordInSentence(item.w)}
                                disabled={isGeneratingSentence}
                                className="flex-1 py-1.5 rounded-lg bg-accent/10 hover:bg-accent/20 text-accent transition-all border border-accent/20 flex items-center justify-center gap-1 text-[9px] font-bold disabled:opacity-50"
                              >
                                {isGeneratingSentence ? (
                                  <Loader2 size={10} className="animate-spin" />
                                ) : (
                                  <Sparkles size={10} />
                                )}
                                نطق في جملة
                              </button>
                            </div>

                            <div className="flex justify-between items-center mt-1">
                              <button 
                                onClick={() => speakText(item.w)}
                                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all border border-white/5"
                                title="استمع للنطق"
                              >
                                <Volume2 size={12} />
                              </button>
                              
                              {isAlreadySaved ? (
                                <span className="text-[9px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-lg flex items-center gap-1">
                                  <Check size={10} /> مضاف
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleSaveBankWord(item.w, item.t)}
                                  disabled={isSaving}
                                  className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold text-white hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1 border border-white/5"
                                  style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}
                                >
                                  {isSaving ? (
                                    <Loader2 size={10} className="animate-spin" />
                                  ) : (
                                    <Plus size={10} />
                                  )}
                                  مراجعة
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center bg-black/45 p-3 rounded-2xl border border-white/5 shrink-0 shadow-lg" style={{ borderColor: `${theme.colors.border}20` }}>
                  <button
                    onClick={() => setBankPage(p => Math.max(1, p - 1))}
                    disabled={bankPage === 1}
                    className="p-1.5 rounded-xl hover:bg-white/10 transition-all disabled:opacity-30 text-white"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <span className="text-xs font-bold text-white/60">
                    الصفحة {bankPage} من {totalPages} (إجمالي {filteredWords.length} كلمة)
                  </span>
                  <button
                    onClick={() => setBankPage(p => Math.min(totalPages, p + 1))}
                    disabled={bankPage === totalPages}
                    className="p-1.5 rounded-xl hover:bg-white/10 transition-all disabled:opacity-30 text-white"
                  >
                    <ChevronLeft size={16} />
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* ==================== TAB: PRONUNCIATION EVALUATOR ==================== */}
          {activeTab === 'pronunciation' && (
            <motion.div 
              key="pronunciation"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="h-full flex flex-col items-center p-5 overflow-y-auto"
            >
              <div className="w-full max-w-xl flex flex-col gap-5">
                
                {/* Sentence Selection */}
                <div className="bg-black/45 p-4 rounded-3xl border border-white/5 shadow-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-xs" style={{ color: theme.colors.text }}>اختر جملة للتدرب على نطقها أو اختر كلمة لوضعها في جملة:</h3>
                    <span className="text-[10px] px-2.5 py-1 rounded-lg font-bold bg-accent/20 text-accent uppercase">{currentLevel.toUpperCase()}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1">
                    {CURRICULUM[currentLevel].map((preset) => {
                      const sentences = preset.text.split('.').map(s => s.trim() + '.').filter(s => s.length > 2);
                      return sentences.map((sentence, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setPracticeSentence(sentence)
                            setPronunciationScore(null)
                            setSpeechTranscript('')
                            setEvaluatedWords([])
                          }}
                          className={`p-2.5 text-left text-xs rounded-xl border hover:scale-[1.01] transition-all font-sans text-white/80 truncate ${
                            practiceSentence === sentence ? 'border-accent bg-accent/10 font-semibold text-accent' : 'border-white/5 hover:border-white/20'
                          }`}
                          style={{ direction: 'ltr' }}
                        >
                          {sentence}
                        </button>
                      ))
                    })}
                  </div>
                </div>

                {/* Target Sentence Display Card */}
                <div className="rounded-3xl p-6 border flex flex-col items-center justify-center gap-6 relative shadow-2xl backdrop-blur-md"
                  style={{ backgroundColor: `${theme.colors.surface}45`, borderColor: 'rgba(255,255,255,0.06)' }}
                >
                  <div className="w-full flex justify-between items-center border-b border-white/5 pb-2.5 mb-2">
                    <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">الجملة التدريبية (Target Sentence)</span>
                    <button 
                      onClick={() => speakText(practiceSentence)}
                      className="flex items-center gap-1.5 text-[9px] font-bold text-accent hover:scale-105 active:scale-95 transition-all bg-accent/15 px-3 py-1.5 rounded-xl border border-accent/20 shadow-md"
                    >
                      <Volume2 size={12} /> استمع للنطق الواضح
                    </button>
                  </div>

                  <p className="text-base font-medium tracking-wide text-center leading-relaxed font-sans text-white/95 p-3"
                    style={{ direction: 'ltr' }}
                  >
                    {practiceSentence}
                  </p>
                  
                  {/* Speech input triggers */}
                  <div className="flex flex-col items-center gap-2">
                    <button
                      onClick={toggleListening}
                      className={`w-15 h-15 rounded-full flex items-center justify-center shadow-2xl relative transition-all ${
                        isListening ? 'scale-110 shadow-accent/50 animate-pulse' : 'hover:scale-105 active:scale-95'
                      }`}
                      style={{ 
                        background: isListening 
                          ? `radial-gradient(circle, #ef4444, #b91c1c)`
                          : `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})`,
                        boxShadow: isListening ? `0 0 20px #ef4444` : 'none'
                      }}
                    >
                      {isListening ? (
                        <MicOff size={22} className="text-white animate-pulse" />
                      ) : (
                        <Mic size={22} className="text-white" />
                      )}
                      
                      {isListening && (
                        <span className="absolute inset-0 w-full h-full rounded-full border border-red-500 animate-ping opacity-60 pointer-events-none" />
                      )}
                    </button>
                    <span className="text-[10px] font-bold text-white/40">
                      {isListening ? "جاري التسجيل... اضغط مجدداً للإيقاف الفوري والتقييم" : "اضغط على زر الميكروفون وابدأ القراءة"}
                    </span>
                  </div>

                  {recognitionError && (
                    <div className="flex items-center gap-2 p-3.5 rounded-2xl text-xs bg-red-500/10 text-red-400 border border-red-500/20 w-full">
                      <AlertCircle size={14} className="shrink-0" />
                      {recognitionError}
                    </div>
                  )}
                </div>

                {/* Accuracy Results Section */}
                <AnimatePresence>
                  {pronunciationScore !== null && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="rounded-3xl border p-6 flex flex-col sm:flex-row items-center gap-6 shadow-2xl backdrop-blur-md"
                      style={{ backgroundColor: `${theme.colors.surface}45`, borderColor: 'rgba(255,255,255,0.06)' }}
                    >
                      {/* Score Wheel */}
                      <div className="flex flex-col items-center gap-2 shrink-0">
                        <div className="w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center gap-0.5"
                          style={{ 
                            borderColor: pronunciationScore >= 80 ? '#10b981' : pronunciationScore >= 50 ? '#facc15' : '#ef4444',
                            boxShadow: `0 0 15px ${pronunciationScore >= 80 ? '#10b98120' : '#ef444420'}`
                          }}
                        >
                          <span className="text-xl font-extrabold text-white font-sans">{pronunciationScore}%</span>
                          <span className="text-[8px] font-bold text-white/50 uppercase">الدقة</span>
                        </div>
                      </div>

                      {/* Feedback Panel */}
                      <div className="flex-1 flex flex-col gap-3">
                        <div className="pb-2 border-b border-white/5">
                          <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-1">تدقيق الكلمات ونقاط الضعف (Analysis)</span>
                          <div className="flex flex-wrap gap-1.5 leading-relaxed font-sans text-left text-sm py-1.5" style={{ direction: 'ltr' }}>
                            {evaluatedWords.map((val, idx) => (
                              <span 
                                key={idx} 
                                className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                                  val.isCorrect 
                                    ? 'text-green-400 bg-green-500/10 border border-green-500/20' 
                                    : 'text-red-400 bg-red-500/10 border border-red-500/20 line-through decoration-red-500/50'
                                }`}
                              >
                                {val.word}
                              </span>
                            ))}
                          </div>
                        </div>

                        <p className="text-xs font-medium text-white/70">
                          {pronunciationScore >= 90 ? (
                            <span className="text-green-400 flex items-center gap-1.5">
                              <Award size={14} /> نطق رائع وممتاز جداً! مخارج الحروف ممتازة. 🌟
                            </span>
                          ) : pronunciationScore >= 70 ? (
                            <span className="text-yellow-400 flex items-center gap-1.5">
                              <Award size={14} /> نطق جيد جداً، هناك بعض الكلمات غير الواضحة قليلاً. 👍
                            </span>
                          ) : (
                            <span className="text-red-400 flex items-center gap-1.5">
                              <Award size={14} /> محاولة جيدة، استمع للنطق الصحيح ثم أعد المحاولة. ✍️
                            </span>
                          )}
                        </p>

                        <div className="text-[10px] text-white/40 italic text-left" style={{ direction: 'ltr' }}>
                          Spoken: "{speechTranscript}"
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            </motion.div>
          )}

          {/* ==================== TAB: ANKI CARD REVIEW ==================== */}
          {activeTab === 'anki' && (
            <motion.div 
              key="anki"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="h-full flex flex-col items-center justify-center p-6"
            >
              {loadingAnki ? (
                <div className="flex flex-col items-center justify-center gap-3">
                  <Loader2 size={32} className="animate-spin text-accent" />
                  <p className="text-sm text-white/50">جاري تحميل بطاقات مراجعة اللغة الإنجليزية...</p>
                </div>
              ) : dueCards.length === 0 ? (
                <div className="max-w-md text-center p-8 rounded-3xl border flex flex-col items-center justify-center gap-4 animate-fadeIn shadow-2xl"
                  style={{ backgroundColor: `${theme.colors.surface}45`, borderColor: 'rgba(255,255,255,0.06)' }}
                >
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-green-400 bg-green-500/10 border border-green-500/20 shadow-inner">
                    <CheckCircle2 size={32} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white mb-2">أحسنت! لا توجد بطاقات مستحقة</h2>
                    <p className="text-xs text-white/60 leading-relaxed">
                      لقد راجعت كل كلماتك الإنجليزية الحالية، أو أنك لم تقم بحفظ أي كلمة بعد. انتقل إلى **القارئ الذكي** أو **بنك الكلمات** واحفظ بعض الكلمات لمراجعتها.
                    </p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('vocab-bank')}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold text-white hover:scale-105 transition-all mt-2 border border-white/5 shadow-md"
                    style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}
                  >
                    تصفح بنك الكلمات
                  </button>
                </div>
              ) : currentCardIndex >= dueCards.length ? (
                <div className="max-w-md text-center p-8 rounded-3xl border flex flex-col items-center justify-center gap-4 animate-fadeIn shadow-2xl"
                  style={{ backgroundColor: `${theme.colors.surface}45`, borderColor: 'rgba(255,255,255,0.06)' }}
                >
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 shadow-inner">
                    <Sparkles size={32} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white mb-2">انتهت جلسة المراجعة اليوم!</h2>
                    <p className="text-xs text-white/60 leading-relaxed">
                      تمت مراجعة {dueCards.length} بطاقات بنجاح باستخدام خوارزمية التكرار المتباعد SM-2. سيقوم النظام بجدولتها تلقائياً للمستقبل.
                    </p>
                  </div>
                  <button 
                    onClick={loadAnkiDeck}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold text-white hover:scale-105 transition-all mt-2 border border-white/5 shadow-md"
                    style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}
                  >
                    تحديث القائمة
                  </button>
                </div>
              ) : (
                /* Card Review Widget */
                <div className="w-full max-w-lg flex flex-col gap-5 animate-fadeIn">
                  <div className="flex justify-between items-center text-[10px] text-white/60 px-2">
                    <span className="font-semibold">المراجعة المستحقة: {currentCardIndex + 1} / {dueCards.length}</span>
                    <span className="font-semibold">إجمالي الكلمات الإنجليزية: {totalCardsCount}</span>
                  </div>

                  <div 
                    onClick={() => setIsFlipped(f => !f)}
                    className="h-72 w-full cursor-pointer relative"
                    style={{ perspective: 1000 }}
                  >
                    <motion.div
                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      className="w-full h-full relative rounded-3xl shadow-2xl border"
                      style={{ 
                        transformStyle: 'preserve-3d',
                        backgroundColor: `${theme.colors.surface}80`,
                        borderColor: `${theme.colors.border}40`
                      }}
                    >
                      {/* Front of Card */}
                      <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-6 text-center"
                        style={{ backfaceVisibility: 'hidden' }}
                      >
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">English Word</span>
                        <h2 className="text-3xl font-extrabold tracking-wide font-sans text-white">{dueCards[currentCardIndex].front}</h2>
                        <span className="text-[10px] text-accent mt-6 flex items-center gap-1 opacity-70">
                          انقر لقلب البطاقة ومعرفة الترجمة
                        </span>
                      </div>

                      {/* Back of Card */}
                      <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-6 text-center"
                        style={{ 
                          backfaceVisibility: 'hidden', 
                          transform: 'rotateY(180deg)' 
                        }}
                      >
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">Arabic Meaning</span>
                        <h2 className="text-2xl font-bold text-accent leading-relaxed">{dueCards[currentCardIndex].back}</h2>
                        <span className="text-[10px] text-white/40 mt-6">
                          كيف تقيم جودة تذكرك لهذه الكلمة؟
                        </span>
                      </div>
                    </motion.div>
                  </div>

                  {/* Review Ratings */}
                  <AnimatePresence>
                    {isFlipped && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="grid grid-cols-6 gap-2"
                      >
                        {[
                          { rating: 0, label: "نسيت", color: "#ef4444" },
                          { rating: 1, label: "خطأ", color: "#f97316" },
                          { rating: 2, label: "صعب", color: "#facc15" },
                          { rating: 3, label: "متوسط", color: "#a855f7" },
                          { rating: 4, label: "سهل", color: "#10b981" },
                          { rating: 5, label: "ممتاز", color: "#06b6d4" },
                        ].map((btn) => (
                          <button
                            key={btn.rating}
                            onClick={() => handleReviewCard(btn.rating)}
                            disabled={submittingReview}
                            className="flex flex-col items-center gap-1.5 py-2 rounded-xl border hover:scale-105 active:scale-95 transition-all text-[10px] font-bold text-white disabled:opacity-50 shadow-md border-white/5"
                            style={{ 
                              backgroundColor: `${btn.color}15`, 
                              borderColor: `${btn.color}40`,
                            }}
                          >
                            <span style={{ color: btn.color }}>{btn.rating}</span>
                            <span className="text-[9px] opacity-80">{btn.label}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}

          {/* ==================== TAB: AI TUTOR ==================== */}
          {activeTab === 'tutor' && (
            <motion.div 
              key="tutor"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="h-full flex flex-col overflow-hidden p-5 gap-4"
            >
              {/* Chat Message list */}
              <div className="flex-1 rounded-3xl border p-4 overflow-y-auto space-y-4 shadow-inner"
                style={{ backgroundColor: `${theme.colors.surface}20`, borderColor: 'rgba(255,255,255,0.06)' }}
              >
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[80%] flex flex-col gap-1.5">
                      <div className="p-3.5 rounded-2xl leading-relaxed text-xs whitespace-pre-wrap relative group"
                        style={{
                          backgroundColor: msg.sender === 'user' ? theme.colors.accent : `${theme.colors.surface}90`,
                          color: msg.sender === 'user' ? '#0a0e17' : theme.colors.text,
                          borderRadius: msg.sender === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                          fontWeight: msg.sender === 'user' ? 'bold' : 'normal',
                          border: msg.sender === 'user' ? 'none' : `1px solid ${theme.colors.border}20`
                        }}
                      >
                        {msg.text}
                        
                        {msg.sender === 'tutor' && (
                          <button 
                            onClick={() => speakText(msg.text)}
                            className="absolute -left-10 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-accent opacity-0 group-hover:opacity-100 transition-all duration-200 border border-white/5"
                            title="نطق النص الإنجليزي"
                          >
                            <Volume2 size={14} />
                          </button>
                        )}
                      </div>
                      <span className="text-[9px] text-white/30 text-left px-1.5 font-sans" style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
                
                {sendingMessage && (
                  <div className="flex justify-start">
                    <div className="p-4 rounded-3xl flex items-center gap-2 text-xs font-semibold text-white/50 border border-white/5 animate-pulse"
                      style={{ backgroundColor: `${theme.colors.surface}90`, borderRadius: '20px 20px 20px 4px' }}
                    >
                      <Loader2 size={14} className="animate-spin text-accent" />
                      جاري صياغة الرد وتدقيق اللغة...
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="flex gap-2 shrink-0">
                <input
                  type="text"
                  placeholder="اكتب رسالتك بالإنجليزية أو العربية هنا (مثال: How do I improve my spelling?)..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 px-5 py-4 rounded-xl border text-xs focus:outline-none focus:border-accent text-right"
                  style={{ 
                    backgroundColor: `${theme.colors.surface}45`, 
                    borderColor: 'rgba(255,255,255,0.06)',
                    color: theme.colors.text
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!userInput.trim() || sendingMessage}
                  className="p-4 rounded-xl flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 border border-white/5 shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}
                >
                  <Send size={16} />
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  )
}
