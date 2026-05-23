import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useTheme } from '../theme/ThemeContext'
import { Ionicons } from '@expo/vector-icons'
import { generateQuiz, generateQuizFromFile } from '../api/endpoints'

interface QuizQuestion {
  question: string
  options: string[]
  correct: string // Option letter (e.g. 'أ', 'ب', 'ج', 'د') or exact option text
  explanation: string
}

interface QuizScreenProps {
  topic?: string
  fileContent?: string
}

export const QuizScreen: React.FC<QuizScreenProps> = ({ topic, fileContent }) => {
  const { colors } = useTheme()

  // Setup states
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [count, setCount] = useState(5)
  const [quizStarted, setQuizStarted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])

  // Running states
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [showExplanation, setShowExplanation] = useState(true)
  const [score, setScore] = useState(0)
  const [answersLog, setAnswersLog] = useState<{ index: number; question: string; selected: string; correct: string; isCorrect: boolean }[]>([])

  // Timer states
  const [timer, setTimer] = useState(30)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (quizStarted && questions.length > 0 && !showAnswer) {
      setTimer(30)
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!)
            // Auto submit timeout
            handleOptionSelect(-1)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [quizStarted, currentIndex, showAnswer, questions])

  const handleStartQuiz = async () => {
    setLoading(true)
    try {
      let data: any
      if (fileContent) {
        data = await generateQuizFromFile(fileContent, count, difficulty)
      } else {
        data = await generateQuiz(topic || 'عام', count, difficulty)
      }

      if (data && data.questions && data.questions.length > 0) {
        setQuestions(data.questions)
        setQuizStarted(true)
        setCurrentIndex(0)
        setScore(0)
        setAnswersLog([])
        setShowAnswer(false)
        setShowExplanation(true)
      } else {
        Alert.alert('خطأ', 'فشل في توليد الأسئلة. يرجى المحاولة مرة أخرى.')
      }
    } catch (e) {
      console.log(e)
      Alert.alert('خطأ', 'حدث خطأ أثناء التواصل مع خادم الذكاء الاصطناعي')
    } finally {
      setLoading(false)
    }
  }

  const handleOptionSelect = (optIndex: number) => {
    if (showAnswer) return
    if (timerRef.current) clearInterval(timerRef.current)

    setSelectedOption(optIndex)
    setShowAnswer(true)
    setShowExplanation(true)

    const q = questions[currentIndex]
    const letters = ['أ', 'ب', 'ج', 'د']
    
    // Check correct answer
    const cleanCorrect = q.correct.replace(/[)ـ\s]/g, '').trim()
    const selectedLetter = optIndex >= 0 ? letters[optIndex] : 'لا توجد إجابة'
    const selectedText = optIndex >= 0 ? q.options[optIndex] : 'انتهاء الوقت'

    let isCorrect = false
    if (optIndex >= 0) {
      const optionText = q.options[optIndex]
      if (cleanCorrect === selectedLetter || optionText.includes(cleanCorrect) || cleanCorrect.includes(optionText)) {
        isCorrect = true
      }
    }

    if (isCorrect) {
      setScore((s) => s + 1)
    }

    setAnswersLog((prev) => [
      ...prev,
      {
        index: currentIndex,
        question: q.question,
        selected: selectedText,
        correct: q.correct,
        isCorrect,
      },
    ])
  }

  const handleNextQuestion = () => {
    setSelectedOption(null)
    setShowAnswer(false)
    setShowExplanation(true)
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      setCurrentIndex(questions.length)
    }
  }

  const isFinished = currentIndex >= questions.length && questions.length > 0

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.text }]}>جاري توليد الاختبار بالذكاء الاصطناعي...</Text>
      </View>
    )
  }

  if (!quizStarted) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.centerContent}>
        <Ionicons name="school-outline" size={80} color={colors.accent} style={{ marginBottom: 16 }} />
        <Text style={[styles.title, { color: colors.text }]}>اختبار الذكاء الاصطناعي</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {fileContent ? 'سيتم توليد اختبار مخصص من الملف المرفوع' : `موضوع الاختبار الحالي: ${topic || 'ثقافة عامة'}`}
        </Text>

        {/* Configuration Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>إعدادات الاختبار</Text>

          <Text style={[styles.label, { color: colors.text }]}>مستوى الصعوبة</Text>
          <View style={styles.difficultyRow}>
            {(['easy', 'medium', 'hard'] as const).map((diff) => {
              const label = diff === 'easy' ? 'سهل' : diff === 'medium' ? 'متوسط' : 'صعب'
              const active = difficulty === diff
              return (
                <TouchableOpacity
                  key={diff}
                  style={[
                    styles.diffBtn,
                    {
                      backgroundColor: active ? colors.accent + '15' : colors.surfaceHover,
                      borderColor: active ? colors.accent : colors.border,
                    },
                  ]}
                  onPress={() => setDifficulty(diff)}
                >
                  <Text style={[styles.diffBtnText, { color: active ? colors.accent : colors.textMuted }]}>{label}</Text>
                </TouchableOpacity>
              )
            })}
          </View>

          <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>عدد الأسئلة</Text>
          <View style={styles.difficultyRow}>
            {[5, 10, 15].map((num) => {
              const active = count === num
              return (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.diffBtn,
                    {
                      backgroundColor: active ? colors.accent + '15' : colors.surfaceHover,
                      borderColor: active ? colors.accent : colors.border,
                    },
                  ]}
                  onPress={() => setCount(num)}
                >
                  <Text style={[styles.diffBtnText, { color: active ? colors.accent : colors.textMuted }]}>{num} أسئلة</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        <TouchableOpacity style={[styles.startBtn, { backgroundColor: colors.accent }]} onPress={handleStartQuiz}>
          <Text style={styles.startBtnText}>ابدأ الاختبار الذكي</Text>
        </TouchableOpacity>
      </ScrollView>
    )
  }

  if (isFinished) {
    const pct = Math.round((score / questions.length) * 100)
    return (
      <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>
        {/* Score Header */}
        <View style={[styles.resultsHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.trophyWrapper, { backgroundColor: pct >= 50 ? colors.success + '15' : colors.error + '15' }]}>
            <Ionicons
              name={pct >= 50 ? 'trophy' : 'alert-circle'}
              size={56}
              color={pct >= 50 ? colors.success : colors.error}
            />
          </View>
          <Text style={[styles.title, { color: colors.text, marginTop: 12 }]}>نتائج الاختبار</Text>
          <Text style={[styles.scoreBig, { color: colors.accent }]}>
            {score} / {questions.length}
          </Text>
          <Text style={[styles.scorePct, { color: colors.textMuted }]}>النسبة المحققة: {pct}%</Text>
        </View>

        {/* Details review */}
        <Text style={[styles.reviewTitle, { color: colors.text }]}>مراجعة الأسئلة والشروحات:</Text>
        {answersLog.map((log, index) => {
          const explanation = questions[index]?.explanation
          return (
            <View key={index} style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {/* Question Header */}
              <View style={styles.reviewHeaderRow}>
                <Ionicons
                  name={log.isCorrect ? 'checkmark-circle' : 'close-circle'}
                  size={22}
                  color={log.isCorrect ? colors.success : colors.error}
                  style={{ marginLeft: 8 }}
                />
                <Text style={[styles.reviewQuestionText, { color: colors.text }]}>
                  السؤال {index + 1}: {log.question}
                </Text>
              </View>

              {/* Answers Details */}
              <View style={styles.reviewAnswersBox}>
                <View style={[
                  styles.reviewAnswerRow,
                  { backgroundColor: log.isCorrect ? colors.success + '10' : colors.error + '10' }
                ]}>
                  <Text style={[styles.reviewAnswerLabel, { color: colors.textMuted }]}>إجابتك:</Text>
                  <Text style={[styles.reviewAnswerValue, { color: log.isCorrect ? colors.success : colors.error }]}>
                    {log.selected}
                  </Text>
                </View>

                {!log.isCorrect && (
                  <View style={[styles.reviewAnswerRow, { backgroundColor: colors.success + '10' }]}>
                    <Text style={[styles.reviewAnswerLabel, { color: colors.textMuted }]}>الإجابة الصحيحة:</Text>
                    <Text style={[styles.reviewAnswerValue, { color: colors.success }]}>
                      {log.correct}
                    </Text>
                  </View>
                )}
              </View>

              {explanation ? (
                <View style={[styles.reviewExplanationBox, { backgroundColor: colors.surfaceHover, borderColor: colors.border }]}>
                  <Text style={[styles.reviewExplanationTitle, { color: colors.accent }]}>التوضيح العلمي:</Text>
                  <Text style={[styles.reviewExplanationText, { color: colors.text }]}>{explanation}</Text>
                </View>
              ) : null}
            </View>
          )
        })}

        <TouchableOpacity style={[styles.startBtn, { backgroundColor: colors.accent }]} onPress={() => setQuizStarted(false)}>
          <Text style={styles.startBtnText}>اختبار جديد</Text>
        </TouchableOpacity>
      </ScrollView>
    )
  }

  const currentQuestion = questions[currentIndex]
  const letters = ['أ', 'ب', 'ج', 'د']
  const percentComplete = Math.round(((currentIndex + 1) / questions.length) * 100)

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>
      {/* Progress metrics */}
      <View style={styles.topInfo}>
        <Text style={[styles.progressTextLabel, { color: colors.textMuted }]}>السؤال {currentIndex + 1} من {questions.length}</Text>
        
        {/* Countdown Timer Badge */}
        <View style={[
          styles.timerContainer,
          {
            backgroundColor: timer < 10 ? colors.error + '10' : colors.surface,
            borderColor: timer < 10 ? colors.error : colors.border,
          },
          timer < 10 ? {
            shadowColor: colors.error,
            shadowOpacity: 0.3,
            shadowRadius: 5,
            elevation: 3,
          } : null
        ]}>
          <Ionicons name="time" size={14} color={timer < 10 ? colors.error : colors.accent} />
          <Text style={[styles.timerText, { color: timer < 10 ? colors.error : colors.text }]}>
            {timer} ثانية
          </Text>
        </View>
      </View>

      <View style={[styles.progressBarBg, { backgroundColor: colors.border, marginBottom: 24 }]}>
        <View style={[styles.progressBarFill, { backgroundColor: colors.accent, width: `${percentComplete}%` }]} />
      </View>

      {/* Question Card */}
      <View style={[styles.questionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.questionText, { color: colors.text }]}>{currentQuestion.question}</Text>
      </View>

      {/* Options Choice Buttons */}
      {currentQuestion.options.map((opt, oIdx) => {
        const isSelected = selectedOption === oIdx
        let btnBg = colors.surface
        let btnBorder = colors.border
        let badgeBg = colors.surfaceHover
        let badgeText = colors.textMuted
        let isCorrectOption = false

        if (showAnswer) {
          const cleanCorrect = currentQuestion.correct.replace(/[)ـ\s]/g, '').trim()
          const letter = letters[oIdx]
          
          if (cleanCorrect === letter || opt.includes(cleanCorrect) || cleanCorrect.includes(opt)) {
            isCorrectOption = true
          }

          if (isCorrectOption) {
            btnBg = colors.success + '15'
            btnBorder = colors.success
            badgeBg = colors.success
            badgeText = '#fff'
          } else if (isSelected) {
            btnBg = colors.error + '15'
            btnBorder = colors.error
            badgeBg = colors.error
            badgeText = '#fff'
          } else {
            btnBg = colors.surfaceHover
            btnBorder = colors.border
            badgeBg = colors.border
            badgeText = colors.textMuted
          }
        } else if (isSelected) {
          btnBg = colors.accent + '15'
          btnBorder = colors.accent
          badgeBg = colors.accent
          badgeText = '#fff'
        }

        return (
          <TouchableOpacity
            key={oIdx}
            style={[styles.optionBtn, { backgroundColor: btnBg, borderColor: btnBorder }]}
            onPress={() => handleOptionSelect(oIdx)}
            disabled={showAnswer}
            activeOpacity={0.8}
          >
            <View style={[styles.optionLetter, { backgroundColor: badgeBg }]}>
              <Text style={[styles.optionLetterText, { color: badgeText }]}>{letters[oIdx]}</Text>
            </View>
            <Text style={[styles.optionTextLabel, { color: colors.text }]}>{opt}</Text>
          </TouchableOpacity>
        )
      })}

      {/* Explanation Accordion & Next Navigation Trigger */}
      {showAnswer && (
        <View style={styles.explanationSection}>
          <View style={[
            styles.explanationAccordion,
            { backgroundColor: colors.surface, borderColor: colors.border }
          ]}>
            <TouchableOpacity
              style={styles.explanationHeader}
              onPress={() => setShowExplanation(!showExplanation)}
              activeOpacity={0.8}
            >
              <Ionicons name={showExplanation ? 'chevron-up' : 'chevron-down'} size={18} color={colors.text} />
              <Text style={[styles.explanationTitle, { color: colors.accent }]}>الشرح والتوضيح العلمي</Text>
            </TouchableOpacity>

            {showExplanation && (
              <View style={[styles.explanationBody, { borderTopWidth: 1, borderTopColor: colors.border }]}>
                <Text style={[styles.explanationTextBody, { color: colors.text }]}>
                  {currentQuestion.explanation || 'لا يوجد شرح متوفر لهذا السؤال حالياً.'}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={[styles.nextBtn, { backgroundColor: colors.accent }]} onPress={handleNextQuestion}>
            <Text style={styles.nextBtnText}>
              {currentIndex < questions.length - 1 ? 'السؤال التالي' : 'عرض النتائج'}
            </Text>
            <Ionicons name="arrow-back" size={16} color="#fff" style={{ marginRight: 6 }} />
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  centerContent: { padding: 16, alignItems: 'center', justifyContent: 'center', minHeight: '80%' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { fontSize: 14, marginTop: 16, fontWeight: '600', textAlign: 'center' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 6, textAlign: 'center' },
  subtitle: { fontSize: 14, marginBottom: 24, textAlign: 'center' },
  card: { padding: 20, borderRadius: 16, borderWidth: 1, width: '100%', marginBottom: 24 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16, textAlign: 'right' },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 8, textAlign: 'right' },
  difficultyRow: { flexDirection: 'row-reverse', gap: 8, marginBottom: 12 },
  diffBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  diffBtnText: { fontSize: 13, fontWeight: '700' },
  startBtn: { height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: 10 },
  startBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Playing
  topInfo: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressTextLabel: { fontSize: 12, fontWeight: '600' },
  timerContainer: { flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1.5 },
  timerText: { fontSize: 12, fontWeight: '700', marginRight: 4 },
  progressBarBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  questionCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  questionText: { fontSize: 16, fontWeight: '700', lineHeight: 24, textAlign: 'right' },
  optionBtn: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  optionLetter: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  optionLetterText: { fontSize: 14, fontWeight: '700' },
  optionTextLabel: { fontSize: 15, fontWeight: '600', flex: 1, textAlign: 'right' },

  // Explanation
  explanationSection: { marginTop: 16, width: '100%' },
  explanationAccordion: { borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  explanationHeader: { padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  explanationTitle: { fontSize: 14, fontWeight: '700', textAlign: 'right', flex: 1, paddingRight: 10 },
  explanationBody: { padding: 14 },
  explanationTextBody: { fontSize: 13, lineHeight: 22, textAlign: 'right' },
  nextBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  nextBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Results
  resultsHeader: { alignItems: 'center', marginBottom: 24, padding: 24, borderRadius: 20, borderWidth: 1 },
  trophyWrapper: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  scoreBig: { fontSize: 40, fontWeight: '800', marginTop: 8 },
  scorePct: { fontSize: 14, fontWeight: '600' },
  reviewTitle: { fontSize: 15, fontWeight: '700', marginBottom: 16, textAlign: 'right' },
  
  reviewCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16, alignItems: 'stretch' },
  reviewHeaderRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', marginBottom: 12 },
  reviewQuestionText: { fontSize: 15, fontWeight: '700', flex: 1, textAlign: 'right', lineHeight: 22 },
  reviewAnswersBox: { gap: 8, marginBottom: 12 },
  reviewAnswerRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', padding: 10, borderRadius: 8, alignItems: 'center' },
  reviewAnswerLabel: { fontSize: 12, fontWeight: '600' },
  reviewAnswerValue: { fontSize: 13, fontWeight: '700', textAlign: 'left', flex: 1, paddingLeft: 10 },
  reviewExplanationBox: { padding: 12, borderRadius: 10, borderWidth: 1, marginTop: 4 },
  reviewExplanationTitle: { fontSize: 12, fontWeight: '700', textAlign: 'right', marginBottom: 4 },
  reviewExplanationText: { fontSize: 12, textAlign: 'right', lineHeight: 18 },
})

export default QuizScreen
