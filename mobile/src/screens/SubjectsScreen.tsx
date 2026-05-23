import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useTheme } from '../theme/ThemeContext'
import { getSubjects } from '../api/endpoints'
import { useNavigation } from '../navigation/navigation'

const SubjectsScreen: React.FC = () => {
  const { colors } = useTheme()
  const navigation = useNavigation()
  const [subjects, setSubjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSubjects()
      .then((data) => setSubjects(Array.isArray(data) ? data : data?.subjects || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    )
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>المواد الدراسية</Text>
      {subjects.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>لا توجد مواد متاحة بعد</Text>
        </View>
      ) : (
        subjects.map((subject, i) => (
          <TouchableOpacity
            key={subject.id || i}
            style={[styles.cardContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.push('SubjectDetail', { subjectId: subject.id })}
            activeOpacity={0.7}
          >
            {/* Stripe on the right side for RTL layout */}
            <View style={[styles.stripe, { backgroundColor: subject.color || colors.accent }]} />
            
            {/* Card contents */}
            <View style={styles.cardContent}>
              <Text style={[styles.subjectName, { color: colors.text }]}>
                {subject.name || subject.title}
              </Text>
              {subject.description ? (
                <Text style={[styles.subjectDesc, { color: colors.textMuted }]} numberOfLines={2}>
                  {subject.description}
                </Text>
              ) : null}
              <View style={styles.cardFooter}>
                <Text style={[styles.fileCount, { color: colors.accent }]}>
                  {subject.files_count || 0} ملف
                </Text>
              </View>
            </View>
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
  title: { fontSize: 24, fontWeight: '700', marginBottom: 20, textAlign: 'right' },
  emptyCard: {
    padding: 30,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { fontSize: 16, textAlign: 'center' },
  cardContainer: {
    flexDirection: 'row-reverse',
    borderRadius: 16,
    borderWidth: 1,
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
  subjectName: { fontSize: 18, fontWeight: '600', marginBottom: 6, textAlign: 'right' },
  subjectDesc: { fontSize: 14, lineHeight: 20, marginBottom: 8, textAlign: 'right' },
  cardFooter: {
    marginTop: 4,
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
    width: '100%',
  },
  fileCount: { fontSize: 13, fontWeight: '600' },
})

export default SubjectsScreen
