import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native'
import { useTheme } from '../theme/ThemeContext'
import { Card } from '../components/Card'
import { getCourses, createCourse, updateCourse, deleteCourse } from '../api/endpoints'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'

const CATEGORIES = ['general', 'programming', 'ai', 'math', 'language']

const CoursesScreen: React.FC = () => {
  const { colors } = useTheme()
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Modals visibility
  const [addModalVisible, setAddModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)

  // Form states
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('general')
  const [difficulty, setDifficulty] = useState(1)
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null)

  const fetchCourses = async () => {
    try {
      const data = await getCourses()
      setCourses(Array.isArray(data) ? data : data?.courses || [])
    } catch {
      // Offline mock data if fetch fails
      setCourses([
        { id: '1', title: 'خوارزميات الذكاء الاصطناعي', description: 'مسار دراسي يغطي خوارزميات الذكاء الاصطناعي الأساسية والبحث والتحسين.', category: 'ai', difficulty: 3, modules: [] },
        { id: '2', title: 'أساسيات لغة بايثون', description: 'تعلم البرمجة بلغة بايثون من الصفر وحتى المفاهيم المتقدمة.', category: 'programming', difficulty: 1, modules: [] }
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  const handleAddCourse = async () => {
    if (!title.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال عنوان المسار.')
      return
    }
    setLoading(true)
    try {
      await createCourse({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        difficulty,
        modules: []
      })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setAddModalVisible(false)
      // Reset form
      setTitle('')
      setDescription('')
      setCategory('general')
      setDifficulty(1)
      await fetchCourses()
      Alert.alert('نجاح', 'تمت إضافة المسار التعليمي بنجاح!')
    } catch (e: any) {
      Alert.alert('خطأ', `فشل إضافة المسار: ${e.message}`)
      setLoading(false)
    }
  }

  const handleOpenEdit = (course: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setEditingCourseId(course.id)
    setTitle(course.title || '')
    setDescription(course.description || '')
    setCategory(course.category || 'general')
    setDifficulty(course.difficulty || 1)
    setEditModalVisible(true)
  }

  const handleUpdateCourse = async () => {
    if (!title.trim() || !editingCourseId) return
    setLoading(true)
    try {
      await updateCourse(editingCourseId, {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        difficulty,
        modules: []
      })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setEditModalVisible(false)
      // Reset form
      setTitle('')
      setDescription('')
      setCategory('general')
      setDifficulty(1)
      setEditingCourseId(null)
      await fetchCourses()
      Alert.alert('نجاح', 'تم تحديث المسار بنجاح!')
    } catch (e: any) {
      Alert.alert('خطأ', `فشل تعديل المسار: ${e.message}`)
      setLoading(false)
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    Alert.alert('حذف المسار', 'هل أنت متأكد من رغبتك في حذف هذا المسار التعليمي؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          setLoading(true)
          try {
            await deleteCourse(courseId)
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            await fetchCourses()
            Alert.alert('نجاح', 'تم حذف المسار بنجاح')
          } catch (e) {
            Alert.alert('خطأ', 'فشل في حذف المسار')
            setLoading(false)
          }
        }
      }
    ])
  }

  if (loading && courses.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>المسارات التعليمية</Text>
        </View>

        {courses.length === 0 ? (
          <Card style={{ borderColor: colors.border }}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>لا توجد مسارات متاحة بعد</Text>
          </Card>
        ) : (
          courses.map((course, i) => (
            <Card key={course.id || i} style={{ borderColor: colors.border, borderRightColor: colors.accent, borderRightWidth: 3, paddingVertical: 14 }}>
              <View style={styles.cardHeader}>
                <Text style={[styles.courseTitle, { color: colors.text, flex: 1 }]}>{course.title || course.name}</Text>
                <View style={styles.actionRow}>
                  <TouchableOpacity onPress={() => handleOpenEdit(course)} style={styles.iconBtn}>
                    <Ionicons name="create-outline" size={18} color={colors.accent} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteCourse(course.id)} style={styles.iconBtn}>
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={[styles.courseDesc, { color: colors.textMuted }]} numberOfLines={2}>
                {course.description || course.desc || 'لا يوجد وصف متاح.'}
              </Text>

              <View style={styles.meta}>
                <View style={styles.metaRow}>
                  <Ionicons name="apps-outline" size={14} color={colors.textMuted} style={{ marginLeft: 4 }} />
                  <Text style={[styles.metaText, { color: colors.textMuted }]}>
                    التصنيف: {course.category || 'عام'}
                  </Text>
                </View>

                <View style={[styles.difficultyBadge, { backgroundColor: colors.surfaceHover }]}>
                  <Text style={[styles.difficultyText, { color: colors.accent }]}>
                    مستوى الصعوبة: {course.difficulty || 1}
                  </Text>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.accent, shadowColor: colors.accent }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
          setTitle('')
          setDescription('')
          setCategory('general')
          setDifficulty(1)
          setAddModalVisible(true)
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color={colors.bg} />
      </TouchableOpacity>

      {/* Add Course Modal */}
      <Modal visible={addModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Ionicons name="add-circle-outline" size={24} color={colors.accent} style={{ marginLeft: 8 }} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>إضافة مسار تعليمي جديد</Text>
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceHover, color: colors.text, borderColor: colors.border }]}
              value={title}
              onChangeText={setTitle}
              placeholder="عنوان المسار * (مثال: تعلم التعلم العميق)"
              placeholderTextColor={colors.textMuted}
              textAlign="right"
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceHover, color: colors.text, borderColor: colors.border }]}
              value={description}
              onChangeText={setDescription}
              placeholder="وصف المسار"
              placeholderTextColor={colors.textMuted}
              textAlign="right"
              multiline
            />

            {/* Category selection */}
            <Text style={[styles.label, { color: colors.textMuted }]}>التصنيف:</Text>
            <View style={styles.categoryPicker}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catChip,
                    {
                      backgroundColor: category === cat ? colors.accent : colors.surfaceHover,
                      borderColor: category === cat ? colors.accent : colors.border,
                    },
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={{ color: category === cat ? '#fff' : colors.text, fontSize: 12 }}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Difficulty rating */}
            <Text style={[styles.label, { color: colors.textMuted }]}>درجة الصعوبة (1-5):</Text>
            <View style={styles.difficultyPicker}>
              {[1, 2, 3, 4, 5].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.diffButton,
                    {
                      backgroundColor: difficulty === num ? colors.accent : colors.surfaceHover,
                      borderColor: difficulty === num ? colors.accent : colors.border,
                    },
                  ]}
                  onPress={() => setDifficulty(num)}
                >
                  <Text style={{ color: difficulty === num ? '#fff' : colors.text, fontWeight: '700' }}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.accent }]} onPress={handleAddCourse}>
                <Text style={[styles.modalBtnText, { color: colors.bg }]}>إضافة</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border }]} onPress={() => setAddModalVisible(false)}>
                <Text style={[styles.modalBtnText, { color: colors.text }]}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Course Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Ionicons name="create-outline" size={24} color={colors.accent} style={{ marginLeft: 8 }} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>تعديل المسار التعليمي</Text>
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceHover, color: colors.text, borderColor: colors.border }]}
              value={title}
              onChangeText={setTitle}
              placeholder="عنوان المسار *"
              placeholderTextColor={colors.textMuted}
              textAlign="right"
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceHover, color: colors.text, borderColor: colors.border }]}
              value={description}
              onChangeText={setDescription}
              placeholder="وصف المسار"
              placeholderTextColor={colors.textMuted}
              textAlign="right"
              multiline
            />

            {/* Category selection */}
            <Text style={[styles.label, { color: colors.textMuted }]}>التصنيف:</Text>
            <View style={styles.categoryPicker}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catChip,
                    {
                      backgroundColor: category === cat ? colors.accent : colors.surfaceHover,
                      borderColor: category === cat ? colors.accent : colors.border,
                    },
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={{ color: category === cat ? '#fff' : colors.text, fontSize: 12 }}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Difficulty rating */}
            <Text style={[styles.label, { color: colors.textMuted }]}>درجة الصعوبة (1-5):</Text>
            <View style={styles.difficultyPicker}>
              {[1, 2, 3, 4, 5].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.diffButton,
                    {
                      backgroundColor: difficulty === num ? colors.accent : colors.surfaceHover,
                      borderColor: difficulty === num ? colors.accent : colors.border,
                    },
                  ]}
                  onPress={() => setDifficulty(num)}
                >
                  <Text style={{ color: difficulty === num ? '#fff' : colors.text, fontWeight: '700' }}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.accent }]} onPress={handleUpdateCourse}>
                <Text style={[styles.modalBtnText, { color: colors.bg }]}>حفظ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border }]} onPress={() => setEditModalVisible(false)}>
                <Text style={[styles.modalBtnText, { color: colors.text }]}>إلغاء</Text>
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
  content: { padding: 16, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'right' },
  emptyText: { fontSize: 16, textAlign: 'center', padding: 20 },
  cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  courseTitle: { fontSize: 18, fontWeight: '700', textAlign: 'right' },
  actionRow: { flexDirection: 'row', gap: 10 },
  iconBtn: { padding: 4 },
  courseDesc: { fontSize: 14, lineHeight: 22, marginBottom: 12, textAlign: 'right' },
  meta: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  metaRow: { flexDirection: 'row-reverse', alignItems: 'center' },
  metaText: { fontSize: 13 },
  difficultyBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
  difficultyText: { fontSize: 12, fontWeight: '700' },
  fab: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 5,
    zIndex: 99,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { padding: 24, borderRadius: 24, borderWidth: 1.5, alignItems: 'stretch' },
  modalHeader: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  input: { borderRadius: 10, padding: 12, borderWidth: 1.5, fontSize: 14, marginBottom: 12, textAlign: 'right' },
  label: { fontSize: 13, fontWeight: '700', textAlign: 'right', marginTop: 8, marginBottom: 6 },
  categoryPicker: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  catChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1 },
  difficultyPicker: { flexDirection: 'row-reverse', justifyContent: 'space-between', gap: 6, marginBottom: 20 },
  diffButton: { flex: 1, height: 38, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  modalButtons: { flexDirection: 'row-reverse', gap: 12 },
  modalBtn: { flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalBtnText: { fontSize: 14, fontWeight: '700' },
})

export default CoursesScreen
