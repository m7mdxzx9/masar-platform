import React, { useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useTheme } from '../theme/ThemeContext'
import { Card } from '../components/Card'
import { generateQuiz, generateFlashcards } from '../api/endpoints'
import { Ionicons } from '@expo/vector-icons'

const StudyAssistantScreen: React.FC = () => {
  const { colors } = useTheme()
  const [activeTab, setActiveTab] = useState<'quiz' | 'flashcards'>('quiz')
  const [topic, setTopic] = useState('')
  const [content, setContent] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    if (!topic.trim()) return
    setLoading(true)
    try {
      const res = activeTab === 'quiz'
        ? await generateQuiz(topic)
        : await generateFlashcards(topic)
      setContent(res)
    } catch {
      setContent({ error: 'حدث خطأ في الاتصال بالخادم' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>المساعد الدراسي الذكي</Text>

      <View style={styles.tabRow}>
        {(['quiz', 'flashcards'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              {
                backgroundColor: activeTab === tab ? colors.accent : colors.surface,
                borderColor: activeTab === tab ? colors.accent : colors.border,
              },
            ]}
            onPress={() => { setActiveTab(tab); setContent(null) }}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? '#fff' : colors.text }]}>
              {tab === 'quiz' ? 'اختبار قصير' : 'بطاقات تعليمية'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Card style={{ borderColor: colors.border }}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surfaceHover, color: colors.text, borderColor: colors.border }]}
          value={topic}
          onChangeText={setTopic}
          placeholder="أدخل موضوع الدراسة (مثال: البرمجة كائنية التوجه)..."
          placeholderTextColor={colors.textMuted}
        />
        <TouchableOpacity
          style={[styles.generateBtn, { backgroundColor: colors.accent, opacity: loading ? 0.6 : 1 }]}
          onPress={handleGenerate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.generateBtnContent}>
              <Ionicons name="sparkles" size={16} color="#fff" style={{ marginLeft: 6 }} />
              <Text style={styles.generateBtnText}>توليد المحتوى بالذكاء الاصطناعي</Text>
            </View>
          )}
        </TouchableOpacity>
      </Card>

      {content ? (
        <Card style={{ borderColor: colors.border }}>
          <Text style={[styles.resultTitle, { color: colors.text }]}>النتيجة المستلمة:</Text>
          <Text style={[styles.resultText, { color: colors.textMuted }]}>{JSON.stringify(content, null, 2)}</Text>
        </Card>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16, textAlign: 'right' },
  tabRow: { flexDirection: 'row-reverse', gap: 8, marginBottom: 16 },
  tab: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  tabText: { fontSize: 13, fontWeight: '700' },
  input: { borderRadius: 12, padding: 12, borderWidth: 1, fontSize: 15, textAlign: 'right' },
  generateBtn: { padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 12, minHeight: 48, justifyContent: 'center' },
  generateBtnContent: { flexDirection: 'row-reverse', alignItems: 'center' },
  generateBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  resultTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8, textAlign: 'right' },
  resultText: { fontSize: 13, lineHeight: 20, fontFamily: 'monospace', textAlign: 'right' },
})

export default StudyAssistantScreen
