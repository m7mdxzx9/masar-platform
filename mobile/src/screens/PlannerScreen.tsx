import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native'
import { useTheme } from '../theme/ThemeContext'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '../utils/asyncStorage'
import { getGoals, createGoal, updateGoal, deleteGoal } from '../api/endpoints'

const { width: screenWidth } = Dimensions.get('window')

interface Task {
  id: string
  title: string
  status: 'todo' | 'in_progress' | 'done'
}

interface ScheduleItem {
  id: string
  title: string
  time: string
  day: number // 0 = Sun, 1 = Mon ...
  room?: string
}

export const PlannerScreen: React.FC = () => {
  const { colors } = useTheme()
  const [activeSubTab, setActiveSubTab] = useState<'schedule' | 'goals' | 'kanban'>('schedule')
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay())

  // State Lists
  const [schedules, setSchedules] = useState<ScheduleItem[]>([])
  const [goals, setGoals] = useState<any[]>([])
  const [tasks, setTasks] = useState<Task[]>([])

  const [loading, setLoading] = useState(false)

  // Modals visibility
  const [showAddSchedule, setShowAddSchedule] = useState(false)
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [showAddTask, setShowAddTask] = useState(false)

  // Form Inputs
  const [schedTitle, setSchedTitle] = useState('')
  const [schedTime, setSchedTime] = useState('')
  const [schedRoom, setSchedRoom] = useState('')

  const [goalTitle, setGoalTitle] = useState('')
  const [goalTarget, setGoalTarget] = useState('5')

  const [taskTitle, setTaskTitle] = useState('')

  const daysOfWeek = [
    { label: 'الأحد', val: 0, subLabel: 'Sun' },
    { label: 'الإثنين', val: 1, subLabel: 'Mon' },
    { label: 'الثلاثاء', val: 2, subLabel: 'Tue' },
    { label: 'الأربعاء', val: 3, subLabel: 'Wed' },
    { label: 'الخميس', val: 4, subLabel: 'Thu' },
    { label: 'الجمعة', val: 5, subLabel: 'Fri' },
    { label: 'السبت', val: 6, subLabel: 'Sat' },
  ]

  useEffect(() => {
    loadLocalSchedules()
    fetchBackendGoals()
    loadLocalTasks()
  }, [])

  // Schedules (AsyncStorage)
  const loadLocalSchedules = async () => {
    try {
      const data = await AsyncStorage.getItem('masar_local_schedules')
      if (data) setSchedules(JSON.parse(data))
    } catch (e) {
      console.log('Error loading schedules', e)
    }
  }

  const saveLocalSchedules = async (items: ScheduleItem[]) => {
    try {
      await AsyncStorage.setItem('masar_local_schedules', JSON.stringify(items))
      setSchedules(items)
    } catch (e) {
      console.log('Error saving schedules', e)
    }
  }

  const handleAddSchedule = async () => {
    if (!schedTitle || !schedTime) {
      Alert.alert('تنبيه', 'يرجى إدخال عنوان الحصة ووقتها')
      return
    }
    const newItem: ScheduleItem = {
      id: Date.now().toString(),
      title: schedTitle,
      time: schedTime,
      day: selectedDay,
      room: schedRoom,
    }
    const updated = [...schedules, newItem]
    await saveLocalSchedules(updated)
    setSchedTitle('')
    setSchedTime('')
    setSchedRoom('')
    setShowAddSchedule(false)
  }

  const handleDeleteSchedule = async (id: string) => {
    const updated = schedules.filter((s) => s.id !== id)
    await saveLocalSchedules(updated)
  }

  // Goals (Backend API)
  const fetchBackendGoals = async () => {
    setLoading(true)
    try {
      const data = await getGoals()
      setGoals(data || [])
    } catch (e) {
      console.log('Error fetching goals', e)
    } finally {
      setLoading(false)
    }
  }

  const handleAddGoal = async () => {
    if (!goalTitle) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم الهدف')
      return
    }
    try {
      setLoading(true)
      await createGoal({
        title: goalTitle,
        description: 'هدف شخصي',
        target_value: parseInt(goalTarget) || 5,
        current_value: 0,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      setGoalTitle('')
      setGoalTarget('5')
      setShowAddGoal(false)
      fetchBackendGoals()
    } catch (e) {
      Alert.alert('خطأ', 'فشل في حفظ الهدف')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleGoalProgress = async (goal: any) => {
    try {
      const newProgress = Math.min((goal.current_value || 0) + 1, goal.target_value || 5)
      await updateGoal(goal.id, {
        current_value: newProgress,
      })
      fetchBackendGoals()
    } catch (e) {
      console.log(e)
    }
  }

  const handleDeleteGoal = async (id: string) => {
    try {
      await deleteGoal(id)
      fetchBackendGoals()
    } catch (e) {
      console.log(e)
    }
  }

  // Kanban Tasks (AsyncStorage)
  const loadLocalTasks = async () => {
    try {
      const data = await AsyncStorage.getItem('masar_local_tasks')
      if (data) setTasks(JSON.parse(data))
    } catch (e) {
      console.log(e)
    }
  }

  const saveLocalTasks = async (items: Task[]) => {
    try {
      await AsyncStorage.setItem('masar_local_tasks', JSON.stringify(items))
      setTasks(items)
    } catch (e) {
      console.log(e)
    }
  }

  const handleAddTask = async () => {
    if (!taskTitle) return
    const newTask: Task = {
      id: Date.now().toString(),
      title: taskTitle,
      status: 'todo',
    }
    const updated = [...tasks, newTask]
    await saveLocalTasks(updated)
    setTaskTitle('')
    setShowAddTask(false)
  }

  const handleMoveTask = async (id: string, nextStatus: 'todo' | 'in_progress' | 'done') => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, status: nextStatus } : t))
    await saveLocalTasks(updated)
  }

  const handleDeleteTask = async (id: string) => {
    const updated = tasks.filter((t) => t.id !== id)
    await saveLocalTasks(updated)
  }

  // Filtered lists
  const daySchedules = schedules.filter((s) => s.day === selectedDay)

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Weekly Date Strip */}
      <View style={[styles.dateStrip, { borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
          {daysOfWeek.map((day) => {
            const isSelected = selectedDay === day.val
            return (
              <TouchableOpacity
                key={day.val}
                style={[
                  styles.dayCard,
                  {
                    backgroundColor: isSelected ? colors.accentGlow : colors.surface,
                    borderColor: isSelected ? colors.accent : colors.border,
                  },
                  isSelected && styles.dayCardActiveGlow,
                ]}
                onPress={() => setSelectedDay(day.val)}
              >
                <Text style={[styles.dayLabel, { color: isSelected ? colors.accent : colors.text }]}>
                  {day.label}
                </Text>
                <Text style={[styles.daySubLabel, { color: isSelected ? colors.accent : colors.textMuted }]}>
                  {day.subLabel}
                </Text>
                {isSelected && <View style={[styles.activeDot, { backgroundColor: colors.accent }]} />}
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* Sub Tabs */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tabButton, activeSubTab === 'schedule' && { borderBottomColor: colors.accent }]}
          onPress={() => setActiveSubTab('schedule')}
        >
          <Text style={[styles.tabText, { color: activeSubTab === 'schedule' ? colors.accent : colors.textMuted }]}>
            الجدول الدراسي
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeSubTab === 'goals' && { borderBottomColor: colors.accent }]}
          onPress={() => setActiveSubTab('goals')}
        >
          <Text style={[styles.tabText, { color: activeSubTab === 'goals' ? colors.accent : colors.textMuted }]}>
            الأهداف التعليمية
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeSubTab === 'kanban' && { borderBottomColor: colors.accent }]}
          onPress={() => setActiveSubTab('kanban')}
        >
          <Text style={[styles.tabText, { color: activeSubTab === 'kanban' ? colors.accent : colors.textMuted }]}>
            لوحة المهام (Kanban)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Contents */}
      {activeSubTab === 'schedule' && (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              حصص يوم {daysOfWeek.find((d) => d.val === selectedDay)?.label}
            </Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.accentGlow, borderColor: colors.accent }]}
              onPress={() => setShowAddSchedule(true)}
            >
              <Ionicons name="add" size={16} color={colors.accent} />
              <Text style={[styles.addButtonText, { color: colors.accent }]}>إضافة حصة</Text>
            </TouchableOpacity>
          </View>

          {daySchedules.length === 0 ? (
            <View style={styles.emptyView}>
              <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>لا توجد حصص مجدولة لهذا اليوم</Text>
            </View>
          ) : (
            daySchedules.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.itemCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRightColor: colors.accent,
                  },
                ]}
              >
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemTitle, { color: colors.text }]}>{item.title}</Text>
                  <View style={styles.itemMeta}>
                    <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                    <Text style={[styles.itemMetaText, { color: colors.textMuted }]}>{item.time}</Text>
                    {item.room && (
                      <>
                        <Ionicons name="location-outline" size={12} color={colors.textMuted} style={{ marginRight: 8 }} />
                        <Text style={[styles.itemMetaText, { color: colors.textMuted }]}>{item.room}</Text>
                      </>
                    )}
                  </View>
                </View>
                <TouchableOpacity onPress={() => handleDeleteSchedule(item.id)} style={styles.deleteIconButton}>
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {activeSubTab === 'goals' && (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>أهدافي الحالية</Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.accentGlow, borderColor: colors.accent }]}
              onPress={() => setShowAddGoal(true)}
            >
              <Ionicons name="add" size={16} color={colors.accent} />
              <Text style={[styles.addButtonText, { color: colors.accent }]}>إضافة هدف</Text>
            </TouchableOpacity>
          </View>

          {loading && goals.length === 0 ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
          ) : goals.length === 0 ? (
            <View style={styles.emptyView}>
              <Ionicons name="flag-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>لم تقم بإضافة أي أهداف حتى الآن</Text>
            </View>
          ) : (
            goals.map((item) => {
              const target = item.target_value || 5
              const current = item.current_value || 0
              const percent = Math.round((current / target) * 100)
              return (
                <View
                  key={item.id}
                  style={[
                    styles.goalCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      borderRightColor: percent >= 100 ? colors.success : colors.secondary,
                    },
                  ]}
                >
                  <View style={styles.goalHeaderRow}>
                    <Text style={[styles.itemTitle, { color: colors.text, flex: 1 }]}>{item.title}</Text>
                    <TouchableOpacity onPress={() => handleDeleteGoal(item.id)} style={styles.deleteIconButton}>
                      <Ionicons name="trash-outline" size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.progressContainer}>
                    <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceHover }]}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            backgroundColor: percent >= 100 ? colors.success : colors.accent,
                            width: `${percent}%`,
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.progressLabelRow}>
                      <Text style={[styles.progressText, { color: colors.textMuted }]}>
                        {current} من {target} خطوات
                      </Text>
                      <Text
                        style={[
                          styles.progressPercent,
                          { color: percent >= 100 ? colors.success : colors.accent },
                        ]}
                      >
                        {percent}%
                      </Text>
                    </View>
                  </View>

                  {percent < 100 && (
                    <TouchableOpacity
                      style={[
                        styles.progressIncrementBtn,
                        { backgroundColor: colors.accentGlow, borderColor: colors.accent },
                      ]}
                      onPress={() => handleToggleGoalProgress(item)}
                    >
                      <Ionicons name="sparkles-outline" size={14} color={colors.accent} style={{ marginLeft: 6 }} />
                      <Text style={[styles.progressIncrementText, { color: colors.accent }]}>
                        تسجيل خطوة جديدة
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )
            })
          )}
        </ScrollView>
      )}

      {activeSubTab === 'kanban' && (
        <View style={{ flex: 1 }}>
          <View style={[styles.sectionHeader, { paddingHorizontal: 16, marginTop: 12 }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>لوحة المهام الشخصية</Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.accentGlow, borderColor: colors.accent }]}
              onPress={() => setShowAddTask(true)}
            >
              <Ionicons name="add" size={16} color={colors.accent} />
              <Text style={[styles.addButtonText, { color: colors.accent }]}>إضافة مهمة</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.kanbanScroll}
            style={{ flex: 1 }}
          >
            {['todo', 'in_progress', 'done'].map((statusKey) => {
              const columnTitle =
                statusKey === 'todo'
                  ? 'قيد التنفيذ لاحقاً'
                  : statusKey === 'in_progress'
                  ? 'قيد العمل حالياً'
                  : 'المنجزة'
              const columnIcon =
                statusKey === 'todo'
                  ? 'hourglass-outline'
                  : statusKey === 'in_progress'
                  ? 'trending-up-outline'
                  : 'checkmark-circle-outline'
              const colTasks = tasks.filter((t) => t.status === statusKey)
              const colColor =
                statusKey === 'todo'
                  ? colors.textMuted
                  : statusKey === 'in_progress'
                  ? colors.accent
                  : colors.success

              return (
                <View
                  key={statusKey}
                  style={[
                    styles.kanbanColumn,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  <View style={[styles.columnHeader, { borderBottomColor: colors.border }]}>
                    <View style={styles.columnTitleBox}>
                      <Ionicons name={columnIcon as any} size={16} color={colColor} style={{ marginLeft: 6 }} />
                      <Text style={[styles.columnHeaderText, { color: colors.text }]}>
                        {columnTitle}
                      </Text>
                    </View>
                    <View style={[styles.countBadge, { backgroundColor: colors.surfaceHover }]}>
                      <Text style={[styles.countBadgeText, { color: colors.text }]}>
                        {colTasks.length}
                      </Text>
                    </View>
                  </View>

                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.columnTasksScroll}
                    style={{ flex: 1 }}
                  >
                    {colTasks.length === 0 ? (
                      <Text style={[styles.emptyColumnText, { color: colors.textMuted }]}>
                        لا توجد مهام في هذا العمود
                      </Text>
                    ) : (
                      colTasks.map((t) => (
                        <View
                          key={t.id}
                          style={[
                            styles.taskCard,
                            { backgroundColor: colors.bg, borderColor: colors.border },
                          ]}
                        >
                          <Text style={[styles.taskCardTitle, { color: colors.text }]}>{t.title}</Text>
                          <View style={styles.taskActions}>
                            {statusKey !== 'todo' && (
                              <TouchableOpacity
                                style={[styles.taskActionBtn, { backgroundColor: colors.surfaceHover }]}
                                onPress={() =>
                                  handleMoveTask(t.id, statusKey === 'done' ? 'in_progress' : 'todo')
                                }
                              >
                                <Ionicons name="arrow-forward" size={14} color={colors.text} />
                              </TouchableOpacity>
                            )}
                            {statusKey !== 'done' && (
                              <TouchableOpacity
                                style={[styles.taskActionBtn, { backgroundColor: colors.accentGlow }]}
                                onPress={() =>
                                  handleMoveTask(t.id, statusKey === 'todo' ? 'in_progress' : 'done')
                                }
                              >
                                <Ionicons name="arrow-back" size={14} color={colors.accent} />
                              </TouchableOpacity>
                            )}
                            <TouchableOpacity
                              style={styles.taskDeleteBtn}
                              onPress={() => handleDeleteTask(t.id)}
                            >
                              <Ionicons name="trash-outline" size={14} color={colors.error} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))
                    )}
                  </ScrollView>
                </View>
              )
            })}
          </ScrollView>
        </View>
      )}

      {/* Add Schedule Modal */}
      <Modal visible={showAddSchedule} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>إضافة حصة دراسية جديدة</Text>
            <TextInput
              placeholder="اسم المادة / الحصة"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              value={schedTitle}
              onChangeText={setSchedTitle}
            />
            <TextInput
              placeholder="الوقت (مثال: 10:00 ص - 11:30 ص)"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              value={schedTime}
              onChangeText={setSchedTime}
            />
            <TextInput
              placeholder="القاعة / الفصل الدراسي (اختياري)"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              value={schedRoom}
              onChangeText={setSchedRoom}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.btn, { backgroundColor: colors.accent }]} onPress={handleAddSchedule}>
                <Text style={styles.btnText}>إضافة</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { backgroundColor: colors.surfaceHover }]} onPress={() => setShowAddSchedule(false)}>
                <Text style={[styles.btnText, { color: colors.text }]}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Goal Modal */}
      <Modal visible={showAddGoal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>إضافة هدف تعليمي جديد</Text>
            <TextInput
              placeholder="ما الذي تريد تحقيقه؟ (مثال: دراسة 5 ساعات)"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              value={goalTitle}
              onChangeText={setGoalTitle}
            />
            <TextInput
              placeholder="القيمة المستهدفة للتقدم (مثال: 5)"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              value={goalTarget}
              onChangeText={setGoalTarget}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.btn, { backgroundColor: colors.accent }]} onPress={handleAddGoal}>
                <Text style={styles.btnText}>إضافة</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { backgroundColor: colors.surfaceHover }]} onPress={() => setShowAddGoal(false)}>
                <Text style={[styles.btnText, { color: colors.text }]}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Task Modal */}
      <Modal visible={showAddTask} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>إضافة مهمة جديدة</Text>
            <TextInput
              placeholder="عنوان المهمة"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              value={taskTitle}
              onChangeText={setTaskTitle}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.btn, { backgroundColor: colors.accent }]} onPress={handleAddTask}>
                <Text style={styles.btnText}>إضافة</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { backgroundColor: colors.surfaceHover }]} onPress={() => setShowAddTask(false)}>
                <Text style={[styles.btnText, { color: colors.text }]}>إلغاء</Text>
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
  dateStrip: { borderBottomWidth: 1, paddingVertical: 12 },
  dateScroll: { paddingHorizontal: 16, flexDirection: 'row-reverse' }, // RTL Layout Flow
  dayCard: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginHorizontal: 5,
    alignItems: 'center',
    minWidth: 70,
    position: 'relative',
  },
  dayCardActiveGlow: {
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  dayLabel: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  daySubLabel: { fontSize: 10, fontWeight: '500' },
  activeDot: {
    position: 'absolute',
    bottom: 4,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  tabBar: { flexDirection: 'row-reverse', borderBottomWidth: 1 }, // RTL tabs
  tabButton: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 13, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 40 },
  sectionHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  addButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  addButtonText: { fontSize: 12, fontWeight: '700', marginRight: 4 },
  emptyView: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 14, marginTop: 12, textAlign: 'center' },
  itemCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderRightWidth: 4,
    marginBottom: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemInfo: { flex: 1, marginRight: 8 },
  itemTitle: { fontSize: 15, fontWeight: '700', marginBottom: 6, textAlign: 'right' },
  itemMeta: { flexDirection: 'row-reverse', alignItems: 'center' },
  itemMetaText: { fontSize: 12, marginRight: 4 },
  deleteIconButton: { padding: 4 },

  // Goal Tracker Card
  goalCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderRightWidth: 4,
    marginBottom: 14,
    alignItems: 'stretch',
  },
  goalHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressContainer: { width: '100%', marginBottom: 12 },
  progressBarBg: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressBarFill: { height: '100%', borderRadius: 4 },
  progressLabelRow: { flexDirection: 'row-reverse', justifyContent: 'space-between' },
  progressText: { fontSize: 11 },
  progressPercent: { fontSize: 12, fontWeight: '700' },
  progressIncrementBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexDirection: 'row-reverse',
  },
  progressIncrementText: { fontSize: 12, fontWeight: '700' },

  // Kanban Horizontal Board
  kanbanScroll: { paddingHorizontal: 16, paddingBottom: 24, gap: 14, flexDirection: 'row-reverse' },
  kanbanColumn: {
    width: screenWidth * 0.82,
    borderRadius: 16,
    borderWidth: 1,
    maxHeight: '90%',
    padding: 12,
  },
  columnHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  columnTitleBox: { flexDirection: 'row-reverse', alignItems: 'center' },
  columnHeaderText: { fontSize: 14, fontWeight: '700' },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  countBadgeText: { fontSize: 11, fontWeight: '700' },
  columnTasksScroll: { gap: 10 },
  emptyColumnText: { fontSize: 12, textAlign: 'center', marginVertical: 24 },
  taskCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskCardTitle: { fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'right' },
  taskActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  taskActionBtn: { padding: 6, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  taskDeleteBtn: { padding: 6 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { padding: 20, borderRadius: 16, borderWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, textAlign: 'right' },
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
  btn: { flex: 1, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
})

export default PlannerScreen
