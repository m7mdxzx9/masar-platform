import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useTheme } from '../theme/ThemeContext'
import { Card } from '../components/Card'
import { Ionicons } from '@expo/vector-icons'
import wordsByLetter from '../data/wordList'
import { translate } from '../api/endpoints'

type GameMode = 'classic' | 'speed' | 'hard' | 'category' | 'attack' | 'zen' | 'boss'
type GameState = 'menu' | 'playing' | 'victory' | 'defeat'
type Player = 'player' | 'ai'

interface WordEntry {
  word: string
  translation: string
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

const MODE_INFO: Record<GameMode, { label: string; labelAr: string; icon: keyof typeof Ionicons.glyphMap; desc: string }> = {
  classic: { label: 'Classic', labelAr: 'كلاسيكي', icon: 'swap-horizontal-outline', desc: 'بدون حدود زمنية أو قيود' },
  speed: { label: 'Speed', labelAr: 'سريع', icon: 'flash-outline', desc: '15 ثانية لكل دور' },
  hard: { label: 'Hard', labelAr: 'صعب', icon: 'shield-half-outline', desc: 'الحد الأدنى 5 أحرف، بدون أسماء علم' },
  category: { label: 'Category', labelAr: 'تصنيف', icon: 'pricetag-outline', desc: 'كلمات من فئة محددة فقط' },
  attack: { label: 'Time Attack', labelAr: 'هجوم الوقت', icon: 'timer-outline', desc: '60 ثانية إجمالاً، تضاف 3 ثوانٍ لكل إجابة صحيحة' },
  zen: { label: 'Zen', labelAr: 'استرخاء', icon: 'heart-outline', desc: 'طور هادئ لتعلم الكلمات وترجمتها دون ضغط أو خسارة' },
  boss: { label: 'Boss Battle', labelAr: 'مواجهة الزعيم', icon: 'trophy-outline', desc: 'مواجهة ذكاء اصطناعي سريع يستخدم كلمات طويلة (10 ثوانٍ للدور)' },
}

export const ChallengesScreen: React.FC = () => {
  const { colors } = useTheme()
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
  const scrollViewRef = useRef<ScrollView>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const endGame = useCallback((w: Player) => {
    if (mode === 'zen') return
    clearTimer()
    setWinner(w)
    setGameState(w === 'player' ? 'victory' : 'defeat')
  }, [clearTimer, mode])

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
        // In time attack, the timer runs continuously regardless of turn
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
  }, [isPlayerTurn, gameState, mode, clearTimer, endGame])

  const getAIWord = (lastLetter: string): string | null => {
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

  const fetchTranslation = async (word: string): Promise<string> => {
    try {
      const res = await translate(word, 'en', 'ar')
      return res.translated_text || '—'
    } catch {
      return '—'
    }
  }

  const isRealWord = async (word: string): Promise<boolean> => {
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
      return res.ok
    } catch {
      return false
    }
  }

  const addWord = useCallback(async (word: string, player: Player) => {
    const tempId = Date.now().toString() + Math.random().toString()
    const entry: WordEntry = { word, translation: 'جاري الترجمة...', player, timestamp: new Date(), id: tempId }
    
    setHistory(prev => [...prev, entry])
    setUsedWords(prev => { const s = new Set(prev); s.add(word.toLowerCase()); return s })
    setRequiredLetter(word[word.length - 1].toLowerCase())

    if (player === 'player') {
      let pts = 10
      if (word.length > 7) pts += 25
      if (mode === 'hard') pts += 50
      if (mode === 'boss') pts += 20
      setScore(prev => prev + pts)

      if (mode === 'attack') {
        // T.Attack adds 3 seconds per word
        setTimer(prev => Math.min(prev + 3, 60))
      }
    }

    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100)

    try {
      const trans = await fetchTranslation(word)
      setHistory(prev => prev.map(item => item.id === tempId ? { ...item, translation: trans } : item))
    } catch {
      setHistory(prev => prev.map(item => item.id === tempId ? { ...item, translation: 'فشلت الترجمة' } : item))
    }
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100)
  }, [mode])

  const startGame = async () => {
    setHistory([])
    setUsedWords(new Set())
    setScore(0)
    setError('')
    setIsPlayerTurn(false)
    setWinner(null)
    setGameState('playing')
    
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

    // AI plays first
    const letters = Object.keys(wordsByLetter)
    const randomLetter = letters[Math.floor(Math.random() * letters.length)]
    const firstWord = getAIWord(randomLetter)
    
    if (!firstWord) {
      setAiThinking(false)
      Alert.alert('خطأ', 'فشل الذكاء الاصطناعي في إيجاد كلمة أولى.')
      setGameState('menu')
      return
    }

    await new Promise(r => setTimeout(r, 1000))
    await addWord(firstWord, 'ai')
    setAiThinking(false)
    setIsPlayerTurn(true)
  }

  const triggerAITurn = async (lastWord: string) => {
    setAiThinking(true)
    const letter = lastWord[lastWord.length - 1].toLowerCase()
    
    // Simulate AI thinking time
    const thinkTime = mode === 'boss' ? 800 : 1500
    await new Promise(r => setTimeout(r, thinkTime))
    
    const aiWord = getAIWord(letter)
    if (!aiWord) {
      setAiThinking(false)
      endGame('player')
      return
    }
    
    await addWord(aiWord, 'ai')
    setAiThinking(false)
    setIsPlayerTurn(true)
  }

  const handlePlayerSubmit = async () => {
    setError('')
    const word = input.trim().toLowerCase()
    if (!word) return

    // Standard word chain rules validation
    if (requiredLetter && word[0] !== requiredLetter) {
      setError(`يجب أن تبدأ الكلمة بحرف "${requiredLetter.toUpperCase()}"`)
      return
    }

    if (usedWords.has(word)) {
      setError('هذه الكلمة تم استخدامها بالفعل!')
      return
    }

    if (mode === 'hard' && word.length < 5) {
      setError('الحد الأدنى لطول الكلمة في الطور الصعب هو 5 أحرف!')
      return
    }

    if (mode === 'category' && category && CATEGORY_WORDS[category]) {
      const catSet = CATEGORY_WORDS[category]
      if (!catSet.has(word)) {
        setError(`الكلمة ليست جزءاً من التصنيف المختار: ${category}`)
        return
      }
    }

    // Call Dictionary Validation API
    setAiThinking(true)
    const real = await isRealWord(word)
    if (!real) {
      setAiThinking(false)
      setError('هذه الكلمة ليست كلمة إنجليزية صحيحة!')
      return
    }

    setInput('')
    await addWord(word, 'player')
    setIsPlayerTurn(false)
    
    // AI turn
    await triggerAITurn(word)
  }

  const renderTimerText = () => {
    if (mode === 'classic' || mode === 'zen') return null
    return (
      <View style={[styles.timerBadge, { backgroundColor: timer <= 4 ? colors.error + '20' : colors.surfaceHover, borderColor: timer <= 4 ? colors.error : colors.border }]}>
        <Ionicons name="time-outline" size={16} color={timer <= 4 ? colors.error : colors.accent} style={{ marginLeft: 6 }} />
        <Text style={[styles.timerText, { color: timer <= 4 ? colors.error : colors.text }]}>{timer} ثوانٍ</Text>
      </View>
    )
  }

  if (gameState === 'playing') {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={[styles.gameContainer, { backgroundColor: colors.bg }]}>
          {/* Header Stats bar */}
          <View style={[styles.gameHeader, { borderColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <Text style={[styles.modeLabel, { color: colors.textMuted }]}>الطور: {MODE_INFO[mode].labelAr}</Text>
              {mode === 'category' && <Text style={[styles.modeLabel, { color: colors.accent, fontSize: 10 }]}>الفئة: {category}</Text>}
            </View>
            <View style={styles.headerRight}>
              {renderTimerText()}
              <View style={[styles.scoreBadge, { backgroundColor: colors.accentGlow, borderColor: colors.accent }]}>
                <Ionicons name="trophy-outline" size={14} color={colors.accent} style={{ marginLeft: 4 }} />
                <Text style={[styles.scoreText, { color: colors.accent }]}>{score} نقطة</Text>
              </View>
            </View>
          </View>

          {/* History scroll */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.chatScroll}
            contentContainerStyle={styles.chatContent}
            keyboardShouldPersistTaps="handled"
          >
            {history.map((h, index) => {
              const isPlayer = h.player === 'player'
              return (
                <View
                  key={index}
                  style={[
                    styles.chatRow,
                    { justifyContent: isPlayer ? 'flex-end' : 'flex-start' }
                  ]}
                >
                  <View
                    style={[
                      styles.bubble,
                      isPlayer
                        ? {
                            backgroundColor: colors.accentGlow,
                            borderColor: colors.accent,
                            borderBottomRightRadius: 2,
                            alignItems: 'flex-end'
                          }
                        : {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                            borderBottomLeftRadius: 2,
                            alignItems: 'flex-start'
                          }
                    ]}
                  >
                    <Text style={[styles.bubbleWord, { color: colors.text }]}>{h.word}</Text>
                    <Text style={[styles.bubbleTrans, { color: colors.textMuted }]}>{h.translation}</Text>
                  </View>
                </View>
              )
            })}

            {aiThinking && (
              <View style={[styles.chatRow, { justifyContent: 'flex-start' }]}>
                <View style={[styles.bubble, { backgroundColor: colors.surface, borderColor: colors.border, borderBottomLeftRadius: 2, paddingVertical: 12 }]}>
                  <ActivityIndicator size="small" color={colors.accent} />
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input & Action Panel */}
          <View style={[styles.actionPanel, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
            {requiredLetter ? (
              <View style={styles.requiredLetterRow}>
                <Text style={[styles.requiredText, { color: colors.text }]}>
                  الحرف المطلوب للبداية: <Text style={{ color: colors.accent, fontWeight: '800', fontSize: 16 }}>{requiredLetter.toUpperCase()}</Text>
                </Text>
              </View>
            ) : null}

            {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}

            <View style={styles.inputRow}>
              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: colors.accent }]}
                onPress={handlePlayerSubmit}
                disabled={aiThinking || !isPlayerTurn}
              >
                <Ionicons name="send" size={20} color={colors.bg} />
              </TouchableOpacity>
              <TextInput
                style={[
                  styles.gameInput,
                  {
                    backgroundColor: colors.surfaceHover,
                    color: colors.text,
                    borderColor: colors.border,
                  }
                ]}
                placeholder={isPlayerTurn ? "اكتب كلمة بالإنجليزية هنا..." : "انتظر دور الذكاء الاصطناعي..."}
                placeholderTextColor={colors.textMuted}
                value={input}
                onChangeText={setInput}
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={handlePlayerSubmit}
                editable={isPlayerTurn && !aiThinking}
              />
            </View>

            <TouchableOpacity style={styles.quitBtn} onPress={() => setGameState('menu')}>
              <Text style={[styles.quitText, { color: colors.error }]}>الانسحاب والعودة للقائمة ✖</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    )
  }

  if (gameState === 'victory' || gameState === 'defeat') {
    const isWin = gameState === 'victory'
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.bg }]}>
        <View style={styles.gameOverCard}>
          <View style={[styles.iconCircle, { backgroundColor: isWin ? colors.success + '20' : colors.error + '20' }]}>
            <Ionicons name={isWin ? "trophy" : "sad-outline"} size={64} color={isWin ? colors.success : colors.error} />
          </View>
          <Text style={[styles.gameOverTitle, { color: isWin ? colors.success : colors.error }]}>
            {isWin ? 'تهانينا! لقد انتصرت' : 'للأسف، خسرت الجولة'}
          </Text>
          <Text style={[styles.gameOverScore, { color: colors.text }]}>النقاط المسجلة: {score}</Text>
          <Text style={[styles.gameOverSub, { color: colors.textMuted }]}>
            {isWin ? 'الذكاء الاصطناعي لم يجد كلمة مناسبة!' : 'لقد نفذ الوقت المخصص لدورك.'}
          </Text>

          <TouchableOpacity style={[styles.btnAction, { backgroundColor: colors.accent }]} onPress={startGame}>
            <Text style={[styles.btnActionText, { color: colors.bg }]}>لعب مجدداً ↺</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnLink} onPress={() => setGameState('menu')}>
            <Text style={[styles.btnLinkText, { color: colors.text }]}>القائمة الرئيسية</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>
      <Card style={[styles.introCard, { borderColor: colors.border }]}>
        <View style={styles.introHeader}>
          <Ionicons name="game-controller-outline" size={32} color={colors.accent} style={{ marginLeft: 12 }} />
          <Text style={[styles.introTitle, { color: colors.text }]}>سجال الكلمات الإنجليزية (Word Chain)</Text>
        </View>
        <Text style={[styles.introDesc, { color: colors.textMuted }]}>
          لعبة تحدي الذكاء الاصطناعي في تكوين سلاسل من الكلمات الإنجليزية المترابطة. يجب أن تبدأ كلمتك بالحرف الأخير من كلمة الخصم. يتم تلوين الكلمة وترجمتها للعربية تلقائياً ويتم التحقق من صحة الكلمة مع القاموس الإنجليزي.
        </Text>
      </Card>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>اختر طور اللعب:</Text>
      
      {/* Modes list */}
      <View style={styles.modesList}>
        {(Object.keys(MODE_INFO) as GameMode[]).map((mKey) => {
          const isSelected = mode === mKey
          const m = MODE_INFO[mKey]
          return (
            <TouchableOpacity
              key={mKey}
              style={[
                styles.modeCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: isSelected ? colors.accent : colors.border,
                  borderWidth: isSelected ? 2 : 1
                }
              ]}
              onPress={() => setMode(mKey)}
            >
              <View style={[styles.modeIconBox, { backgroundColor: isSelected ? colors.accentGlow : colors.surfaceHover }]}>
                <Ionicons name={m.icon} size={22} color={isSelected ? colors.accent : colors.textMuted} />
              </View>
              <View style={styles.modeInfoText}>
                <Text style={[styles.modeTitle, { color: colors.text, textAlign: 'right' }]}>{m.labelAr} ({m.label})</Text>
                <Text style={[styles.modeDesc, { color: colors.textMuted, textAlign: 'right' }]}>{m.desc}</Text>
              </View>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Category selection */}
      {mode === 'category' && (
        <View style={styles.categoryBox}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 12 }]}>اختر فئة الكلمات:</Text>
          <ScrollView horizontal style={styles.categoriesScroll} contentContainerStyle={{ flexDirection: 'row-reverse' }}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.catChip,
                  {
                    backgroundColor: category === cat ? colors.accentGlow : colors.surface,
                    borderColor: category === cat ? colors.accent : colors.border
                  }
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.catChipText, { color: category === cat ? colors.accent : colors.text }]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Start Button */}
      <TouchableOpacity style={[styles.startBtn, { backgroundColor: colors.accent }]} onPress={startGame}>
        <Ionicons name="play" size={18} color={colors.bg} style={{ marginLeft: 6 }} />
        <Text style={[styles.startBtnText, { color: colors.bg }]}>بدء المواجهة الآن</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  introCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  introHeader: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 10 },
  introTitle: { fontSize: 16, fontWeight: '700' },
  introDesc: { fontSize: 12, lineHeight: 18, textAlign: 'right' },
  
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12, textAlign: 'right' },
  
  modesList: { gap: 10, marginBottom: 20 },
  modeCard: { flexDirection: 'row-reverse', padding: 12, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  modeIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  modeInfoText: { flex: 1 },
  modeTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  modeDesc: { fontSize: 11 },

  categoryBox: { marginBottom: 20 },
  categoriesScroll: { flexDirection: 'row', gap: 8 },
  catChip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, marginLeft: 8 },
  catChipText: { fontSize: 12, fontWeight: '700' },

  startBtn: { height: 48, borderRadius: 12, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  startBtnText: { fontSize: 14, fontWeight: '700' },

  // Playing layout
  gameContainer: { flex: 1 },
  gameHeader: { height: 50, borderBottomWidth: 1, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 },
  headerLeft: { alignItems: 'flex-end' },
  modeLabel: { fontSize: 11, fontWeight: '700' },
  headerRight: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  timerBadge: { flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 10, borderWidth: 1 },
  timerText: { fontSize: 11, fontWeight: '700' },
  scoreBadge: { flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 10, borderWidth: 1 },
  scoreText: { fontSize: 11, fontWeight: '800' },

  chatScroll: { flex: 1, padding: 16 },
  chatContent: { paddingBottom: 20 },
  chatRow: { flexDirection: 'row', width: '100%', marginBottom: 12 },
  bubble: { maxWidth: '75%', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1 },
  bubbleWord: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  bubbleTrans: { fontSize: 11 },

  // Action Panel
  actionPanel: { borderTopWidth: 1.5, padding: 16 },
  requiredLetterRow: { marginBottom: 10, alignItems: 'center' },
  requiredText: { fontSize: 13, fontWeight: '600' },
  errorText: { fontSize: 12, fontWeight: '700', textAlign: 'center', marginBottom: 10 },
  inputRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  gameInput: { flex: 1, height: 46, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, fontSize: 14, textAlign: 'right' },
  sendBtn: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quitBtn: { marginTop: 14, alignItems: 'center' },
  quitText: { fontSize: 12, fontWeight: '700' },

  // Game over
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  gameOverCard: { width: '100%', padding: 24, borderRadius: 20, borderWidth: 1, borderColor: '#333', alignItems: 'center', backgroundColor: '#0f0f15' },
  iconCircle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  gameOverTitle: { fontSize: 20, fontWeight: '800', marginBottom: 10 },
  gameOverScore: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  gameOverSub: { fontSize: 12, textAlign: 'center', marginBottom: 24 },
  btnAction: { height: 46, borderRadius: 12, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  btnActionText: { fontSize: 14, fontWeight: '700' },
  btnLink: { padding: 10 },
  btnLinkText: { fontSize: 13, fontWeight: '700' },
})

export default ChallengesScreen
