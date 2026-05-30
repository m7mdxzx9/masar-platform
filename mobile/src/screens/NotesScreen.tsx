import React, { useEffect, useState, useRef } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useTheme } from '../theme/ThemeContext'
import { Card } from '../components/Card'
import { syncManager } from '../services/syncManager'
import { Ionicons } from '@expo/vector-icons'
import { Audio } from 'expo-av'
import * as DocumentPicker from 'expo-document-picker'
import apiClient from '../api/client'

const NotesScreen: React.FC = () => {
  const { colors } = useTheme()
  const [activeTab, setActiveTab] = useState<'text' | 'voice'>('text')
  const [notes, setNotes] = useState<any[]>(syncManager.getNotes())
  const [newNote, setNewNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [ocrLoading, setOcrLoading] = useState(false)

  // Voice recording state
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordDuration, setRecordDuration] = useState(0)
  const [uploadingVoice, setUploadingVoice] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Voice playback state
  const [sound, setSound] = useState<Audio.Sound | null>(null)
  const [playingNoteId, setPlayingNoteId] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    setNotes(syncManager.getNotes())
    const unsubscribe = syncManager.subscribe(() => {
      setNotes(syncManager.getNotes())
    })
    syncManager.pull()
    return () => {
      unsubscribe()
      if (timerRef.current) clearInterval(timerRef.current)
      if (sound) {
        sound.unloadAsync()
      }
    }
  }, [sound])

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    setSaving(true)
    try {
      await syncManager.addNote(newNote.trim())
      setNewNote('')
    } catch {} finally {
      setSaving(false)
    }
  }

  const handleDeleteNote = async (id: number) => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من رغبتك في حذف هذه الملاحظة؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              if (playingNoteId === id && sound) {
                await sound.stopAsync()
                setPlayingNoteId(null)
                setIsPlaying(false)
              }
              await syncManager.deleteNote(id)
            } catch {}
          },
        },
      ],
      { cancelable: true }
    )
  }

  // --- OCR Image Text Extraction ---
  const handleOCR = async () => {
    setOcrLoading(true)
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      })

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setOcrLoading(false)
        return
      }

      const asset = result.assets[0]
      const formData = new FormData()
      
      formData.append('file', {
        uri: asset.uri,
        name: asset.name || 'image.jpg',
        type: asset.mimeType || 'image/jpeg',
      } as any)
      formData.append('provider', 'google')

      const response = await apiClient.upload('/api/study/extract-text', formData)
      if (response.ok && response.data?.text) {
        setNewNote((prev) => (prev ? prev + '\n' + response.data.text : response.data.text))
        Alert.alert('تم بنجاح', 'تم استخراج النص من الصورة بنجاح ولصقه في الصندوق.')
      } else {
        Alert.alert('خطأ', 'فشل استخراج النص من الصورة المحددة.')
      }
    } catch (e: any) {
      Alert.alert('خطأ', `حدث خطأ أثناء الاتصال بالخادم: ${e.message || e}`)
    } finally {
      setOcrLoading(false)
    }
  }

  // --- Voice Note Recording ---
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync()
      if (permission.status !== 'granted') {
        Alert.alert('صلاحية مرفوضة', 'يحتاج التطبيق لصلاحية الميكروفون لتسجيل الملاحظات الصوتية.')
        return
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      })

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      )
      setRecording(newRecording)
      setIsRecording(true)
      setRecordDuration(0)

      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      Alert.alert('خطأ', 'فشل بدء التسجيل الصوتي.')
      console.error(err)
    }
  }

  const stopRecording = async () => {
    if (!recording) return
    setIsRecording(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    try {
      await recording.stopAndUnloadAsync()
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      })
      const uri = recording.getURI()
      setRecording(null)

      if (uri) {
        // Prompt for voice note title
        Alert.prompt(
          'عنوان التسجيل',
          'الرجاء كتابة عنوان للملاحظة الصوتية:',
          [
            {
              text: 'إلغاء',
              style: 'cancel',
            },
            {
              text: 'حفظ',
              onPress: async (titleText) => {
                const finalTitle = titleText?.trim() || `تسجيل صوتي ${new Date().toLocaleTimeString('ar-SA')}`
                await uploadVoiceNoteFile(uri, finalTitle, recordDuration)
              },
            },
          ],
          'plain-text',
          `تسجيل صوتي ${new Date().toLocaleDateString('ar-SA')}`
        )
      }
    } catch (error) {
      console.error(error)
      Alert.alert('خطأ', 'حدث خطأ أثناء إنهاء التسجيل.')
    }
  }

  const uploadVoiceNoteFile = async (uri: string, title: string, duration: number) => {
    setUploadingVoice(true)
    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('duration', duration.toString())
      formData.append('file', {
        uri,
        name: 'audio.m4a',
        type: 'audio/m4a',
      } as any)

      const res = await apiClient.upload('/api/notes/voice', formData)
      if (res.ok) {
        Alert.alert('تم الحفظ', 'تم رفع الملاحظة الصوتية ومزامنتها بنجاح.')
        syncManager.pull() // Pull database updates
      } else {
        Alert.alert('خطأ', 'فشل رفع الملاحظة الصوتية إلى الخادم.')
      }
    } catch (e: any) {
      Alert.alert('خطأ', `حدث خطأ أثناء الرفع: ${e.message || e}`)
    } finally {
      setUploadingVoice(false)
    }
  }

  // --- Voice Playback ---
  const handlePlayVoice = async (note: any) => {
    const audioUrl = `${apiClient.getBaseUrl()}/notes/audio/${note.id}`
    
    try {
      // If a sound is already playing
      if (sound) {
        if (playingNoteId === note.id) {
          if (isPlaying) {
            await sound.pauseAsync()
            setIsPlaying(false)
          } else {
            await sound.playAsync()
            setIsPlaying(true)
          }
          return
        } else {
          await sound.stopAsync()
          await sound.unloadAsync()
          setSound(null)
          setPlayingNoteId(null)
          setIsPlaying(false)
        }
      }

      setPlayingNoteId(note.id)
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      )
      setSound(newSound)
      setIsPlaying(true)

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false)
          setPlayingNoteId(null)
        }
      })
    } catch (e: any) {
      Alert.alert('خطأ', 'تعذر تشغيل الملف الصوتي.')
      console.error(e)
    }
  }

  const formatDuration = (secs: number) => {
    if (!secs) return '0:00'
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const textNotes = notes.filter((n) => n.type !== 'voice')
  const voiceNotes = notes.filter((n) => n.type === 'voice')

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.text }]}>الملاحظات الدراسية</Text>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          onPress={() => setActiveTab('text')}
          style={[activeTab === 'text' ? [styles.tabActive, { backgroundColor: colors.accent }] : styles.tabInactive]}
        >
          <Text style={[styles.tabText, { color: activeTab === 'text' ? colors.bg : colors.text }]}>الملاحظات النصية 📝</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('voice')}
          style={[activeTab === 'voice' ? [styles.tabActive, { backgroundColor: colors.accent }] : styles.tabInactive]}
        >
          <Text style={[styles.tabText, { color: activeTab === 'voice' ? colors.bg : colors.text }]}>الملاحظات الصوتية 🎙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'text' ? (
          <View>
            <Card style={{ borderColor: colors.border }}>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceHover, color: colors.text, borderColor: colors.border }]}
                value={newNote}
                onChangeText={setNewNote}
                placeholder="اكتب ملاحظة جديدة للمراجعة..."
                placeholderTextColor={colors.textMuted}
                multiline
              />
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.ocrBtn, { borderColor: colors.accent }]}
                  onPress={handleOCR}
                  disabled={ocrLoading}
                >
                  {ocrLoading ? (
                    <ActivityIndicator size="small" color={colors.accent} />
                  ) : (
                    <>
                      <Ionicons name="camera-outline" size={18} color={colors.accent} style={{ marginLeft: 6 }} />
                      <Text style={[styles.ocrBtnText, { color: colors.accent }]}>قراءة OCR 📷</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.addBtn, { backgroundColor: colors.accent, opacity: saving ? 0.6 : 1 }]}
                  onPress={handleAddNote}
                  disabled={saving}
                >
                  <Ionicons name="add" size={18} color="#fff" style={{ marginLeft: 6 }} />
                  <Text style={styles.addBtnText}>{saving ? 'جاري الحفظ...' : 'إضافة ملاحظة'}</Text>
                </TouchableOpacity>
              </View>
            </Card>

            {textNotes.length === 0 ? (
              <View style={styles.emptyView}>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>لا توجد ملاحظات كتابية بعد.</Text>
              </View>
            ) : (
              textNotes.map((note, i) => (
                <Card key={note.id || i} style={{ borderColor: colors.border, borderRightColor: colors.accent, borderRightWidth: 3 }}>
                  <Text style={[styles.noteContent, { color: colors.text }]}>{note.content}</Text>
                  <View style={styles.noteFooter}>
                    <TouchableOpacity onPress={() => handleDeleteNote(note.id)}>
                      <Ionicons name="trash-outline" size={16} color={colors.error} />
                    </TouchableOpacity>
                    <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
                      <Ionicons name="calendar-outline" size={12} color={colors.textMuted} style={{ marginLeft: 4 }} />
                      <Text style={[styles.noteDate, { color: colors.textMuted }]}>
                        {note.created_at ? new Date(note.created_at).toLocaleDateString('ar-SA') : ''}
                      </Text>
                    </View>
                  </View>
                </Card>
              ))
            )}
          </View>
        ) : (
          <View>
            {/* Recorder Card */}
            <Card style={[styles.recorderCard, { borderColor: colors.border }]}>
              {isRecording ? (
                <View style={styles.recordingStatus}>
                  <View style={styles.pulseDot} />
                  <Text style={[styles.recordTime, { color: colors.text }]}>جاري التسجيل: {formatDuration(recordDuration)}</Text>
                  <TouchableOpacity onPress={stopRecording} style={[styles.recordButton, { backgroundColor: '#EF4444' }]}>
                    <Ionicons name="square" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.recordingStatus}>
                  <Text style={[styles.recordHint, { color: colors.textMuted }]}>
                    {uploadingVoice ? 'جاري رفع الملاحظة الصوتية...' : 'اضغط للبدء بتسجيل ملاحظة صوتية سريعة'}
                  </Text>
                  <TouchableOpacity
                    disabled={uploadingVoice}
                    onPress={startRecording}
                    style={[styles.recordButton, { backgroundColor: colors.accent, opacity: uploadingVoice ? 0.5 : 1 }]}
                  >
                    {uploadingVoice ? <ActivityIndicator color="#fff" /> : <Ionicons name="mic" size={24} color="#fff" />}
                  </TouchableOpacity>
                </View>
              )}
            </Card>

            {voiceNotes.length === 0 ? (
              <View style={styles.emptyView}>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>لا توجد ملاحظات صوتية بعد.</Text>
              </View>
            ) : (
              voiceNotes.map((note, i) => {
                const isCurrentPlaying = playingNoteId === note.id
                return (
                  <Card key={note.id || i} style={{ borderColor: colors.border, borderRightColor: colors.secondary, borderRightWidth: 3 }}>
                    <View style={styles.voiceNoteRow}>
                      <TouchableOpacity
                        onPress={() => handlePlayVoice(note)}
                        style={[styles.playBtn, { backgroundColor: colors.surfaceHover }]}
                      >
                        <Ionicons
                          name={isCurrentPlaying && isPlaying ? 'pause' : 'play'}
                          size={18}
                          color={isCurrentPlaying ? colors.accent : colors.text}
                        />
                      </TouchableOpacity>
                      <View style={styles.voiceNoteInfo}>
                        <Text style={[styles.voiceNoteTitle, { color: colors.text }]}>{note.title}</Text>
                        <Text style={[styles.voiceNoteDuration, { color: colors.textMuted }]}>
                          المدة: {formatDuration(note.duration || 0)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.noteFooter}>
                      <TouchableOpacity onPress={() => handleDeleteNote(note.id)}>
                        <Ionicons name="trash-outline" size={16} color={colors.error} />
                      </TouchableOpacity>
                      <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
                        <Ionicons name="calendar-outline" size={12} color={colors.textMuted} style={{ marginLeft: 4 }} />
                        <Text style={[styles.noteDate, { color: colors.textMuted }]}>
                          {note.created_at ? new Date(note.created_at).toLocaleDateString('ar-SA') : ''}
                        </Text>
                      </View>
                    </View>
                  </Card>
                )
              })
            )}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', marginHorizontal: 16, marginTop: 16, textAlign: 'right' },
  tabsRow: {
    flexDirection: 'row-reverse',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 4,
  },
  tabActive: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabInactive: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: { fontSize: 13, fontWeight: '700' },
  input: { borderRadius: 12, padding: 12, borderWidth: 1, minHeight: 100, textAlignVertical: 'top', fontSize: 15, textAlign: 'right' },
  buttonRow: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginTop: 12,
  },
  addBtn: { flex: 1.3, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row-reverse' },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  ocrBtn: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row-reverse' },
  ocrBtnText: { fontSize: 14, fontWeight: '700' },
  noteContent: { fontSize: 15, lineHeight: 22, textAlign: 'right' },
  noteFooter: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  noteDate: { fontSize: 12 },
  emptyView: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center' },

  // Recorder card styles
  recorderCard: { padding: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 16 },
  recordingStatus: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  recordHint: { fontSize: 13, textAlign: 'center' },
  recordTime: { fontSize: 15, fontWeight: '700' },
  recordButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },

  // Voice note items
  voiceNoteRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingBottom: 12,
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceNoteInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  voiceNoteTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  voiceNoteDuration: { fontSize: 12 },
})

export default NotesScreen
