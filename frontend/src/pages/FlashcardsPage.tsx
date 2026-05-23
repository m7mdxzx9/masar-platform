import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Layers, Plus, Trash2, ChevronLeft, ChevronRight, RotateCw, Loader2, BrainCircuit, CheckCircle2, HelpCircle, XCircle, PenSquare, Sparkles } from 'lucide-react'
import { useTheme } from '@/theme/ThemeContext'
import { useFlashcardStore } from '@/stores/flashcardStore'

export default function FlashcardsPage() {
  const { theme } = useTheme()
  const {
    decks, currentDeck, cards, currentCardIndex, isFlipped,
    isLoading, error,
    fetchDecks, createDeck, deleteDeck, selectDeck, addCard, reviewCard, flipCard, reset,
  } = useFlashcardStore()
  const [showCreate, setShowCreate] = useState(false)
  const [deckTitle, setDeckTitle] = useState('')
  const [deckDesc, setDeckDesc] = useState('')
  const [showAddCard, setShowAddCard] = useState(false)
  const [showDueOnly, setShowDueOnly] = useState(false)
  const [cardFront, setCardFront] = useState('')
  const [cardBack, setCardBack] = useState('')

  useEffect(() => { fetchDecks() }, [])

  const handleCreateDeck = async () => {
    if (!deckTitle.trim()) return
    await createDeck(deckTitle, deckDesc || undefined)
    setDeckTitle('')
    setDeckDesc('')
    setShowCreate(false)
  }

  const handleAddCard = async () => {
    if (!cardFront.trim() || !cardBack.trim() || !currentDeck) return
    await addCard(currentDeck.id, cardFront, cardBack)
    setCardFront('')
    setCardBack('')
    setShowAddCard(false)
  }

  const currentCard = cards[currentCardIndex]
  const displayCards = showDueOnly ? cards.filter(c => c.is_due) : cards
  const dueIndex = displayCards.findIndex(c => c.id === currentCard?.id)
  const displayIndex = dueIndex >= 0 ? dueIndex : 0
  const displayCard = displayCards[displayIndex]

  return (
    <div className="h-full overflow-y-auto p-6" style={{ direction: 'rtl' }}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
            <BrainCircuit size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: theme.colors.text }}>بطاقات تعليمية</h1>
            <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>التكرار المتباعد لحفظ المعلومات</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 shadow-lg"
          style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
          <Plus size={18} />حزمة جديدة
        </button>
      </div>

      {isLoading && decks.length === 0 ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.colors.accent }} /></div>
      ) : error ? (
        <div className="p-4 rounded-xl text-sm" style={{ backgroundColor: `${theme.colors.error}15`, color: theme.colors.error, border: `1px solid ${theme.colors.error}30` }}>{error}</div>
      ) : currentDeck ? (
        <div>
          {/* Deck header */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={reset} className="flex items-center gap-2 text-sm font-medium transition-all hover:opacity-70" style={{ color: theme.colors.textMuted }}>
              <ChevronRight size={16} />العودة للحزم
            </button>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowAddCard(true)} className="p-2 rounded-lg hover:bg-white/10 transition-all" style={{ color: theme.colors.accent }}>
                <Plus size={18} />
              </button>
              <button onClick={() => deleteDeck(currentDeck.id)} className="p-2 rounded-lg hover:bg-white/10 transition-all" style={{ color: theme.colors.error }}>
                <Trash2 size={18} />
              </button>
              <button onClick={() => { setShowDueOnly(!showDueOnly); useFlashcardStore.setState({ currentCardIndex: 0, isFlipped: false }) }}
                className={`p-2 rounded-lg transition-all ${showDueOnly ? 'text-white' : ''}`}
                style={{
                  color: showDueOnly ? '#fff' : theme.colors.warning,
                  backgroundColor: showDueOnly ? theme.colors.warning + '40' : 'transparent',
                  border: `1px solid ${showDueOnly ? theme.colors.warning : 'transparent'}`,
                }}
                title="المراجعة فقط">
                <RotateCw size={18} />
              </button>
            </div>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-xl font-bold" style={{ color: theme.colors.text }}>{currentDeck.title}</h2>
            <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>
              {displayIndex + 1} / {displayCards.length}
              {cards.filter(c => c.is_due).length > 0 && (
                <span className="mr-3" style={{ color: theme.colors.warning }}>{cards.filter(c => c.is_due).length} للمراجعة</span>
              )}
            </p>
          </div>

          {displayCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-50">
              <Layers size={64} className="mb-4" style={{ color: theme.colors.textDark }} />
              <p className="text-lg font-bold" style={{ color: theme.colors.text }}>لا توجد بطاقات</p>
              <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>أضف بطاقات جديدة للبدء</p>
            </div>
          ) : displayCard ? (
            <div className="max-w-lg mx-auto">
              <AnimatePresence mode="wait">
                <motion.div key={displayIndex} initial={{ opacity: 0, rotateY: 90 }} animate={{ opacity: 1, rotateY: 0 }} exit={{ opacity: 0, rotateY: -90 }}
                  onClick={flipCard}
                  className="rounded-2xl p-10 cursor-pointer min-h-[280px] flex flex-col items-center justify-center text-center shadow-xl"
                  style={{
                    backgroundColor: isFlipped ? `${theme.colors.accent}10` : theme.colors.surface,
                    border: `2px solid ${isFlipped ? theme.colors.accent : theme.colors.border}`,
                    transition: 'all 0.3s ease',
                  }}>
                  {isFlipped ? (
                    <div>
                      <p className="text-xs font-bold mb-3 px-3 py-1 rounded-full inline-block" style={{ backgroundColor: `${theme.colors.accent}20`, color: theme.colors.accent }}>الإجابة</p>
                      <p className="text-lg leading-relaxed" style={{ color: theme.colors.text }}>{displayCard.back}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-bold mb-3 px-3 py-1 rounded-full inline-block" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: theme.colors.textDark }}>السؤال</p>
                      <p className="text-xl font-bold leading-relaxed" style={{ color: theme.colors.text }}>{displayCard.front}</p>
                      <p className="text-xs mt-8" style={{ color: theme.colors.textMuted }}>اضغط للكشف عن الإجابة</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Rating buttons */}
              {isFlipped && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 mt-6 justify-center">
                  <button onClick={() => reviewCard(displayCard.id, 1)}
                    className="flex flex-col items-center gap-1 px-5 py-3 rounded-xl text-xs font-bold transition-all hover:scale-105"
                    style={{ backgroundColor: `${theme.colors.error}20`, color: theme.colors.error, border: `1px solid ${theme.colors.error}30` }}>
                    <XCircle size={20} />صعب
                  </button>
                  <button onClick={() => reviewCard(displayCard.id, 3)}
                    className="flex flex-col items-center gap-1 px-5 py-3 rounded-xl text-xs font-bold transition-all hover:scale-105"
                    style={{ backgroundColor: `${theme.colors.warning}20`, color: theme.colors.warning, border: `1px solid ${theme.colors.warning}30` }}>
                    <HelpCircle size={20} />متوسط
                  </button>
                  <button onClick={() => reviewCard(displayCard.id, 5)}
                    className="flex flex-col items-center gap-1 px-5 py-3 rounded-xl text-xs font-bold transition-all hover:scale-105"
                    style={{ backgroundColor: `${theme.colors.success}20`, color: theme.colors.success, border: `1px solid ${theme.colors.success}30` }}>
                    <CheckCircle2 size={20} />سهل
                  </button>
                </motion.div>
              )}

              {/* Nav arrows */}
              <div className="flex items-center justify-center gap-4 mt-6">
                <button onClick={() => useFlashcardStore.setState({ currentCardIndex: Math.max(0, displayIndex - 1), isFlipped: false })}
                  disabled={displayIndex === 0}
                  className="p-3 rounded-xl transition-all hover:bg-white/5 disabled:opacity-20"
                  style={{ color: theme.colors.textMuted, border: `1px solid ${theme.colors.border}` }}>
                  <ChevronRight size={20} />
                </button>
                <button onClick={() => useFlashcardStore.setState({ currentCardIndex: Math.min(displayCards.length - 1, displayIndex + 1), isFlipped: false })}
                  disabled={displayIndex === displayCards.length - 1}
                  className="p-3 rounded-xl transition-all hover:bg-white/5 disabled:opacity-20"
                  style={{ color: theme.colors.textMuted, border: `1px solid ${theme.colors.border}` }}>
                  <ChevronLeft size={20} />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div>
          {decks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-50">
              <BrainCircuit size={64} className="mb-4" style={{ color: theme.colors.textDark }} />
              <p className="text-xl font-bold" style={{ color: theme.colors.text }}>لا توجد حزم بطاقات</p>
              <p className="text-sm mt-2" style={{ color: theme.colors.textMuted }}>أنشئ حزمة جديدة لبدء التعلم بالتكرار المتباعد</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {decks.map((deck, idx) => (
                <motion.div key={deck.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                  onClick={() => selectDeck(deck)}
                  className="rounded-2xl p-6 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl"
                  style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
                      <Layers size={20} className="text-white" />
                    </div>
                    {deck.due_count > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: `${theme.colors.warning}20`, color: theme.colors.warning }}>
                        {deck.due_count} للمراجعة
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm mb-1" style={{ color: theme.colors.text }}>{deck.title}</h3>
                  {deck.description && <p className="text-xs mb-3" style={{ color: theme.colors.textMuted }}>{deck.description}</p>}
                  <div className="flex items-center gap-3 text-xs" style={{ color: theme.colors.textDark }}>
                    <span>{deck.card_count} بطاقة</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Deck Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md mx-4 rounded-2xl p-8 shadow-2xl" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }} onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-6" style={{ color: theme.colors.text }}>حزمة جديدة</h2>
            <div className="space-y-4">
              <input placeholder="عنوان الحزمة *" value={deckTitle} onChange={(e) => setDeckTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${theme.colors.border}`, color: theme.colors.text }} />
              <textarea placeholder="وصف (اختياري)" value={deckDesc} onChange={(e) => setDeckDesc(e.target.value)} rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${theme.colors.border}`, color: theme.colors.text }} />
              <div className="flex gap-3">
                <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all hover:bg-white/5"
                  style={{ color: theme.colors.textMuted, border: `1px solid ${theme.colors.border}` }}>إلغاء</button>
                <button onClick={handleCreateDeck} disabled={!deckTitle.trim()}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>إنشاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Card Modal */}
      {showAddCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAddCard(false)}>
          <div className="w-full max-w-lg mx-4 rounded-2xl p-8 shadow-2xl" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }} onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-6" style={{ color: theme.colors.text }}>بطاقة جديدة</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: theme.colors.textMuted }}>السؤال (الوجه الأمامي)</label>
                <textarea placeholder="اكتب السؤال..." value={cardFront} onChange={(e) => setCardFront(e.target.value)} rows={3}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                  style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${theme.colors.border}`, color: theme.colors.text }} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: theme.colors.textMuted }}>الإجابة (الوجه الخلفي)</label>
                <textarea placeholder="اكتب الإجابة..." value={cardBack} onChange={(e) => setCardBack(e.target.value)} rows={3}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                  style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${theme.colors.border}`, color: theme.colors.text }} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowAddCard(false)} className="flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all hover:bg-white/5"
                  style={{ color: theme.colors.textMuted, border: `1px solid ${theme.colors.border}` }}>إلغاء</button>
                <button onClick={handleAddCard} disabled={!cardFront.trim() || !cardBack.trim()}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>إضافة</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
