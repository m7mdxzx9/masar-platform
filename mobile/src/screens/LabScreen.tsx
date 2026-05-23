import React, { useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useTheme } from '../theme/ThemeContext'
import { Card } from '../components/Card'
import { runCode } from '../api/endpoints'

const LabScreen: React.FC = () => {
  const { colors } = useTheme()
  const [code, setCode] = useState('# اكتب كود بايثون هنا\nprint("مرحبا مسار")\n')
  const [output, setOutput] = useState('')
  const [running, setRunning] = useState(false)

  const handleRun = async () => {
    setRunning(true)
    setOutput('')
    try {
      const res = await runCode(code)
      setOutput(res?.output || res?.result || '✅ تم التنفيذ بنجاح')
    } catch (e: any) {
      setOutput(`❌ خطأ: ${e.message}`)
    } finally {
      setRunning(false)
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>المختبر الذكي</Text>

      <Card style={[styles.consoleCard, { borderColor: colors.border }]}>
        {/* Terminal Header */}
        <View style={[styles.consoleHeader, { backgroundColor: colors.surfaceHover, borderBottomColor: colors.border }]}>
          <View style={styles.consoleDots}>
            <View style={[styles.consoleDot, { backgroundColor: '#FF5F56' }]} />
            <View style={[styles.consoleDot, { backgroundColor: '#FFBD2E' }]} />
            <View style={[styles.consoleDot, { backgroundColor: '#27C93F' }]} />
          </View>
          <Text style={[styles.consoleTitle, { color: colors.textMuted }]}>main.py</Text>
        </View>

        {/* Code Input Area */}
        <TextInput
          style={[styles.codeInput, { backgroundColor: colors.bg, color: colors.text }]}
          multiline
          value={code}
          onChangeText={setCode}
          textAlignVertical="top"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Run Button (Glowing Accent) */}
        <TouchableOpacity
          style={[
            styles.runBtn,
            {
              backgroundColor: colors.accent,
              shadowColor: colors.accent,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
              elevation: 6,
              opacity: running ? 0.6 : 1,
            },
          ]}
          onPress={handleRun}
          disabled={running}
        >
          {running ? (
            <ActivityIndicator color={colors.bg} />
          ) : (
            <Text style={[styles.runBtnText, { color: colors.bg }]}>تشغيل ▶</Text>
          )}
        </TouchableOpacity>
      </Card>

      {output ? (
        <Card style={[styles.outputCard, { backgroundColor: '#090A0F', borderColor: colors.border, borderWidth: 1.5 }]}>
          <View style={[styles.consoleHeader, { backgroundColor: '#12131A', borderBottomColor: '#20212E', borderBottomWidth: 1 }]}>
            <View style={styles.consoleDots}>
              <View style={[styles.consoleDot, { backgroundColor: '#FF5F56', opacity: 0.6 }]} />
              <View style={[styles.consoleDot, { backgroundColor: '#FFBD2E', opacity: 0.6 }]} />
              <View style={[styles.consoleDot, { backgroundColor: '#27C93F', opacity: 0.6 }]} />
            </View>
            <Text style={[styles.consoleTitle, { color: '#8F93A3' }]}>المخرجات (Terminal)</Text>
          </View>
          <View style={styles.outputBox}>
            <Text style={[styles.outputText, { color: '#00FFCC' }]}>{output}</Text>
          </View>
        </Card>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16, textAlign: 'right' },
  consoleCard: {
    padding: 0,
    overflow: 'hidden',
    borderWidth: 1.5,
  },
  consoleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  consoleDots: {
    flexDirection: 'row',
    gap: 6,
  },
  consoleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  consoleTitle: {
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: '600',
  },
  codeInput: {
    fontFamily: 'monospace',
    fontSize: 14,
    minHeight: 200,
    padding: 16,
    textAlignVertical: 'top',
  },
  runBtn: {
    margin: 16,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  runBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  outputCard: {
    padding: 0,
    overflow: 'hidden',
    marginTop: 16,
  },
  outputBox: {
    padding: 16,
    minHeight: 100,
  },
  outputText: {
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'left',
  },
})

export default LabScreen
