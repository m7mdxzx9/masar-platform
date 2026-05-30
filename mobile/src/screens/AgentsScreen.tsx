import React, { useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useTheme } from '../theme/ThemeContext'
import { Card } from '../components/Card'
import { askTutor } from '../api/endpoints'
import MarkdownRenderer from '../components/MarkdownRenderer'

const AGENT_PERSONAS = [
  { id: 'tutor', name: 'معلّم شخصي', icon: '🎓', welcome: 'مرحباً! أنا معلّمك الشخصي. كيف يمكنني مساعدتك في دراستك اليوم؟', mode: 'explain' },
  { id: 'explainer', name: 'شارح المفاهيم', icon: '💡', welcome: 'مرحباً! أنا مفسّر المفاهيم. أخبرني عن أي موضوع معقد وسأقوم بتبسيطه لك.', mode: 'explain' },
  { id: 'coder', name: 'مساعد البرمجة', icon: '💻', welcome: 'أهلاً بك! أنا مساعد البرمجة الخاص بك. أرسل لي أي كود أو مشكلة برمجية لنحلها معاً.', mode: 'code' },
  { id: 'math', name: 'محلل الرياضيات', icon: '📐', welcome: 'مرحباً! أنا محلل الرياضيات. شاركني أي معادلة أو مسألة رياضية وسنقوم بحلها خطوة بخطوة.', mode: 'math' },
]

const AgentsScreen: React.FC = () => {
  const { colors } = useTheme()
  const [selectedPersona, setSelectedPersona] = useState('tutor')
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([
    { role: 'assistant', text: AGENT_PERSONAS[0].welcome },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [provider, setProvider] = useState<'google' | 'openrouter'>('google')

  const handleSend = async () => {
    if (!input.trim()) return
    const userMsg = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)
    try {
      const activePersona = AGENT_PERSONAS.find((p) => p.id === selectedPersona)
      const res = await askTutor(userMsg, activePersona?.mode || 'explain', selectedPersona, provider)
      setMessages((prev) => [...prev, { role: 'assistant', text: res?.answer || res?.response || 'تم الرد بنجاح.' }])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'عذراً، حدث خطأ في الاتصال.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.text }]}>الوكلاء الذكيون</Text>

      <View style={[styles.providerToggleContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.providerButton,
            provider === 'google' && { backgroundColor: colors.accent }
          ]}
          onPress={() => setProvider('google')}
        >
          <Text style={[styles.providerText, { color: provider === 'google' ? colors.bg : colors.textMuted }]}>
            Gemini Direct
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.providerButton,
            provider === 'openrouter' && { backgroundColor: colors.accent }
          ]}
          onPress={() => setProvider('openrouter')}
        >
          <Text style={[styles.providerText, { color: provider === 'openrouter' ? colors.bg : colors.textMuted }]}>
            OpenRouter
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.chipWrapper, { borderBottomColor: colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipContainer}
          contentContainerStyle={styles.chipContent}
        >
          {AGENT_PERSONAS.map((persona) => {
            const isSelected = selectedPersona === persona.id
            return (
              <TouchableOpacity
                key={persona.id}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected ? colors.accentGlow : colors.surface,
                    borderColor: isSelected ? colors.accent : colors.border,
                  },
                ]}
                onPress={() => {
                  setSelectedPersona(persona.id)
                  setMessages([{ role: 'assistant', text: persona.welcome }])
                }}
              >
                <Text style={styles.chipIcon}>{persona.icon}</Text>
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: isSelected ? colors.accent : colors.textMuted,
                    },
                  ]}
                >
                  {persona.name}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      <ScrollView style={styles.chatArea} contentContainerStyle={styles.chatContent}>
        {messages.map((msg, i) => (
          <View key={i} style={[styles.msgRow, msg.role === 'user' ? styles.userRow : styles.assistantRow]}>
            <View
              style={[
                styles.msgCard,
                msg.role === 'user'
                  ? {
                      backgroundColor: colors.accentGlow,
                      borderColor: colors.accent,
                      borderWidth: 1.5,
                      borderBottomRightRadius: 4,
                    }
                  : {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      borderWidth: 1.5,
                      borderBottomLeftRadius: 4,
                    },
              ]}
            >
              <View style={{ width: '100%' }}>
              <MarkdownRenderer content={msg.text} colors={colors} />
            </View>
            </View>
          </View>
        ))}
        {loading && (
          <View style={styles.assistantRow}>
            <ActivityIndicator color={colors.accent} />
          </View>
        )}
      </ScrollView>

      <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surfaceHover, color: colors.text, borderColor: colors.border }]}
          value={input}
          onChangeText={setInput}
          placeholder="اكتب سؤالك..."
          placeholderTextColor={colors.textMuted}
          multiline
          textAlign="right"
        />
        <TouchableOpacity style={[styles.sendBtn, { backgroundColor: colors.accent }]} onPress={handleSend} disabled={loading}>
          <Text style={[styles.sendBtnText, { color: colors.bg }]}>إرسال</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  providerToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 2,
    overflow: 'hidden',
  },
  providerButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  providerText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8, paddingHorizontal: 16, paddingTop: 16, textAlign: 'right' },
  chipWrapper: { paddingVertical: 10, borderBottomWidth: 1 },
  chipContainer: { paddingHorizontal: 12 },
  chipContent: { flexDirection: 'row-reverse', paddingRight: 4 },
  chip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    marginHorizontal: 4,
    gap: 6,
  },
  chipIcon: { fontSize: 16 },
  chipText: { fontSize: 14, fontWeight: '600' },
  chatArea: { flex: 1 },
  chatContent: { padding: 16, paddingBottom: 8 },
  msgRow: { marginBottom: 12, width: '100%' },
  userRow: { alignItems: 'flex-end' },
  assistantRow: { alignItems: 'flex-start' },
  msgCard: { maxWidth: '94%', borderRadius: 16, padding: 12 },
  msgText: { fontSize: 15, lineHeight: 22, textAlign: 'right' },
  inputBar: { flexDirection: 'row-reverse', padding: 12, borderTopWidth: 1, alignItems: 'flex-end', gap: 8 },
  input: { flex: 1, borderRadius: 12, padding: 12, maxHeight: 100, borderWidth: 1, fontSize: 15, textAlign: 'right' },
  sendBtn: { borderRadius: 12, padding: 12, paddingHorizontal: 20, justifyContent: 'center' },
  sendBtnText: { fontWeight: '600', fontSize: 15 },
})

export default AgentsScreen
