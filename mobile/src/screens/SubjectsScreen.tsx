import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert } from 'react-native'
import { useTheme } from '../theme/ThemeContext'
import { syncManager } from '../services/syncManager'
import { useNavigation } from '../navigation/navigation'
import { Ionicons } from '@expo/vector-icons'
import { FlashList } from '@shopify/flash-list'
import Animated, { FadeInDown, FadeOutUp, LinearTransition } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'

const COLORS = ['#6366f1', '#0d9488', '#8b5cf6', '#f43f5e', '#d97706', '#10b981']

const SubjectsScreen: React.FC = () => {
  const { colors } = useTheme()
  const navigation = useNavigation()
  const [subjects, setSubjects] = useState<any[]>(syncManager.getSubjects())
  const [loading, setLoading] = useState(false)

  // Form states
  const [modalVisible, setModalVisible] = useState(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [instructor, setInstructor] = useState('')
  const [room, setRoom] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedColor, setSelectedColor] = useState('#6366f1')

  useEffect(() => {
    setSubjects(syncManager.getSubjects())
    const unsubscribe = syncManager.subscribe(() => {
      setSubjects(syncManager.getSubjects())
    })
    syncManager.pull()
    return unsubscribe
  }, [])

  const handleAddSubject = async () => {
    if (!name.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم المادة الدراسي.')
      return
    }
    try {
      await syncManager.addSubject(
        name.trim(),
        code.trim() || undefined,
        instructor.trim() || undefined,
        room.trim() || undefined,
        selectedColor,
        notes.trim() || undefined
      )
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setModalVisible(false)
      // Reset form
      setName('')
      setCode('')
      setInstructor('')
      setRoom('')
      setNotes('')
      setSelectedColor('#6366f1')
    } catch (e: any) {
      Alert.alert('خطأ', `فشل إضافة المادة: ${e.message}`)
    }
  }

  const renderSubjectItem = ({ item, index }: { item: any; index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(300)}
      exiting={FadeOutUp}
      layout={LinearTransition}
    >
      <TouchableOpacity
        style={[styles.cardContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          navigation.push('SubjectDetails', { subjectId: item.id })
        }}
        activeOpacity={0.7}
      >
        {/* Stripe on the right side for RTL layout */}
        <View style={[styles.stripe, { backgroundColor: item.color || colors.accent }]} />
        
        {/* Card contents */}
        <View style={styles.cardContent}>
          <Text style={[styles.subjectName, { color: colors.text }]}>
            {item.name || item.title}
          </Text>
          {item.code ? (
            <Text style={[styles.subjectCode, { color: colors.accent }]}>
              {item.code}
            </Text>
          ) : null}
          {item.instructor ? (
            <Text style={[styles.subjectInstructor, { color: colors.textMuted }]}>
              المدرس: {item.instructor}
            </Text>
          ) : null}
          <View style={styles.cardFooter}>
            <Text style={[styles.fileCount, { color: colors.accent }]}>
              {item.files_count || 0} ملف
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        <Text style={[styles.title, { color: colors.text }]}>المواد الدراسية</Text>
      </View>
      
      <FlashList
        data={subjects}
        renderItem={renderSubjectItem}
        estimatedItemSize={110}
        ListEmptyComponent={
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="book-outline" size={48} color={colors.textMuted} style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyText, { color: colors.text, marginBottom: 4 }]}>لا توجد مواد متاحة بعد</Text>
            <Text style={[styles.emptySubText, { color: colors.textMuted, marginBottom: 16 }]}>أضف موادك الدراسية للبدء في تنظيم ملفاتك وملاحظاتك</Text>
            <TouchableOpacity
              style={[styles.emptyAddBtn, { backgroundColor: colors.accent }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                setModalVisible(true)
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.bg} style={{ marginLeft: 6 }} />
              <Text style={[styles.emptyAddBtnText, { color: colors.bg }]}>إضافة مادة جديدة</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={styles.content}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.accent, shadowColor: colors.accent }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
          setModalVisible(true)
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color={colors.bg} />
      </TouchableOpacity>

      {/* Add Subject Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Ionicons name="book-outline" size={24} color={colors.accent} style={{ marginLeft: 8 }} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>إضافة مادة دراسية جديدة</Text>
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceHover, color: colors.text, borderColor: colors.border }]}
              value={name}
              onChangeText={setName}
              placeholder="اسم المادة الدراسي * (مثال: الذكاء الاصطناعي)"
              placeholderTextColor={colors.textMuted}
              textAlign="right"
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceHover, color: colors.text, borderColor: colors.border }]}
              value={code}
              onChangeText={setCode}
              placeholder="رمز المادة (مثال: CS411)"
              placeholderTextColor={colors.textMuted}
              textAlign="right"
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceHover, color: colors.text, borderColor: colors.border }]}
              value={instructor}
              onChangeText={setInstructor}
              placeholder="اسم الدكتور / المدرس"
              placeholderTextColor={colors.textMuted}
              textAlign="right"
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceHover, color: colors.text, borderColor: colors.border }]}
              value={room}
              onChangeText={setRoom}
              placeholder="القاعة / المبنى"
              placeholderTextColor={colors.textMuted}
              textAlign="right"
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceHover, color: colors.text, borderColor: colors.border }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="ملاحظات إضافية"
              placeholderTextColor={colors.textMuted}
              textAlign="right"
              multiline
            />

            {/* Color Picker */}
            <Text style={[styles.label, { color: colors.textMuted }]}>اختر لون التمييز:</Text>
            <View style={styles.colorPicker}>
              {COLORS.map((c) => {
                const isSelected = selectedColor === c
                return (
                  <TouchableOpacity
                    key={c}
                    style={[styles.colorDot, { backgroundColor: c }, isSelected && styles.selectedColorDot]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                      setSelectedColor(c)
                    }}
                    activeOpacity={0.8}
                  />
                )
              })}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.accent }]}
                onPress={handleAddSubject}
              >
                <Text style={[styles.modalBtnText, { color: colors.bg }]}>إضافة</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border }]}
                onPress={() => setModalVisible(false)}
              >
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
  content: { padding: 16, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 12, textAlign: 'right' },
  emptyCard: {
    padding: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  emptyText: { fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  emptySubText: { fontSize: 13, textAlign: 'center', opacity: 0.8 },
  cardContainer: {
    flexDirection: 'row-reverse',
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  stripe: {
    width: 6,
    alignSelf: 'stretch',
  },
  cardContent: {
    flex: 1,
    padding: 16,
    alignItems: 'flex-end',
  },
  subjectName: { fontSize: 18, fontWeight: '700', marginBottom: 4, textAlign: 'right' },
  subjectCode: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  subjectInstructor: { fontSize: 13, marginBottom: 8, textAlign: 'right' },
  cardFooter: {
    marginTop: 4,
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
    width: '100%',
  },
  fileCount: { fontSize: 13, fontWeight: '600' },
  
  // FAB styles
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
  emptyAddBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    elevation: 3,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    marginTop: 8,
  },
  emptyAddBtnText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Tajawal',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'stretch',
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  input: {
    borderRadius: 10,
    padding: 12,
    borderWidth: 1.5,
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'right',
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
  modalButtons: {
    flexDirection: 'row-reverse',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
})

export default SubjectsScreen
