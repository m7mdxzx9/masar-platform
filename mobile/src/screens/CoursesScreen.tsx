import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useTheme } from '../theme/ThemeContext'
import { Card } from '../components/Card'
import { getCourses } from '../api/endpoints'
import { Ionicons } from '@expo/vector-icons'

const CoursesScreen: React.FC = () => {
  const { colors } = useTheme()
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCourses()
      .then((data) => setCourses(Array.isArray(data) ? data : data?.courses || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    )
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>المسارات التعليمية</Text>
      
      {courses.length === 0 ? (
        <Card style={{ borderColor: colors.border }}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>لا توجد مسارات متاحة بعد</Text>
        </Card>
      ) : (
        courses.map((course, i) => (
          <TouchableOpacity key={course.id || i} activeOpacity={0.9}>
            <Card style={{ borderColor: colors.border, borderRightColor: colors.accent, borderRightWidth: 3 }}>
              <Text style={[styles.courseTitle, { color: colors.text }]}>{course.title || course.name}</Text>
              
              <Text style={[styles.courseDesc, { color: colors.textMuted }]} numberOfLines={2}>
                {course.description || course.desc || ''}
              </Text>
              
              <View style={styles.meta}>
                <View style={styles.metaRow}>
                  <Ionicons name="book-outline" size={14} color={colors.textMuted} style={{ marginLeft: 4 }} />
                  <Text style={[styles.metaText, { color: colors.textMuted }]}>
                    {course.lessons_count || course.modules || 0} دروس ومحاضرات
                  </Text>
                </View>
                
                <View style={[styles.progressBadge, { backgroundColor: colors.accentGlow }]}>
                  <Text style={[styles.progressBadgeText, { color: colors.accent }]}>
                    {course.progress || 0}% مكتمل
                  </Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16, textAlign: 'right' },
  emptyText: { fontSize: 16, textAlign: 'center', padding: 20 },
  courseTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'right' },
  courseDesc: { fontSize: 14, lineHeight: 22, marginBottom: 12, textAlign: 'right' },
  meta: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  metaRow: { flexDirection: 'row-reverse', alignItems: 'center' },
  metaText: { fontSize: 13 },
  progressBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
  progressBadgeText: { fontSize: 12, fontWeight: '700' },
})

export default CoursesScreen
