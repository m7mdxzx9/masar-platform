import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useTheme } from '../theme/ThemeContext'
import { Card } from '../components/Card'
import { getNotes, createNote } from '../api/endpoints'
import { Ionicons } from '@expo/vector-icons'

const NotesScreen: React.FC = () => {
  const { colors } = useTheme()
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchNotes = () => {
    getNotes()
      .then((data) => setNotes(Array.isArray(data) ? data : data?.notes || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchNotes() }, [])

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    setSaving(true)
    try {
      await createNote({ content: newNote.trim() })
      setNewNote('')
      fetchNotes()
    } catch {}
    finally { setSaving(false) }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>الملاحظات الدراسية</Text>

      <Card style={{ borderColor: colors.border }}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surfaceHover, color: colors.text, borderColor: colors.border }]}
          value={newNote}
          onChangeText={setNewNote}
          placeholder="اكتب ملاحظة جديدة للمراجعة..."
          placeholderTextColor={colors.textMuted}
          multiline
        />
        <TouchableOpacity 
          style={[styles.addBtn, { backgroundColor: colors.accent, opacity: saving ? 0.6 : 1 }]} 
          onPress={handleAddNote} 
          disabled={saving}
        >
          <Ionicons name="add" size={18} color="#fff" style={{ marginLeft: 6 }} />
          <Text style={styles.addBtnText}>{saving ? 'جاري الحفظ...' : 'إضافة ملاحظة جديدة'}</Text>
        </TouchableOpacity>
      </Card>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 20 }} />
      ) : notes.length === 0 ? (
        <View style={styles.emptyView}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>لا توجد ملاحظات مسجلة بعد.</Text>
        </View>
      ) : (
        notes.map((note, i) => (
          <Card key={note.id || i} style={{ borderColor: colors.border, borderRightColor: colors.accent, borderRightWidth: 3 }}>
            <Text style={[styles.noteContent, { color: colors.text }]}>{note.content || note.text || ''}</Text>
            <View style={styles.noteFooter}>
              <Ionicons name="calendar-outline" size={12} color={colors.textMuted} style={{ marginLeft: 4 }} />
              <Text style={[styles.noteDate, { color: colors.textMuted }]}>
                {note.created_at ? new Date(note.created_at).toLocaleDateString('ar-SA') : ''}
              </Text>
            </View>
          </Card>
        ))
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16, textAlign: 'right' },
  input: { borderRadius: 12, padding: 12, borderWidth: 1, minHeight: 100, textAlignVertical: 'top', fontSize: 15, textAlign: 'right' },
  addBtn: { padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 12, flexDirection: 'row-reverse' },
  addBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  noteContent: { fontSize: 15, lineHeight: 22, textAlign: 'right' },
  noteFooter: { flexDirection: 'row-reverse', alignItems: 'center', marginTop: 10 },
  noteDate: { fontSize: 12 },
  emptyView: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center' },
})

export default NotesScreen
