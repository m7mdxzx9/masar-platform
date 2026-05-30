import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../theme/ThemeContext'
import { Card } from '../components/Card'
import MarkdownRenderer from '../components/MarkdownRenderer'
import { lessonsData, Lesson } from '../data/lessonsData'
import { runCode, generateHomework, verifyHomework, studyChat } from '../api/endpoints'

type TabMode = 'lesson' | 'editor' | 'homework' | 'tutor'

export const LessonsScreen: React.FC = () => {
  const { colors } = useTheme()
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  
  // Tabs for the selected lesson screen
  const [activeTab, setActiveTab] = useState<TabMode>('lesson')
  
  // Category filter for the main list
  const [categoryFilter, setCategoryFilter] = useState<'programming' | 'math' | 'ai'>('programming')

  // Code editor states
  const [code, setCode] = useState<string>('')
  const [output, setOutput] = useState<string>('')
  const [running, setRunning] = useState<boolean>(false)

  // Homework states
  const [homeworkType, setHomeworkType] = useState<'mcq' | 'bug_fix'>('mcq')
  const [hwLoading, setHwLoading] = useState<boolean>(false)
  const [mcqQuestions, setMcqQuestions] = useState<any[] | null>(null)
  const [bugFixData, setBugFixData] = useState<any | null>(null)
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({})
  const [graded, setGraded] = useState<boolean>(false)
  const [gradingResponse, setGradingResponse] = useState<{ passed: boolean; feedback: string; corrected_code: string } | null>(null)
  const [gradingLoading, setGradingLoading] = useState<boolean>(false)

  // AI Tutor states
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'model'; content: string }>>([])
  const [chatInput, setChatInput] = useState<string>('')
  const [chatLoading, setChatLoading] = useState<boolean>(false)
  const chatScrollRef = useRef<ScrollView>(null)

  // Filter lessons
  const filteredLessons = lessonsData.filter((l) => l.category === categoryFilter)

  // Handle selecting a lesson
  const handleSelectLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson)
    setCode(lesson.defaultCode)
    setOutput('')
    setActiveTab('lesson')
    // Reset homework
    setMcqQuestions(null)
    setBugFixData(null)
    setSelectedOptions({})
    setGraded(false)
    setGradingResponse(null)
    // Reset Chat messages
    setChatMessages([
      {
        role: 'model',
        content: `مرحباً! أنا مساعدك الدراسي لدرس "${lesson.title}". اسألني أي سؤال لمساعدتك في فهم الشروحات البرمجية أو المعادلات الرياضية!`,
      },
    ])
  }

  // Handle run code
  const handleRunCode = async () => {
    if (!code.trim()) return
    setRunning(true)
    setOutput('جاري تشغيل الكود...\n')
    try {
      const res = await runCode(code)
      setOutput(res?.output || res?.result || 'لم يتم إرجاع أي مخرجات.')
    } catch (e: any) {
      setOutput(`❌ خطأ: ${e.message || e}`)
    } finally {
      setRunning(false)
    }
  };

  // Generate homework
  const handleGenerateHomework = async () => {
    if (!selectedLesson) return
    setHwLoading(true)
    setGraded(false)
    setSelectedOptions({})
    setGradingResponse(null)
    setMcqQuestions(null)
    setBugFixData(null)

    try {
      const res = await generateHomework({
        lesson_id: selectedLesson.id,
        lesson_title: selectedLesson.title,
        lesson_category: selectedLesson.category,
        lesson_content: selectedLesson.content,
        default_code: selectedLesson.defaultCode,
        homework_type: homeworkType,
      })

      if (homeworkType === 'mcq') {
        setMcqQuestions(res.questions || [])
      } else {
        setBugFixData(res)
      }
    } catch (e: any) {
      Alert.alert('خطأ', `فشل توليد الواجب: ${e.message || e}`)
    } finally {
      setHwLoading(false)
    }
  }

  // Grade bug fix code
  const handleGradeBugFix = async () => {
    if (!selectedLesson || !bugFixData) return
    setGradingLoading(true)
    try {
      const res = await verifyHomework({
        lesson_id: selectedLesson.id,
        student_code: code,
        task_description: bugFixData.description,
      })
      setGradingResponse(res)
    } catch (e: any) {
      Alert.alert('خطأ', `فشل التقييم: ${e.message || e}`)
    } finally {
      setGradingLoading(false)
    }
  }

  // Send message to AI Tutor
  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading || !selectedLesson) return
    const userMsg = chatInput
    setChatInput('')
    setChatMessages((prev) => [...prev, { role: 'user', content: userMsg }])
    setChatLoading(true)

    // Build context
    const systemPrompt = `أنت معلم ذكاء اصطناعي خبير ومبسط للمفاهيم. الطالب يدرس درس "${selectedLesson.title}" في قسم ${
      selectedLesson.category === 'math' ? 'الرياضيات' : 'البرمجة'
    }.
محتوى الدرس الحالي:
${selectedLesson.content}

الكود الحالي في محرر الدرس:
\`\`\`python
${code}
\`\`\`

الرجاء الإجابة على استفسارات الطالب باللغة العربية بأسلوب مبسط ومحفز، ومساعدته في فهم المعادلات الرياضية أو تصحيح الأكواد إذا كان لديه مشكلة.`

    const history = chatMessages.map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    }))

    try {
      const res = await studyChat({
        message: userMsg,
        system_instruction: systemPrompt,
        history,
      })
      setChatMessages((prev) => [...prev, { role: 'model', content: res.response || 'لم أستطع المعالجة.' }])
    } catch (e: any) {
      setChatMessages((prev) => [
        ...prev,
        { role: 'model', content: `❌ حدث خطأ أثناء الاتصال بالذكاء الاصطناعي: ${e.message || e}` },
      ])
    } finally {
      setChatLoading(false)
    }
  }

  useEffect(() => {
    if (chatScrollRef.current) {
      setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }, [chatMessages])

  // --- RENDERING MAIN LIST ---
  if (!selectedLesson) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>الدروس التفاعلية</Text>
        </View>

        {/* Categories Bar */}
        <View style={[styles.categoryTabs, { borderBottomColor: colors.border }]}>
          {(['programming', 'math', 'ai'] as const).map((cat) => {
            const isSelected = categoryFilter === cat
            let label = ''
            if (cat === 'programming') label = 'بايثون 💻'
            else if (cat === 'math') label = 'رياضيات 📐'
            else label = 'ذكاء اصطناعي 🧠'

            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setCategoryFilter(cat)}
                style={[
                  styles.categoryTab,
                  isSelected && { borderBottomColor: colors.accent, borderBottomWidth: 3 },
                ]}
              >
                <Text
                  style={[
                    styles.categoryTabText,
                    { color: isSelected ? colors.accent : colors.textMuted },
                    isSelected && styles.categoryTabTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Lessons List */}
        <FlatList
          data={filteredLessons}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Card style={[styles.lessonCard, { borderColor: colors.border }]}>
              <View style={styles.lessonCardHeader}>
                <View
                  style={[
                    styles.difficultyBadge,
                    {
                      backgroundColor:
                        item.difficulty === 'easy'
                          ? '#10B98120'
                          : item.difficulty === 'medium'
                          ? '#F59E0B20'
                          : '#EF444420',
                      borderColor:
                        item.difficulty === 'easy'
                          ? '#10B98150'
                          : item.difficulty === 'medium'
                          ? '#F59E0B50'
                          : '#EF444450',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.difficultyText,
                      {
                        color:
                          item.difficulty === 'easy'
                            ? colors.success || '#10B981'
                            : item.difficulty === 'medium'
                            ? colors.warning || '#F59E0B'
                            : colors.error || '#EF4444',
                      },
                    ]}
                  >
                    {item.difficulty === 'easy' ? 'سهل' : item.difficulty === 'medium' ? 'متوسط' : 'متقدم'}
                  </Text>
                </View>
                <Text style={[styles.lessonTitleText, { color: colors.text }]}>{item.title}</Text>
              </View>

              <Text style={[styles.lessonDescText, { color: colors.textMuted }]}>{item.description}</Text>

              <TouchableOpacity
                onPress={() => handleSelectLesson(item)}
                style={[styles.startBtn, { backgroundColor: colors.accent }]}
              >
                <Text style={[styles.startBtnText, { color: colors.bg }]}>ابدأ الدرس 📖</Text>
              </TouchableOpacity>
            </Card>
          )}
        />
      </View>
    )
  }

  // --- RENDERING LESSON VIEW SCREEN ---
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Lesson Header */}
      <View style={[styles.lessonHeader, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => setSelectedLesson(null)} style={styles.backBtn}>
          <Ionicons name="arrow-forward-outline" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.lessonHeaderTitle, { color: colors.text }]} numberOfLines={1}>
          {selectedLesson.title}
        </Text>
      </View>

      {/* Tabs Menu */}
      <View style={[styles.tabsContainer, { backgroundColor: colors.surface }]}>
        {(['lesson', 'editor', 'homework', 'tutor'] as const).map((tab) => {
          const isSelected = activeTab === tab
          let label = ''
          let iconName: keyof typeof Ionicons.glyphMap = 'book'
          if (tab === 'lesson') {
            label = 'الدرس'
            iconName = 'book-outline'
          } else if (tab === 'editor') {
            label = 'المحرر'
            iconName = 'code-slash-outline'
          } else if (tab === 'homework') {
            label = 'الواجب'
            iconName = 'sparkles-outline'
          } else {
            label = 'المعلم AI'
            iconName = 'chatbubble-ellipses-outline'
          }

          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.tabButton,
                isSelected && { backgroundColor: colors.accentGlow, borderColor: colors.accent },
              ]}
            >
              <Ionicons name={iconName} size={16} color={isSelected ? colors.accent : colors.textMuted} />
              <Text style={[styles.tabText, { color: isSelected ? colors.accent : colors.textMuted }]}>
                {label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Tab Screen Contents */}
      {activeTab === 'lesson' && (
        <ScrollView style={styles.tabContentScroll} contentContainerStyle={styles.tabContentContainer}>
          <MarkdownRenderer content={selectedLesson.content} colors={colors} />
        </ScrollView>
      )}

      {activeTab === 'editor' && (
        <ScrollView style={styles.tabContentScroll} contentContainerStyle={styles.tabContentContainer}>
          <Card style={[styles.editorCard, { borderColor: colors.border }]}>
            <View style={[styles.consoleHeader, { backgroundColor: colors.surfaceHover }]}>
              <Text style={[styles.consoleTitle, { color: colors.textMuted }]}>main.py</Text>
              <TouchableOpacity
                onPress={() => {
                  setCode(selectedLesson.defaultCode)
                  setOutput('')
                }}
              >
                <Text style={{ color: colors.accent, fontSize: 12 }}>إعادة تعيين 🔄</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.editorInput, { backgroundColor: colors.bg, color: colors.text }]}
              multiline
              value={code}
              onChangeText={setCode}
              textAlignVertical="top"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              onPress={handleRunCode}
              disabled={running}
              style={[styles.runBtn, { backgroundColor: colors.accent }]}
            >
              {running ? (
                <ActivityIndicator color={colors.bg} />
              ) : (
                <Text style={[styles.runBtnText, { color: colors.bg }]}>تشغيل ▶</Text>
              )}
            </TouchableOpacity>
          </Card>

          {output ? (
            <Card style={[styles.outputCard, { backgroundColor: '#090A0F', borderColor: colors.border }]}>
              <View style={[styles.consoleHeader, { backgroundColor: '#12131A' }]}>
                <Text style={[styles.consoleTitle, { color: '#8F93A3' }]}>المخرجات</Text>
              </View>
              <View style={styles.outputBox}>
                <Text style={[styles.outputText, { color: '#00FFCC' }]}>{output}</Text>
              </View>
            </Card>
          ) : null}
        </ScrollView>
      )}

      {activeTab === 'homework' && (
        <ScrollView style={styles.tabContentScroll} contentContainerStyle={styles.tabContentContainer}>
          <Card style={[styles.configCard, { borderColor: colors.border }]}>
            <Text style={[styles.hwTitle, { color: colors.text }]}>واجب مخصص بالذكاء الاصطناعي 🧠</Text>
            <Text style={[styles.hwDesc, { color: colors.textMuted }]}>
              يقوم مساعد مسار بتوليد أسئلة أو تمرين كود مخصص بناءً على فهمك للدرس الحالي.
            </Text>

            <View style={styles.hwToggleRow}>
              <TouchableOpacity
                onPress={() => setHomeworkType('mcq')}
                style={[
                  styles.hwToggleBtn,
                  homeworkType === 'mcq' && [styles.hwToggleBtnActive, { backgroundColor: colors.accent }],
                ]}
              >
                <Text style={[styles.hwToggleBtnText, { color: homeworkType === 'mcq' ? colors.bg : colors.text }]}>
                  خيارات متعددة
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setHomeworkType('bug_fix')}
                style={[
                  styles.hwToggleBtn,
                  homeworkType === 'bug_fix' && [styles.hwToggleBtnActive, { backgroundColor: colors.accent }],
                ]}
              >
                <Text style={[styles.hwToggleBtnText, { color: homeworkType === 'bug_fix' ? colors.bg : colors.text }]}>
                  إصلاح كود برمجي
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleGenerateHomework}
              disabled={hwLoading}
              style={[styles.generateBtn, { backgroundColor: colors.secondary }]}
            >
              {hwLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.generateBtnText}>توليد التمارين الآن ✨</Text>
              )}
            </TouchableOpacity>
          </Card>

          {/* MCQ Render */}
          {mcqQuestions && (
            <View style={styles.questionsContainer}>
              {mcqQuestions.map((q: any, idx: number) => (
                <Card key={idx} style={[styles.questionCard, { borderColor: colors.border }]}>
                  <Text style={[styles.questionText, { color: colors.text }]}>
                    {idx + 1}. {q.question}
                  </Text>
                  
                  {q.options.map((opt: string, optIdx: number) => {
                    const isSelected = selectedOptions[q.id || idx] === optIdx
                    const isCorrect = q.correct_index === optIdx
                    let bg = colors.surfaceHover
                    let txtColor = colors.text

                    if (isSelected && !graded) {
                      bg = colors.accentGlow
                      txtColor = colors.accent
                    } else if (graded) {
                      if (isCorrect) {
                        bg = 'rgba(16, 185, 129, 0.15)'
                        txtColor = '#10B981'
                      } else if (isSelected && !isCorrect) {
                        bg = 'rgba(239, 68, 68, 0.15)'
                        txtColor = '#EF4444'
                      }
                    }

                    return (
                      <TouchableOpacity
                        key={optIdx}
                        disabled={graded}
                        onPress={() => setSelectedOptions((prev) => ({ ...prev, [q.id || idx]: optIdx }))}
                        style={[styles.optionBtn, { backgroundColor: bg }]}
                      >
                        <Text style={[styles.optionText, { color: txtColor }]}>{opt}</Text>
                        {graded && isCorrect && <Ionicons name="checkmark-circle" size={16} color="#10B981" />}
                        {graded && isSelected && !isCorrect && <Ionicons name="close-circle" size={16} color="#EF4444" />}
                      </TouchableOpacity>
                    )
                  })}

                  {graded && (
                    <View style={[styles.explanationBox, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.explanationTitle, { color: colors.text }]}>الشرح العلمي:</Text>
                      <Text style={[styles.explanationText, { color: colors.textMuted }]}>{q.explanation}</Text>
                    </View>
                  )}
                </Card>
              ))}

              {!graded ? (
                <TouchableOpacity
                  onPress={() => setGraded(true)}
                  style={[styles.submitHwBtn, { backgroundColor: colors.accent }]}
                >
                  <Text style={[styles.submitHwBtnText, { color: colors.bg }]}>تصحيح الإجابات 📝</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={handleGenerateHomework}
                  style={[styles.submitHwBtn, { backgroundColor: colors.secondary }]}
                >
                  <Text style={styles.submitHwBtnText}>واجب جديد لهذا الدرس</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Bug Fix Render */}
          {bugFixData && (
            <Card style={[styles.bugFixCard, { borderColor: colors.border }]}>
              <View style={styles.bugFixTitleRow}>
                <Ionicons name="construct-outline" size={20} color={colors.warning} />
                <Text style={[styles.bugFixTitle, { color: colors.text }]}>تمرين إصلاح الكود</Text>
              </View>

              <Text style={[styles.bugFixDesc, { color: colors.text }]}>{bugFixData.description}</Text>

              <View style={styles.bugFixOutputBox}>
                <Text style={{ color: colors.textMuted, fontSize: 11, marginBottom: 4 }}>المخرجات المستهدفة:</Text>
                <Text style={[styles.bugFixOutputText, { color: colors.text }]}>{bugFixData.target_output}</Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  setCode(bugFixData.buggy_code)
                  setActiveTab('editor')
                  Alert.alert('تم التحميل', 'تم تحميل الكود الذي يحتوي على خطأ في علامة تبويب المحرر! أصلحه ثم أعد التقييم.')
                }}
                style={[styles.bugFixLoadBtn, { backgroundColor: colors.surfaceHover }]}
              >
                <Text style={[styles.bugFixLoadBtnText, { color: colors.text }]}>تحميل الكود الخاطئ في المحرر 🛠️</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleGradeBugFix}
                disabled={gradingLoading}
                style={[styles.submitHwBtn, { backgroundColor: colors.accent, marginTop: 16 }]}
              >
                {gradingLoading ? (
                  <ActivityIndicator color={colors.bg} />
                ) : (
                  <Text style={[styles.submitHwBtnText, { color: colors.bg }]}>أرسل كودي للتقييم 🚀</Text>
                )}
              </TouchableOpacity>

              {gradingResponse && (
                <View
                  style={[
                    styles.gradingResultBox,
                    {
                      borderColor: gradingResponse.passed ? '#10B98150' : '#EF444450',
                      backgroundColor: gradingResponse.passed ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                    },
                  ]}
                >
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Ionicons
                      name={gradingResponse.passed ? 'checkmark-circle' : 'close-circle'}
                      size={20}
                      color={gradingResponse.passed ? '#10B981' : '#EF4444'}
                    />
                    <Text style={[styles.gradingResultTitle, { color: gradingResponse.passed ? '#10B981' : '#EF4444' }]}>
                      {gradingResponse.passed ? 'تم الاجتياز بنجاح!' : 'لم ينجح الحل بعد.'}
                    </Text>
                  </View>

                  <Text style={[styles.gradingFeedback, { color: colors.text }]}>{gradingResponse.feedback}</Text>

                  <View style={{ marginTop: 12 }}>
                    <Text style={{ color: colors.textMuted, fontSize: 11, marginBottom: 4 }}>الكود الصحيح النموذجي:</Text>
                    <Text style={[styles.correctedCode, { color: '#00FFCC', backgroundColor: '#090A0F' }]}>
                      {gradingResponse.corrected_code}
                    </Text>
                  </View>
                </View>
              )}
            </Card>
          )}
        </ScrollView>
      )}

      {activeTab === 'tutor' && (
        <View style={styles.tutorContainer}>
          {/* Chat Messages */}
          <ScrollView
            ref={chatScrollRef}
            style={styles.tutorChatScroll}
            contentContainerStyle={styles.tutorChatContent}
          >
            {chatMessages.map((msg, i) => {
              const isUser = msg.role === 'user'
              return (
                <View
                  key={i}
                  style={[
                    styles.msgBubble,
                    isUser
                      ? [styles.msgUser, { backgroundColor: colors.accent }]
                      : [styles.msgModel, { backgroundColor: colors.surfaceHover, borderColor: colors.border }],
                  ]}
                >
                  <Text style={[styles.msgText, { color: isUser ? colors.bg : colors.text }]}>{msg.content}</Text>
                </View>
              )
            })}
            {chatLoading && (
              <View style={[styles.msgBubble, styles.msgModel, { backgroundColor: colors.surfaceHover }]}>
                <ActivityIndicator color={colors.accent} size="small" style={{ alignSelf: 'flex-start' }} />
              </View>
            )}
          </ScrollView>

          {/* Chat Input */}
          <View style={[styles.tutorInputBar, { borderTopColor: colors.border }]}>
            <TouchableOpacity onPress={handleSendChatMessage} style={[styles.sendBtn, { backgroundColor: colors.accent }]}>
              <Ionicons name="send" size={18} color={colors.bg} style={{ transform: [{ scaleX: -1 }] }} />
            </TouchableOpacity>
            <TextInput
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="اسألني أي شيء عن الدرس..."
              placeholderTextColor={colors.textMuted}
              style={[styles.tutorInput, { color: colors.text, backgroundColor: colors.surface }]}
              multiline
            />
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    padding: 16,
    paddingBottom: 8,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 22, fontWeight: '800' },
  categoryTabs: {
    flexDirection: 'row-reverse',
    borderBottomWidth: 1,
    paddingHorizontal: 8,
  },
  categoryTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  categoryTabText: { fontSize: 13, fontWeight: '600' },
  categoryTabTextActive: { fontWeight: '800' },
  listContent: { padding: 16, paddingBottom: 32 },
  lessonCard: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  lessonCardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  lessonTitleText: { fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'right' },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    marginLeft: 12,
  },
  difficultyText: { fontSize: 10, fontWeight: '800' },
  lessonDescText: { fontSize: 13, lineHeight: 18, textAlign: 'right', marginBottom: 16 },
  startBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  startBtnText: { fontSize: 14, fontWeight: '700' },

  // Lesson view screen
  lessonHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
    marginLeft: 12,
  },
  lessonHeaderTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'right',
  },
  tabsContainer: {
    flexDirection: 'row-reverse',
    padding: 6,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabText: { fontSize: 12, fontWeight: '700' },
  tabContentScroll: { flex: 1 },
  tabContentContainer: { padding: 16, paddingBottom: 40 },

  // Code editor styles
  editorCard: { padding: 0, overflow: 'hidden', borderWidth: 1 },
  consoleHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  consoleTitle: { fontFamily: 'monospace', fontSize: 13, fontWeight: '600' },
  editorInput: {
    fontFamily: 'monospace',
    fontSize: 13.5,
    minHeight: 180,
    padding: 16,
    textAlign: 'left',
  },
  runBtn: { margin: 12, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  runBtnText: { fontSize: 14, fontWeight: '700' },
  outputCard: { padding: 0, overflow: 'hidden', marginTop: 16, borderWidth: 1 },
  outputBox: { padding: 16, minHeight: 80 },
  outputText: { fontFamily: 'monospace', fontSize: 13, lineHeight: 18, textAlign: 'left' },

  // Homework tab
  configCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  hwTitle: { fontSize: 16, fontWeight: '700', textAlign: 'right', marginBottom: 4 },
  hwDesc: { fontSize: 12.5, lineHeight: 18, textAlign: 'right', marginBottom: 14 },
  hwToggleRow: {
    flexDirection: 'row-reverse',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
    padding: 4,
    marginBottom: 12,
  },
  hwToggleBtn: { flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  hwToggleBtnActive: { shadowOpacity: 0.1 },
  hwToggleBtnText: { fontSize: 12, fontWeight: '700' },
  generateBtn: { paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  generateBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },

  // MCQ
  questionsContainer: { gap: 16 },
  questionCard: { padding: 16, borderRadius: 12, borderWidth: 1 },
  questionText: { fontSize: 14.5, fontWeight: '700', textAlign: 'right', marginBottom: 14 },
  optionBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  optionText: { fontSize: 13, fontWeight: '600', textAlign: 'right', flex: 1 },
  explanationBox: { padding: 12, borderRadius: 8, marginTop: 12 },
  explanationTitle: { fontSize: 12, fontWeight: '700', textAlign: 'right', marginBottom: 2 },
  explanationText: { fontSize: 12, lineHeight: 17, textAlign: 'right' },
  submitHwBtn: { paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  submitHwBtnText: { fontSize: 14, fontWeight: '800' },

  // Bug Fix
  bugFixCard: { padding: 16, borderRadius: 12, borderWidth: 1 },
  bugFixTitleRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginBottom: 12 },
  bugFixTitle: { fontSize: 15, fontWeight: '800' },
  bugFixDesc: { fontSize: 13.5, lineHeight: 19, textAlign: 'right', marginBottom: 12 },
  bugFixOutputBox: { backgroundColor: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 8, marginBottom: 12 },
  bugFixOutputText: { fontFamily: 'monospace', fontSize: 12, textAlign: 'left' },
  bugFixLoadBtn: { paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  bugFixLoadBtnText: { fontSize: 12, fontWeight: '700' },
  gradingResultBox: { padding: 16, borderRadius: 10, borderWidth: 1, marginTop: 16 },
  gradingResultTitle: { fontSize: 14, fontWeight: '800' },
  gradingFeedback: { fontSize: 12, lineHeight: 17, textAlign: 'right' },
  correctedCode: { fontFamily: 'monospace', fontSize: 12, padding: 12, borderRadius: 8, marginTop: 4, textAlign: 'left' },

  // Tutor tab
  tutorContainer: { flex: 1 },
  tutorChatScroll: { flex: 1 },
  tutorChatContent: { padding: 16, paddingBottom: 24, gap: 12 },
  msgBubble: {
    padding: 12,
    borderRadius: 12,
    maxWidth: '85%',
  },
  msgUser: {
    alignSelf: 'flex-start',
    borderTopLeftRadius: 0,
  },
  msgModel: {
    alignSelf: 'flex-end',
    borderTopRightRadius: 0,
    borderWidth: 1,
  },
  msgText: { fontSize: 13, lineHeight: 18, textAlign: 'right' },
  tutorInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
  },
  tutorInput: {
    flex: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    textAlign: 'right',
    maxHeight: 80,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
})
