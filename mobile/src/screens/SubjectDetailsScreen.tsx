import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native'
import { useTheme } from '../theme/ThemeContext'
import { Ionicons } from '@expo/vector-icons'
import {
  getSubjectDetail,
  deleteSubjectFile,
  uploadSubjectFile,
  summarizeSubject,
} from '../api/endpoints'
import { useNavigation } from '../navigation/navigation'
import { syncManager } from '../services/syncManager'
import { FlashList } from '@shopify/flash-list'
import Animated, { FadeInDown, FadeOutUp, LinearTransition } from 'react-native-reanimated'
import * as DocumentPicker from 'expo-document-picker'
import * as Haptics from 'expo-haptics'


const COLORS = ['#6366f1', '#0d9488', '#8b5cf6', '#f43f5e', '#d97706', '#10b981']

interface SubjectDetailsScreenProps {
  subjectId: number
}

export const SubjectDetailsScreen: React.FC<SubjectDetailsScreenProps> = ({ subjectId }) => {
  const { colors } = useTheme()
  const navigation = useNavigation()

  const [subject, setSubject] = useState<any>(null)
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [summarizing, setSummarizing] = useState(false)
  const [summary, setSummary] = useState<any>(null)

  // Accordion open states
  const [showOverallSummary, setShowOverallSummary] = useState(true)
  const [openFileSummaryIndex, setOpenFileSummaryIndex] = useState<number | null>(null)


  // Edit Form States
  const [showEditModal, setShowEditModal] = useState(false)
  const [editName, setEditName] = useState('')
  const [editCode, setEditCode] = useState('')
  const [editInstructor, setEditInstructor] = useState('')
  const [editRoom, setEditRoom] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editColor, setEditColor] = useState('#6366f1')

  // Notes CRUD states
  const [notes, setNotes] = useState<any[]>([])
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null)

  const loadNotes = () => {
    if (!subjectId) return
    const allNotes = syncManager.getNotes()
    const subjectNotes = allNotes.filter(
      (n: any) =>
        (n.title && n.title.includes(`[SubjectId: ${subjectId}]`)) ||
        (n.content && n.content.includes(`[SubjectId: ${subjectId}]`))
    )
    setNotes(subjectNotes)
  }

  const handleAddOrUpdateNote = async () => {
    if (!noteContent.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال محتوى الملاحظة.')
      return
    }
    const fullTitle = `[SubjectId: ${subjectId}] ${noteTitle.trim() || 'ملاحظة مادة'}`
    try {
      if (editingNoteId !== null) {
        await syncManager.updateNote(editingNoteId, {
          title: fullTitle,
          content: noteContent.trim(),
        })
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        Alert.alert('نجاح', 'تم تحديث الملاحظة بنجاح!')
      } else {
        await syncManager.addNote(noteContent.trim(), fullTitle)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        Alert.alert('نجاح', 'تمت إضافة الملاحظة بنجاح!')
      }
      setNoteTitle('')
      setNoteContent('')
      setEditingNoteId(null)
      setShowNoteModal(false)
      loadNotes()
    } catch (e: any) {
      Alert.alert('خطأ', `فشل حفظ الملاحظة: ${e.message}`)
    }
  }

  const handleDeleteNote = (noteId: number) => {
    Alert.alert('حذف الملاحظة', 'هل أنت متأكد من رغبتك في حذف هذه الملاحظة؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            await syncManager.deleteNote(noteId)
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            loadNotes()
            Alert.alert('نجاح', 'تم حذف الملاحظة بنجاح')
          } catch (e) {
            Alert.alert('خطأ', 'فشل في حذف الملاحظة')
          }
        }
      }
    ])
  }

  useEffect(() => {
    fetchDetails()
    loadNotes()
    const unsubscribe = syncManager.subscribe(() => {
      loadNotes()
    })
    return unsubscribe
  }, [subjectId])

  const fetchDetails = async () => {
    if (!subjectId) {
      setSubject({ name: 'مادة غير معروفة' })
      setFiles([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await getSubjectDetail(subjectId.toString())
      setSubject(data)
      setFiles(data.files || [])
    } catch (e) {
      console.log('Error details', e)
      // Local fallback for offline/disconnected states
      const localSubjects = syncManager.getSubjects()
      const localSub = localSubjects.find(
        (s: any) => s.id === subjectId || s.id?.toString() === subjectId?.toString()
      )
      if (localSub) {
        setSubject(localSub)
        setFiles([])
      } else {
        Alert.alert('خطأ', 'فشل في تحميل تفاصيل المادة')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSubject = () => {
    Alert.alert('حذف المادة', 'هل أنت متأكد من رغبتك في حذف هذه المادة الدراسية بالكامل؟ سيؤدي ذلك لحذف ملفاتها وملاحظاتها.', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            await syncManager.deleteSubject(subjectId)
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            Alert.alert('نجاح', 'تم حذف المادة الدراسية بنجاح')
            navigation.pop()
          } catch (e) {
            Alert.alert('خطأ', 'فشل في حذف المادة')
          }
        }
      }
    ])
  }

  const handleUpdateSubject = async () => {
    if (!editName.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم المادة الدراسي.')
      return
    }
    try {
      setLoading(true)
      await syncManager.updateSubject(subjectId, {
        name: editName.trim(),
        code: editCode.trim() || null,
        instructor: editInstructor.trim() || null,
        room: editRoom.trim() || null,
        color: editColor,
        notes: editNotes.trim() || null,
      })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setShowEditModal(false)
      // Update local state instantly
      const updated = syncManager.getSubjects().find((s: any) => s.id === subjectId)
      if (updated) {
        setSubject(updated)
      } else {
        fetchDetails()
      }
      Alert.alert('نجاح', 'تم تحديث بيانات المادة بنجاح!')
    } catch (e: any) {
      Alert.alert('خطأ', `فشل تحديث المادة: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteFile = async (fileId: number) => {
    Alert.alert('تأكيد الحذف', 'هل أنت متأكد من رغبتك في حذف هذا الملف؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSubjectFile(subjectId.toString(), fileId.toString())
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            setFiles((prev) => prev.filter((f) => f.id !== fileId))
            Alert.alert('نجاح', 'تم حذف الملف')
          } catch (e) {
            Alert.alert('خطأ', 'فشل حذف الملف')
          }
        },
      },
    ])
  }

  const handleActualUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'image/png',
          'image/jpeg',
          'image/jpg',
        ],
        copyToCacheDirectory: true,
      })

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return
      }

      setLoading(true)
      const fileAsset = result.assets[0]

      const formData = new FormData()
      
      let mimeType = fileAsset.mimeType;
      if (!mimeType && fileAsset.name) {
        const lowerName = fileAsset.name.toLowerCase();
        if (lowerName.endsWith('.png')) mimeType = 'image/png';
        else if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) mimeType = 'image/jpeg';
        else if (lowerName.endsWith('.pdf')) mimeType = 'application/pdf';
        else if (lowerName.endsWith('.docx')) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        else if (lowerName.endsWith('.txt')) mimeType = 'text/plain';
      }

      // Axios FormData file upload in React Native requires an object with uri, name, and type fields
      const fileData = {
        uri: fileAsset.uri,
        name: fileAsset.name || 'file.pdf',
        type: mimeType || 'application/octet-stream',
      }
      formData.append('file', fileData as any)

      await uploadSubjectFile(subjectId.toString(), formData)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      fetchDetails()
      Alert.alert('نجاح', 'تم رفع الملف وفهرسته بالذكاء الاصطناعي بنجاح!')
    } catch (e: any) {
      console.log('Upload error:', e)
      Alert.alert('خطأ', 'فشل في رفع الملف: ' + (e.message || 'حدث خطأ غير معروف'))
    } finally {
      setLoading(false)
    }
  }


  const handleGenerateSummary = async () => {
    if (files.length === 0) {
      Alert.alert('تنبيه', 'يرجى رفع ملفات لهذه المادة أولاً لتوليد ملخص لها.')
      return
    }
    setSummarizing(true)
    try {
      const res = await summarizeSubject(subjectId.toString())
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setSummary(res)
    } catch (e) {
      console.log(e)
      Alert.alert('خطأ', 'فشل في تلخيص ملفات المادة بالذكاء الاصطناعي')
    } finally {
      setSummarizing(false)
    }
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    )
  }

  if (!subject) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <Text style={{ color: colors.text }}>المادة غير موجودة</Text>
      </View>
    )
  }

  const glowingStyle = {
    borderColor: colors.accent,
    shadowColor: colors.accent,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
    borderWidth: 2,
  }

  const closedStyle = {
    borderColor: colors.border,
    borderWidth: 1,
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>
      {/* Subject Information Card wrapped in Animated.View */}
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>{subject.name}</Text>
          <View style={[styles.colorBadge, { backgroundColor: subject.color || colors.accent }]} />
        </View>
        <Text style={[styles.codeText, { color: colors.textMuted }]}>كود المادة: {subject.code || 'غير محدد'}</Text>

        <View style={styles.metaGrid}>
          <View style={[styles.metaCard, { backgroundColor: colors.surfaceHover, borderColor: colors.border }]}>
            <Ionicons name="person-outline" size={16} color={colors.accent} />
            <Text style={[styles.metaLabel, { color: colors.textMuted }]}>المعلم</Text>
            <Text style={[styles.metaValue, { color: colors.text }]} numberOfLines={1}>
              {subject.instructor || 'غير محدد'}
            </Text>
          </View>
          
          <View style={[styles.metaCard, { backgroundColor: colors.surfaceHover, borderColor: colors.border }]}>
            <Ionicons name="time-outline" size={16} color={colors.accent} />
            <Text style={[styles.metaLabel, { color: colors.textMuted }]}>الجدول</Text>
            <Text style={[styles.metaValue, { color: colors.text }]} numberOfLines={1}>
              {subject.schedule_day ? `${subject.schedule_day} (${subject.schedule_time})` : 'غير محدد'}
            </Text>
          </View>

          <View style={[styles.metaCard, { backgroundColor: colors.surfaceHover, borderColor: colors.border }]}>
            <Ionicons name="location-outline" size={16} color={colors.accent} />
            <Text style={[styles.metaLabel, { color: colors.textMuted }]}>القاعة</Text>
            <Text style={[styles.metaValue, { color: colors.text }]} numberOfLines={1}>
              {subject.room || 'غير محدد'}
            </Text>
          </View>
        </View>

        {subject.notes ? (
          <Text style={[styles.notesText, { color: colors.textMuted }]}>ملاحظات: {subject.notes}</Text>
        ) : null}

        {/* CRUD Buttons Row */}
        <View style={styles.crudButtonsRow}>
          <TouchableOpacity
            style={[styles.crudBtn, { backgroundColor: colors.surfaceHover, borderColor: colors.border }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              setEditName(subject.name || '')
              setEditCode(subject.code || '')
              setEditInstructor(subject.instructor || '')
              setEditRoom(subject.room || '')
              setEditNotes(subject.notes || '')
              setEditColor(subject.color || '#6366f1')
              setShowEditModal(true)
            }}
          >
            <Ionicons name="create-outline" size={16} color={colors.accent} style={{ marginLeft: 4 }} />
            <Text style={[styles.crudBtnText, { color: colors.text }]}>تعديل البيانات</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.crudBtn, { backgroundColor: colors.error + '15', borderColor: colors.error }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
              handleDeleteSubject()
            }}
          >
            <Ionicons name="trash-outline" size={16} color={colors.error} style={{ marginLeft: 4 }} />
            <Text style={[styles.crudBtnText, { color: colors.error }]}>حذف المادة</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Files Section */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>الملفات والمستندات المرفقة ({files.length})</Text>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.accent + '15', borderColor: colors.accent }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            handleActualUpload()
          }}
        >
          <Ionicons name="cloud-upload-outline" size={16} color={colors.accent} />
          <Text style={[styles.actionBtnText, { color: colors.accent }]}>رفع مستند</Text>
        </TouchableOpacity>
      </View>

      <FlashList
        data={files}
        estimatedItemSize={70}
        scrollEnabled={false}
        ListEmptyComponent={
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="document-text-outline" size={32} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>لا توجد ملفات مرفقة بالمادة حالياً. ابدأ برفع ملفاتك الدراسية كملخصات ومحاضرات.</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInDown.delay(index * 30).duration(200)}
            exiting={FadeOutUp}
            layout={LinearTransition}
          >
            <View style={[styles.fileRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.fileIconWrapper, { backgroundColor: colors.accent + '15' }]}>
                <Ionicons name="document-text" size={22} color={colors.accent} />
              </View>
              <View style={styles.fileDetails}>
                <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>
                  {item.original_name}
                </Text>
                <Text style={[styles.fileSize, { color: colors.textMuted }]}>
                  {Math.round(item.file_size / 1024)} كيلوبايت
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                  handleDeleteFile(item.id)
                }}
                style={[styles.deleteButton, { backgroundColor: colors.error + '15' }]}
              >
                <Ionicons name="trash" size={16} color={colors.error} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      />

      {/* Notes Section */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>الملاحظات الدراسية المخصصة ({notes.length})</Text>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.accent + '15', borderColor: colors.accent }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            setNoteTitle('')
            setNoteContent('')
            setEditingNoteId(null)
            setShowNoteModal(true)
          }}
        >
          <Ionicons name="add-circle-outline" size={16} color={colors.accent} style={{ marginLeft: 4 }} />
          <Text style={[styles.actionBtnText, { color: colors.accent }]}>إضافة ملاحظة</Text>
        </TouchableOpacity>
      </View>

      <FlashList
        data={notes}
        estimatedItemSize={120}
        scrollEnabled={false}
        ListEmptyComponent={
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: 20 }]}>
            <Ionicons name="create-outline" size={32} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>لا توجد ملاحظات لهذه المادة حالياً. ابدأ بإضافة ملاحظاتك الخاصة للمراجعة السريعة.</Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const cleanTitle = item.title ? item.title.replace(`[SubjectId: ${subjectId}] `, '') : 'ملاحظة مادة'
          return (
            <Animated.View
              entering={FadeInDown.delay(index * 30).duration(250)}
              exiting={FadeOutUp}
              layout={LinearTransition}
            >
              <View style={[styles.noteRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.noteDetails}>
                  <Text style={[styles.noteTitleText, { color: colors.text }]} numberOfLines={1}>
                    {cleanTitle}
                  </Text>
                  <Text style={[styles.noteContentText, { color: colors.textMuted }]}>
                    {item.content}
                  </Text>
                  <Text style={[styles.noteDateText, { color: colors.textMuted }]}>
                    {item.created_at ? new Date(item.created_at).toLocaleDateString('ar-SA') : ''}
                  </Text>
                </View>
                <View style={styles.noteActions}>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                      setNoteTitle(cleanTitle)
                      setNoteContent(item.content || '')
                      setEditingNoteId(item.id)
                      setShowNoteModal(true)
                    }}
                    style={[styles.editButton, { backgroundColor: colors.accent + '15' }]}
                  >
                    <Ionicons name="create" size={16} color={colors.accent} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                      handleDeleteNote(item.id)
                    }}
                    style={[styles.deleteButton, { backgroundColor: colors.error + '15', marginTop: 8 }]}
                  >
                    <Ionicons name="trash" size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          )
        }}
      />

      {/* AI Summary Accordion Section */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>الملخص الذكي (AI Accordion Summary)</Text>
        {!summary && !summarizing && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.accent + '15', borderColor: colors.accent }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
              handleGenerateSummary()
            }}
          >
            <Ionicons name="sparkles-outline" size={16} color={colors.accent} />
            <Text style={[styles.actionBtnText, { color: colors.accent }]}>توليد تلخيص الذكاء الاصطناعي</Text>
          </TouchableOpacity>
        )}
      </View>

      {summarizing && (
        <View style={styles.summarizingLoader}>
          <ActivityIndicator color={colors.accent} size="large" />
          <Text style={[styles.loaderText, { color: colors.text }]}>جاري تلخيص جميع المستندات واستخلاص النقاط الهامة...</Text>
        </View>
      )}

      {summary && (
        <View style={styles.accordionContainer}>
          {/* Overall Summary Accordion */}
          <View style={[
            styles.accordionBox,
            showOverallSummary ? glowingStyle : closedStyle,
            { backgroundColor: colors.surface }
          ]}>
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                setShowOverallSummary(!showOverallSummary)
              }}
              activeOpacity={0.8}
            >
              <Ionicons name={showOverallSummary ? 'chevron-up' : 'chevron-down'} size={18} color={colors.text} />
              <Text style={[styles.accordionTitle, { color: colors.text }]}>الملخص العام للمادة</Text>
            </TouchableOpacity>

            {showOverallSummary && (
              <View style={[styles.accordionBody, { borderTopWidth: 1, borderTopColor: colors.border }]}>
                <Text style={[styles.summaryTextBody, { color: colors.text }]}>{summary.overall_summary}</Text>
                
                <Text style={[styles.subHeading, { color: colors.accent, marginTop: 12 }]}>النقاط الرئيسية المستخلصة:</Text>
                {(summary.overall_key_points || []).map((p: string, idx: number) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Text style={[styles.bulletText, { color: colors.text }]}>{p}</Text>
                    <Text style={[styles.bulletPoint, { color: colors.accent }]}>•</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Individual File Summaries Accordions */}
          {summary.file_summaries && summary.file_summaries.map((fs: any, index: number) => {
            const isOpen = openFileSummaryIndex === index
            return (
              <View key={index} style={{ marginTop: 12 }}>
                <View style={[
                  styles.accordionBox,
                  isOpen ? glowingStyle : closedStyle,
                  { backgroundColor: colors.surface }
                ]}>
                  <TouchableOpacity
                    style={styles.accordionHeader}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                      setOpenFileSummaryIndex(isOpen ? null : index)
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.text} />
                    <Text style={[styles.accordionTitle, { color: colors.text }]} numberOfLines={1}>
                      ملخص ملف: {fs.filename}
                    </Text>
                  </TouchableOpacity>

                  {isOpen && (
                    <View style={[styles.accordionBody, { borderTopWidth: 1, borderTopColor: colors.border }]}>
                      <Text style={[styles.summaryTextBody, { color: colors.text }]}>{fs.summary}</Text>
                      {fs.key_points && fs.key_points.map((kp: string, kIdx: number) => (
                        <View key={kIdx} style={styles.bulletRow}>
                          <Text style={[styles.bulletText, { color: colors.text }]}>{kp}</Text>
                          <Text style={[styles.bulletPoint, { color: colors.accent }]}>•</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            )
          })}

          {/* Start Quiz from summaries Button */}
          <TouchableOpacity
            style={[styles.quizButton, { backgroundColor: colors.accent }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
              navigation.push('Quiz', { topic: subject.name, fileContent: summary?.overall_summary })
            }}
          >
            <Ionicons name="school" size={20} color="#fff" style={{ marginLeft: 8 }} />
            <Text style={styles.quizButtonText}>Start Quiz from summaries</Text>
          </TouchableOpacity>
        </View>
      )}



      {/* Edit Subject Modal */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Ionicons name="create-outline" size={24} color={colors.accent} style={{ marginLeft: 8 }} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>تعديل بيانات المادة</Text>
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceHover, color: colors.text, borderColor: colors.border }]}
              value={editName}
              onChangeText={setEditName}
              placeholder="اسم المادة الدراسي * (مثال: الذكاء الاصطناعي)"
              placeholderTextColor={colors.textMuted}
              textAlign="right"
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceHover, color: colors.text, borderColor: colors.border }]}
              value={editCode}
              onChangeText={setEditCode}
              placeholder="رمز المادة (مثال: CS411)"
              placeholderTextColor={colors.textMuted}
              textAlign="right"
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceHover, color: colors.text, borderColor: colors.border }]}
              value={editInstructor}
              onChangeText={setEditInstructor}
              placeholder="اسم الدكتور / المدرس"
              placeholderTextColor={colors.textMuted}
              textAlign="right"
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceHover, color: colors.text, borderColor: colors.border }]}
              value={editRoom}
              onChangeText={setEditRoom}
              placeholder="القاعة / المبنى"
              placeholderTextColor={colors.textMuted}
              textAlign="right"
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceHover, color: colors.text, borderColor: colors.border }]}
              value={editNotes}
              onChangeText={setEditNotes}
              placeholder="ملاحظات إضافية"
              placeholderTextColor={colors.textMuted}
              textAlign="right"
              multiline
            />

            {/* Color Picker */}
            <Text style={[styles.label, { color: colors.textMuted }]}>اختر لون التمييز:</Text>
            <View style={styles.colorPicker}>
              {COLORS.map((c) => {
                const isSelected = editColor === c
                return (
                  <TouchableOpacity
                    key={c}
                    style={[styles.colorDot, { backgroundColor: c }, isSelected && styles.selectedColorDot]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                      setEditColor(c)
                    }}
                    activeOpacity={0.8}
                  />
                )
              })}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtnSubmit, { backgroundColor: colors.accent }]}
                onPress={handleUpdateSubject}
              >
                <Text style={[styles.modalBtnSubmitText, { color: colors.bg }]}>حفظ التعديلات</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnCancel, { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border }]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={[styles.modalBtnCancelText, { color: colors.text }]}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Note CRUD Modal */}
      <Modal visible={showNoteModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Ionicons name="document-text-outline" size={24} color={colors.accent} style={{ marginLeft: 8 }} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingNoteId !== null ? 'تعديل الملاحظة' : 'إضافة ملاحظة جديدة'}
              </Text>
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceHover, color: colors.text, borderColor: colors.border }]}
              value={noteTitle}
              onChangeText={setNoteTitle}
              placeholder="عنوان الملاحظة (مثال: معادلات الفصل الأول)"
              placeholderTextColor={colors.textMuted}
              textAlign="right"
            />

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceHover,
                  color: colors.text,
                  borderColor: colors.border,
                  height: 120,
                  textAlignVertical: 'top',
                  paddingTop: 12,
                },
              ]}
              value={noteContent}
              onChangeText={setNoteContent}
              placeholder="محتوى الملاحظة الدراسي..."
              placeholderTextColor={colors.textMuted}
              textAlign="right"
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtnSubmit, { backgroundColor: colors.accent }]}
                onPress={handleAddOrUpdateNote}
              >
                <Text style={[styles.modalBtnSubmitText, { color: colors.bg }]}>
                  {editingNoteId !== null ? 'حفظ التعديلات' : 'إضافة'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnCancel, { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border }]}
                onPress={() => {
                  setNoteTitle('')
                  setNoteContent('')
                  setEditingNoteId(null)
                  setShowNoteModal(false)
                }}
              >
                <Text style={[styles.modalBtnCancelText, { color: colors.text }]}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  infoCard: { padding: 20, borderRadius: 16, borderWidth: 1, marginBottom: 24 },
  headerRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '700' },
  colorBadge: { width: 16, height: 16, borderRadius: 8 },
  codeText: { fontSize: 13, marginBottom: 12, textAlign: 'right' },
  metaGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginVertical: 12 },
  metaCard: { flex: 1, minWidth: 90, padding: 10, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  metaLabel: { fontSize: 10, marginTop: 4, fontWeight: '600' },
  metaValue: { fontSize: 12, fontWeight: '700', marginTop: 2, textAlign: 'center' },
  notesText: { fontSize: 13, marginTop: 12, fontStyle: 'italic', textAlign: 'right' },
  sectionHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', flex: 1, textAlign: 'right' },
  actionBtn: { flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1 },
  actionBtnText: { fontSize: 12, fontWeight: '700', marginRight: 4 },
  emptyCard: { padding: 30, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 13, textAlign: 'center', marginTop: 10, lineHeight: 20 },
  
  fileRow: { padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 10, flexDirection: 'row-reverse', alignItems: 'center' },
  fileIconWrapper: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  fileDetails: { flex: 1, alignItems: 'flex-end', marginLeft: 12 },
  fileName: { fontSize: 14, fontWeight: '700' },
  fileSize: { fontSize: 12, marginTop: 2 },
  deleteButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  summarizingLoader: { padding: 30, alignItems: 'center' },
  loaderText: { fontSize: 12, marginTop: 10, textAlign: 'center' },
  accordionContainer: { marginTop: 8 },
  accordionBox: { borderRadius: 14, overflow: 'hidden', marginBottom: 12 },
  accordionHeader: { padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  accordionTitle: { fontSize: 13, fontWeight: '700', textAlign: 'right', flex: 1, paddingRight: 10 },
  accordionBody: { padding: 14, paddingBottom: 16 },
  summaryTextBody: { fontSize: 13, lineHeight: 22, textAlign: 'right' },
  subHeading: { fontSize: 13, fontWeight: '700', marginBottom: 8, textAlign: 'right' },
  bulletRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', marginVertical: 4 },
  bulletPoint: { fontSize: 16, marginLeft: 8, lineHeight: 18 },
  bulletText: { fontSize: 13, flex: 1, textAlign: 'right', lineHeight: 18 },
  quizButton: { height: 48, borderRadius: 12, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  quizButtonText: { color: '#fff', fontSize: 14, fontWeight: '700', marginRight: 8 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { padding: 20, borderRadius: 16, borderWidth: 1 },
  modalHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  modalSubtitle: { fontSize: 12, lineHeight: 18, marginBottom: 16, textAlign: 'right' },
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
  modalBtnSubmit: { flex: 2, height: 48, borderRadius: 10, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center' },
  modalBtnSubmitText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  modalBtnCancel: { flex: 1, height: 48, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  modalBtnCancelText: { fontSize: 13, fontWeight: '700' },
  crudButtonsRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginTop: 16,
    width: '100%',
  },
  crudBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  crudBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    marginTop: 8,
    marginBottom: 6,
  },
  colorPicker: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColorDot: {
    borderColor: '#ffffff',
  },
  noteRow: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noteDetails: {
    flex: 1,
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  noteTitleText: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  noteContentText: {
    fontSize: 13,
    marginBottom: 6,
    lineHeight: 18,
    textAlign: 'right',
  },
  noteDateText: {
    fontSize: 11,
  },
  noteActions: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export default SubjectDetailsScreen
