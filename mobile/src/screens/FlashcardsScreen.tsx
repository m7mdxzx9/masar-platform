import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Animated as RNAnimated,
} from 'react-native'
import { useTheme } from '../theme/ThemeContext'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '../utils/asyncStorage'
import { generateFlashcards as generateFlashcardsApi } from '../api/endpoints'
import { FlashList } from '@shopify/flash-list'
import Animated, { FadeInDown, FadeOutUp, LinearTransition } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'

interface Flashcard {
  id: string
  front: string
  back: string
  box: number // Spaced repetition Leitner system (1 to 5)
  nextReview: number // timestamp
}

interface Deck {
  id: string
  title: string
  cards: Flashcard[]
}

export const FlashcardsScreen: React.FC = () => {
  const { colors } = useTheme()

  // Decks list
  const [decks, setDecks] = useState<Deck[]>([])
  const [loading, setLoading] = useState(false)

  // Active review deck
  const [activeDeck, setActiveDeck] = useState<Deck | null>(null)
  const [reviewCards, setReviewCards] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  // Modals
  const [showAddDeck, setShowAddDeck] = useState(false)
  const [showAddCard, setShowAddCard] = useState(false)
  const [showAiGen, setShowAiGen] = useState(false)

  // Form states
  const [newDeckTitle, setNewDeckTitle] = useState('')
  const [selectedDeckId, setSelectedDeckId] = useState('')
  const [cardFront, setCardFront] = useState('')
  const [cardBack, setCardBack] = useState('')
  const [aiTopic, setAiTopic] = useState('')

  // Card flip animation
  const flipAnim = useRef(new RNAnimated.Value(0)).current

  useEffect(() => {
    loadDecks()
  }, [])

  const loadDecks = async () => {
    try {
      const stored = await AsyncStorage.getItem('masar_flashcard_decks')
      if (stored) {
        setDecks(JSON.parse(stored))
      } else {
        // Pre-populate with standard template
        const samples: Deck[] = [
          {
            id: 'd1',
            title: 'أساسيات بايثون',
            cards: [
              { id: 'c1', front: 'ما هي الدالة print()؟', back: 'تستخدم لطباعة النصوص والمخرجات على الشاشة.', box: 1, nextReview: Date.now() },
              { id: 'c2', front: 'كيف تنشئ قائمة (List)؟', back: 'عن طريق استخدام الأقواس المربعة [1, 2, 3].', box: 1, nextReview: Date.now() },
            ],
          },
        ]
        await saveDecks(samples)
      }
    } catch (e) {
      console.log(e)
    }
  }

  const saveDecks = async (updatedDecks: Deck[]) => {
    try {
      await AsyncStorage.setItem('masar_flashcard_decks', JSON.stringify(updatedDecks))
      setDecks(updatedDecks)
    } catch (e) {
      console.log(e)
    }
  }

  const handleCreateDeck = async () => {
    if (!newDeckTitle) return
    const newDeck: Deck = {
      id: Date.now().toString(),
      title: newDeckTitle,
      cards: [],
    }
    const updated = [...decks, newDeck]
    await saveDecks(updated)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    setNewDeckTitle('')
    setShowAddDeck(false)
  }

  const handleAddCard = async () => {
    if (!selectedDeckId || !cardFront || !cardBack) {
      Alert.alert('تنبيه', 'يرجى ملء جميع الحقول')
      return
    }
    const newCard: Flashcard = {
      id: Date.now().toString(),
      front: cardFront,
      back: cardBack,
      box: 1,
      nextReview: Date.now(),
    }

    const updated = decks.map((d) => {
      if (d.id === selectedDeckId) {
        return { ...d, cards: [...d.cards, newCard] }
      }
      return d
    })

    await saveDecks(updated)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    setCardFront('')
    setCardBack('')
    setShowAddCard(false)
  }

  const handleAiGenerate = async () => {
    if (!aiTopic) return
    setLoading(true)
    setShowAiGen(false)
    try {
      const res = await generateFlashcardsApi(aiTopic, 5)
      let cards: Flashcard[] = []
      if (res && res.flashcards) {
        cards = res.flashcards.map((c: any, index: number) => ({
          id: `${Date.now()}-${index}`,
          front: c.front,
          back: c.back,
          box: 1,
          nextReview: Date.now(),
        }))
      } else if (Array.isArray(res)) {
        cards = res.map((c: any, index: number) => ({
          id: `${Date.now()}-${index}`,
          front: c.front || c.question,
          back: c.back || c.answer,
          box: 1,
          nextReview: Date.now(),
        }))
      }

      if (cards.length > 0) {
        const newDeck: Deck = {
          id: Date.now().toString(),
          title: `بطاقات AI: ${aiTopic}`,
          cards,
        }
        const updated = [...decks, newDeck]
        await saveDecks(updated)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        setAiTopic('')
        Alert.alert('نجاح', 'تم إنشاء مجموعة بطاقات بالذكاء الاصطناعي بنجاح!')
      } else {
        Alert.alert('خطأ', 'لم نتمكن من صياغة بطاقات استذكار للموضوع المحدد.')
      }
    } catch (e) {
      Alert.alert('خطأ', 'حدث خطأ أثناء الاتصال بالخادم.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDeck = async (deckId: string) => {
    Alert.alert('حذف المجموعة', 'هل أنت متأكد من رغبتك في حذف هذه المجموعة بالكامل؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          const updated = decks.filter((d) => d.id !== deckId)
          await saveDecks(updated)
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        }
      }
    ])
  }

  // Active Review Flow
  const startReview = (deck: Deck) => {
    const cardsToReview = deck.cards.filter((c) => c.nextReview <= Date.now())
    if (cardsToReview.length === 0) {
      Alert.alert('رائع!', 'لقد أكملت مراجعة جميع بطاقات هذه المجموعة لليوم.')
      return
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setActiveDeck(deck)
    setReviewCards(cardsToReview)
    setCurrentIndex(0)
    setIsFlipped(false)
    flipAnim.setValue(0)
  }

  const flipCard = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    RNAnimated.spring(flipAnim, {
      toValue: isFlipped ? 0 : 180,
      friction: 8,
      tension: 15,
      useNativeDriver: true,
    }).start()
    setIsFlipped(!isFlipped)
  }

  const handleRateCard = async (quality: 'easy' | 'medium' | 'hard') => {
    if (!activeDeck) return

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    const currentCard = reviewCards[currentIndex]
    let nextBox = currentCard.box
    let intervalDays = 1

    if (quality === 'easy') {
      nextBox = Math.min(currentCard.box + 1, 5)
      intervalDays = nextBox === 2 ? 2 : nextBox === 3 ? 5 : nextBox === 4 ? 10 : 30
    } else if (quality === 'hard') {
      nextBox = Math.max(currentCard.box - 1, 1)
      intervalDays = 1
    } else {
      nextBox = currentCard.box
      intervalDays = nextBox === 1 ? 1 : nextBox === 2 ? 2 : nextBox === 3 ? 4 : 8
    }

    const updatedCard: Flashcard = {
      ...currentCard,
      box: nextBox,
      nextReview: Date.now() + intervalDays * 24 * 60 * 60 * 1000,
    }

    // Update inside decks
    const updatedDecks = decks.map((d) => {
      if (d.id === activeDeck.id) {
        return {
          ...d,
          cards: d.cards.map((c) => (c.id === currentCard.id ? updatedCard : c)),
        }
      }
      return d
    })

    await saveDecks(updatedDecks)

    // Move to next card
    if (currentIndex < reviewCards.length - 1) {
      setIsFlipped(false)
      flipAnim.setValue(0)
      setCurrentIndex((prev) => prev + 1)
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Alert.alert('عمل رائع!', 'لقد أنهيت جلسة الاستذكار المتبقية لهذه المجموعة.')
      setActiveDeck(null)
    }
  }

  // Animation values
  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  })
  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  })

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.text }]}>جاري معالجة بطاقات الذكاء الاصطناعي...</Text>
      </View>
    )
  }

  if (activeDeck) {
    const card = reviewCards[currentIndex]
    const percent = Math.round(((currentIndex + 1) / reviewCards.length) * 100)

    return (
      <View style={[styles.container, { backgroundColor: colors.bg, padding: 16 }]}>
        {/* Header stats */}
        <View style={styles.reviewHeader}>
          <Text style={[styles.deckTitleText, { color: colors.text }]}>{activeDeck.title}</Text>
          <Text style={[styles.reviewProgressText, { color: colors.textMuted }]}>
            البطاقة {currentIndex + 1} من {reviewCards.length}
          </Text>
        </View>

        <View style={[styles.progressBarBg, { backgroundColor: colors.border, marginBottom: 30 }]}>
          <View style={[styles.progressBarFill, { backgroundColor: colors.accent, width: `${percent}%` }]} />
        </View>

        {/* Card Flip Container */}
        <TouchableOpacity activeOpacity={0.95} onPress={flipCard} style={styles.cardWrapper}>
          <View style={styles.flipCardContainer}>
            {/* Front Card */}
            <RNAnimated.View
              style={[
                styles.flipCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  transform: [{ perspective: 1000 }, { rotateY: frontInterpolate }],
                  backfaceVisibility: 'hidden',
                },
              ]}
            >
              <View style={[styles.badge, { backgroundColor: colors.accentGlow }]}>
                <Ionicons name="help-circle-outline" size={14} color={colors.accent} style={{ marginLeft: 4 }} />
                <Text style={[styles.badgeText, { color: colors.accent }]}>مفهوم / سؤال</Text>
              </View>
              <Text style={[styles.cardBodyText, { color: colors.text }]}>{card.front}</Text>
              <View style={styles.flipHintRow}>
                <Ionicons name="sync-outline" size={14} color={colors.textMuted} style={{ marginLeft: 4 }} />
                <Text style={[styles.flipHintText, { color: colors.textMuted }]}>اضغط لقلب البطاقة ومعاينة الإجابة</Text>
              </View>
            </RNAnimated.View>

            {/* Back Card */}
            <RNAnimated.View
              style={[
                styles.flipCard,
                styles.flipCardBack,
                {
                  backgroundColor: colors.surfaceHover,
                  borderColor: colors.accent,
                  transform: [{ perspective: 1000 }, { rotateY: backInterpolate }],
                  backfaceVisibility: 'hidden',
                },
              ]}
            >
              <View style={[styles.badge, { backgroundColor: 'rgba(0, 255, 136, 0.12)' }]}>
                <Ionicons name="checkmark-circle-outline" size={14} color={colors.success} style={{ marginLeft: 4 }} />
                <Text style={[styles.badgeText, { color: colors.success }]}>الإجابة / الشرح</Text>
              </View>
              <Text style={[styles.cardBodyText, { color: colors.text }]}>{card.back}</Text>
              <View style={styles.flipHintRow}>
                <Ionicons name="sync-outline" size={14} color={colors.textMuted} style={{ marginLeft: 4 }} />
                <Text style={[styles.flipHintText, { color: colors.textMuted }]}>اضغط لقلب البطاقة مجدداً</Text>
              </View>
            </RNAnimated.View>
          </View>
        </TouchableOpacity>

        {/* Ratings controllers */}
        {isFlipped ? (
          <View style={styles.ratingSection}>
            <Text style={[styles.ratingInstructions, { color: colors.text }]}>كيف تقيم مستوى تذكرك؟</Text>
            <View style={styles.ratingRow}>
              {/* Hard Option */}
              <TouchableOpacity
                style={[styles.ratingBtn, { backgroundColor: colors.error + '12', borderColor: colors.error }]}
                onPress={() => handleRateCard('hard')}
              >
                <Ionicons name="close-circle-outline" size={18} color={colors.error} style={{ marginBottom: 4 }} />
                <Text style={[styles.ratingBtnText, { color: colors.error }]}>صعب</Text>
                <Text style={[styles.ratingSubtext, { color: colors.error }]}>إعادة قريباً</Text>
              </TouchableOpacity>
              
              {/* Medium Option */}
              <TouchableOpacity
                style={[styles.ratingBtn, { backgroundColor: colors.warning + '12', borderColor: colors.warning }]}
                onPress={() => handleRateCard('medium')}
              >
                <Ionicons name="help-circle-outline" size={18} color={colors.warning} style={{ marginBottom: 4 }} />
                <Text style={[styles.ratingBtnText, { color: colors.warning }]}>متوسط</Text>
                <Text style={[styles.ratingSubtext, { color: colors.warning }]}>تكرار متباعد</Text>
              </TouchableOpacity>

              {/* Easy Option */}
              <TouchableOpacity
                style={[styles.ratingBtn, { backgroundColor: colors.success + '12', borderColor: colors.success }]}
                onPress={() => handleRateCard('easy')}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} style={{ marginBottom: 4 }} />
                <Text style={[styles.ratingBtnText, { color: colors.success }]}>سهل جداً</Text>
                <Text style={[styles.ratingSubtext, { color: colors.success }]}>مؤجل للمستقبل</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.ratingPlaceholder} />
        )}

        <TouchableOpacity style={[styles.quitBtn, { borderColor: colors.border }]} onPress={() => setActiveDeck(null)}>
          <Text style={[styles.quitBtnText, { color: colors.text }]}>إنهاء الجلسة</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const renderDeckItem = ({ item, index }: { item: Deck; index: number }) => {
    const dueCards = item.cards.filter((c) => c.nextReview <= Date.now()).length
    return (
      <Animated.View
        entering={FadeInDown.delay(index * 40).duration(250)}
        exiting={FadeOutUp}
        layout={LinearTransition}
      >
        <View style={[styles.deckCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.deckInfo}>
            <Text style={[styles.deckTitle, { color: colors.text }]}>{item.title}</Text>
            <Text style={[styles.deckStats, { color: colors.textMuted }]}>
              عدد البطاقات: {item.cards.length} | المتبقي للمراجعة اليوم: {dueCards}
            </Text>
          </View>
          <View style={styles.deckActions}>
            <TouchableOpacity
              style={[styles.playBtn, { backgroundColor: dueCards > 0 ? colors.accent : colors.surfaceHover }]}
              onPress={() => startReview(item)}
            >
              <Ionicons name="play" size={14} color={dueCards > 0 ? "#fff" : colors.textMuted} style={{ marginLeft: 4 }} />
              <Text style={[styles.playBtnText, { color: dueCards > 0 ? "#fff" : colors.textMuted }]}>استذكار</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.deleteBtn} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                handleDeleteDeck(item.id)
              }}
            >
              <Ionicons name="trash-outline" size={18} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.mainTitle, { color: colors.text }]}>بطاقات الاستذكار (Flashcards)</Text>
        <TouchableOpacity
          style={[styles.aiGenBtn, { backgroundColor: colors.accentGlow, borderColor: colors.accent }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            setShowAiGen(true)
          }}
        >
          <Ionicons name="sparkles-outline" size={16} color={colors.accent} />
          <Text style={[styles.aiGenBtnText, { color: colors.accent }]}>توليد بالذكاء الاصطناعي</Text>
        </TouchableOpacity>
      </View>

      <FlashList
        data={decks}
        renderItem={renderDeckItem}
        estimatedItemSize={110}
        ListEmptyComponent={
          <View style={styles.emptyView}>
            <Ionicons name="layers-outline" size={60} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>لا توجد مجموعات بطاقات مسجلة حالياً</Text>
          </View>
        }
        ListFooterComponent={
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                setShowAddDeck(true)
              }}
            >
              <Ionicons name="folder-open-outline" size={20} color={colors.text} style={{ marginLeft: 6 }} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>مجموعة جديدة</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => {
                if (decks.length === 0) {
                  Alert.alert('تنبيه', 'يرجى إنشاء مجموعة بطاقات أولاً')
                  return
                }
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                setSelectedDeckId(decks[0].id)
                setShowAddCard(true)
              }}
            >
              <Ionicons name="card-outline" size={20} color={colors.text} style={{ marginLeft: 6 }} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>إضافة بطاقة</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={{ padding: 16 }}
      />

      {/* Add Deck Modal */}
      <Modal visible={showAddDeck} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>إنشاء مجموعة بطاقات جديدة</Text>
            <TextInput
              placeholder="اسم المجموعة (مثال: أساسيات الشبكات)"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              value={newDeckTitle}
              onChangeText={setNewDeckTitle}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.btn, { backgroundColor: colors.accent }]} onPress={handleCreateDeck}>
                <Text style={styles.btnText}>حفظ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { backgroundColor: colors.surfaceHover }]} onPress={() => setShowAddDeck(false)}>
                <Text style={[styles.btnText, { color: colors.text }]}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Card Modal */}
      <Modal visible={showAddCard} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>إضافة بطاقة فلاش جديدة</Text>

            <Text style={[styles.selectLabel, { color: colors.text }]}>اختر المجموعة</Text>
            <ScrollView horizontal style={{ marginBottom: 12 }} contentContainerStyle={{ flexDirection: 'row-reverse' }}>
              {decks.map((d) => (
                <TouchableOpacity
                  key={d.id}
                  style={[
                    styles.deckSelectBtn,
                    {
                      backgroundColor: selectedDeckId === d.id ? colors.accentGlow : colors.bg,
                      borderColor: selectedDeckId === d.id ? colors.accent : colors.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    setSelectedDeckId(d.id)
                  }}
                >
                  <Text style={[styles.deckSelectText, { color: selectedDeckId === d.id ? colors.accent : colors.textMuted }]}>
                    {d.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              placeholder="الوجه الأول: السؤال / المفهوم"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              value={cardFront}
              onChangeText={setCardFront}
            />
            <TextInput
              placeholder="الوجه الثاني: الإجابة / التعريف"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              value={cardBack}
              onChangeText={setCardBack}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.btn, { backgroundColor: colors.accent }]} onPress={handleAddCard}>
                <Text style={styles.btnText}>إضافة</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { backgroundColor: colors.surfaceHover }]} onPress={() => setShowAddCard(false)}>
                <Text style={[styles.btnText, { color: colors.text }]}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* AI Generate Modal */}
      <Modal visible={showAiGen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>توليد بطاقات بالذكاء الاصطناعي</Text>
            <Text style={[styles.hintText, { color: colors.textMuted }]}>
              أدخل موضوعاً تعليمياً وسيقوم رفيق الذكاء الاصطناعي بتوليد وصياغة ٥ بطاقات استذكار ممتازة تلقائياً.
            </Text>
            <TextInput
              placeholder="الموضوع (مثال: بروتوكول HTTP)"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              value={aiTopic}
              onChangeText={setAiTopic}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.btn, { backgroundColor: colors.accent }]} onPress={handleAiGenerate}>
                <Text style={styles.btnText}>توليد الآن</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { backgroundColor: colors.surfaceHover }]} onPress={() => setShowAiGen(false)}>
                <Text style={[styles.btnText, { color: colors.text }]}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  mainTitle: { fontSize: 16, fontWeight: '700' },
  aiGenBtn: { flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1 },
  aiGenBtnText: { fontSize: 11, fontWeight: '700', marginRight: 4 },
  emptyView: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 14, marginTop: 12, textAlign: 'center' },
  deckCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deckInfo: { flex: 1, marginRight: 12 },
  deckTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4, textAlign: 'right' },
  deckStats: { fontSize: 11, textAlign: 'right' },
  deckActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  playBtn: { flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  playBtnText: { fontSize: 12, fontWeight: '700', marginRight: 4 },
  deleteBtn: { padding: 4 },
  actionRow: { flexDirection: 'row-reverse', gap: 12, marginTop: 12 },
  actionButton: { flex: 1, flexDirection: 'row-reverse', height: 48, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  actionButtonText: { fontSize: 13, fontWeight: '700', marginRight: 8 },

  // Active review styles
  reviewHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 8 },
  deckTitleText: { fontSize: 16, fontWeight: '700' },
  reviewProgressText: { fontSize: 12, fontWeight: '600' },
  progressBarBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  cardWrapper: { height: 280, marginBottom: 24 },
  flipCardContainer: { flex: 1, position: 'relative' },
  flipCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flipCardBack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  badge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  badgeText: { fontSize: 11, fontWeight: '800' },
  cardBodyText: { fontSize: 18, fontWeight: '700', lineHeight: 28, textAlign: 'center', marginVertical: 20 },
  flipHintRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center' },
  flipHintText: { fontSize: 11, fontStyle: 'italic' },

  // Ratings
  ratingSection: { width: '100%', alignItems: 'center', marginBottom: 20 },
  ratingPlaceholder: { height: 138, marginBottom: 20 },
  ratingInstructions: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  ratingRow: { flexDirection: 'row', gap: 10, width: '100%' },
  ratingBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  ratingBtnText: { fontSize: 13, fontWeight: '700' },
  ratingSubtext: { fontSize: 9, marginTop: 2, fontWeight: '600' },
  quitBtn: { height: 48, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' },
  quitBtnText: { fontSize: 14, fontWeight: '700' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { padding: 20, borderRadius: 16, borderWidth: 1 },
  modalTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16, textAlign: 'right' },
  hintText: { fontSize: 12, lineHeight: 18, marginBottom: 16, textAlign: 'right' },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    textAlign: 'right',
    fontSize: 14,
  },
  modalButtons: { flexDirection: 'row', gap: 8, marginTop: 12 },
  btn: { flex: 1, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  selectLabel: { fontSize: 12, fontWeight: '700', marginBottom: 8, textAlign: 'right' },
  deckSelectBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, marginLeft: 8, height: 36 },
  deckSelectText: { fontSize: 12, fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { fontSize: 14, marginTop: 16, fontWeight: '600' },
})

export default FlashcardsScreen
