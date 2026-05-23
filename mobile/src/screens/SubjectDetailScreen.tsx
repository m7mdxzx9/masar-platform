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

interface SubjectDetailScreenProps {
  subjectId: number
}

export const SubjectDetailScreen: React.FC<SubjectDetailScreenProps> = ({ subjectId }) => {
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

  // Upload simulation states
  const [mockFileName, setMockFileName] = useState('')
  const [mockFileContent, setMockFileContent] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)

  useEffect(() => {
    fetchDetails()
  }, [subjectId])

  const fetchDetails = async () => {
    setLoading(true)
    try {
      const data = await getSubjectDetail(subjectId.toString())
      setSubject(data)
      setFiles(data.files || [])
    } catch (e) {
      console.log('Error details', e)
      Alert.alert('خطأ', 'فشل في تحميل تفاصيل المادة')
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
            setFiles((prev) => prev.filter((f) => f.id !== fileId))
            Alert.alert('نجاح', 'تم حذف الملف')
          } catch (e) {
            Alert.alert('خطأ', 'فشل حذف الملف')
          }
        },
      },
    ])
  }

  const handleSimulatedUpload = async () => {
    if (!mockFileName || !mockFileContent) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم الملف ومحتواه')
      return
    }

    try {
      setLoading(true)
      setShowUploadModal(false)

      const formData = new FormData()
      const blob = {
        uri: 'data:text/plain;base64,' + btoa(unescape(encodeURIComponent(mockFileContent))),
        type: 'text/plain',
        name: mockFileName.endsWith('.txt') ? mockFileName : `${mockFileName}.txt`,
      }
      formData.append('file', blob as any)

      await uploadSubjectFile(subjectId.toString(), formData)
      setMockFileName('')
      setMockFileContent('')
      fetchDetails()
      Alert.alert('نجاح', 'تم رفع الملف وفهرسته بالذكاء الاصطناعي بنجاح!')
    } catch (e) {
      console.log(e)
      Alert.alert('خطأ', 'فشل في رفع الملف بالكامل')
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
      {/* Subject Information Card */}
      <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
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
      </View>

      {/* Files Section */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>الملفات والمستندات المرفقة ({files.length})</Text>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.accent + '15', borderColor: colors.accent }]}
          onPress={() => setShowUploadModal(true)}
        >
          <Ionicons name="cloud-upload-outline" size={16} color={colors.accent} />
          <Text style={[styles.actionBtnText, { color: colors.accent }]}>رفع مستند</Text>
        </TouchableOpacity>
      </View>

      {files.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="document-text-outline" size={32} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>لا توجد ملفات مرفقة بالمادة حالياً. ابدأ برفع ملفاتك الدراسية كملخصات ومحاضرات.</Text>
        </View>
      ) : (
        files.map((file) => (
          <View key={file.id} style={[styles.fileRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.fileIconWrapper, { backgroundColor: colors.accent + '15' }]}>
              <Ionicons name="document-text" size={22} color={colors.accent} />
            </View>
            <View style={styles.fileDetails}>
              <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>
                {file.original_name}
              </Text>
              <Text style={[styles.fileSize, { color: colors.textMuted }]}>
                {Math.round(file.file_size / 1024)} كيلوبايت
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => handleDeleteFile(file.id)}
              style={[styles.deleteButton, { backgroundColor: colors.error + '15' }]}
            >
              <Ionicons name="trash" size={16} color={colors.error} />
            </TouchableOpacity>
          </View>
        ))
      )}

      {/* AI Summary Accordion Section */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>الملخص الذكي (AI Accordion Summary)</Text>
        {!summary && !summarizing && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.accent + '15', borderColor: colors.accent }]}
            onPress={handleGenerateSummary}
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
              onPress={() => setShowOverallSummary(!showOverallSummary)}
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
                    onPress={() => setOpenFileSummaryIndex(isOpen ? null : index)}
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
            onPress={() => navigation.push('Quiz', { topic: subject.name, fileContent: summary?.overall_summary })}
          >
            <Ionicons name="school" size={20} color="#fff" style={{ marginLeft: 8 }} />
            <Text style={styles.quizButtonText}>Start Quiz from summaries</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Simulated Upload Modal */}
      <Modal visible={showUploadModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>رفع مستند دراسي جديد</Text>
              <Ionicons name="cloud-upload-outline" size={24} color={colors.accent} />
            </View>
            
            <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
              قم بمحاكاة رفع وتلخيص المستند بالذكاء الاصطناعي بكتابة عنوان للمستند ومحتواه النصي.
            </Text>

            <TextInput
              placeholder="اسم الملف (مثال: محاضرة_1)"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
              value={mockFileName}
              onChangeText={setMockFileName}
            />
            <TextInput
              placeholder="اكتب المحتوى الدراسي للمحاضرة أو التلخيص هنا..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={6}
              style={[
                styles.input, 
                { 
                  color: colors.text, 
                  borderColor: colors.border, 
                  backgroundColor: colors.bg, 
                  height: 120, 
                  textAlignVertical: 'top',
                  paddingTop: 12
                }
              ]}
              value={mockFileContent}
              onChangeText={setMockFileContent}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtnSubmit, { backgroundColor: colors.accent }]} onPress={handleSimulatedUpload}>
                <Ionicons name="sparkles" size={14} color="#fff" style={{ marginLeft: 6 }} />
                <Text style={styles.modalBtnSubmitText}>رفع وفهرسة</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalBtnCancel, { backgroundColor: colors.surfaceHover, borderColor: colors.border }]} 
                onPress={() => setShowUploadModal(false)}
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
})

export default SubjectDetailScreen
