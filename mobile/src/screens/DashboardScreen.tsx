import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native'
import { useTheme } from '../theme/ThemeContext'
import { Card } from '../components/Card'
import { getDashboardStats, getFocusStats } from '../api/endpoints'
import { useNavigation } from '../navigation/navigation'
import { Ionicons } from '@expo/vector-icons'

const DashboardScreen: React.FC = () => {
  const { colors } = useTheme()
  const navigation = useNavigation()
  const [stats, setStats] = useState<any>(null)
  const [focus, setFocus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getDashboardStats(), getFocusStats()])
      .then(([s, f]) => {
        setStats(s)
        setFocus(f)
      })
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

  const targetMinutes = 60
  const currentMinutes = focus?.total_minutes_today || 0
  const progressPercent = Math.min((currentMinutes / targetMinutes) * 100, 100)

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>
      {/* Welcoming Glow Header */}
      <View style={[styles.welcomeHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.glowOverlay, { backgroundColor: colors.accentGlow }]} />
        <View style={styles.headerInfo}>
          <Text style={[styles.greeting, { color: colors.text }]}>مرحباً بك في مسار</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>منصتك الذكية للتميز الدراسي والمهني</Text>
        </View>
        <View style={[styles.welcomeIcon, { backgroundColor: colors.accent + '15' }]}>
          <Ionicons name="sparkles" size={28} color={colors.accent} />
        </View>
      </View>

      {/* Stats Cards Grid */}
      <Text style={[styles.sectionTitleLabel, { color: colors.text }]}>نظرة عامة</Text>
      <View style={styles.gridRow}>
        <TouchableOpacity style={styles.gridItem} onPress={() => navigation.reset('Courses')}>
          <Card style={styles.statCard}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="git-network-outline" size={20} color={colors.accent} />
              <Text style={[styles.statValue, { color: colors.accent }]}>{stats?.courses_count || 0}</Text>
            </View>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>المسارات</Text>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem} onPress={() => navigation.push('subjects')}>
          <Card style={styles.statCard}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="book-outline" size={20} color={colors.accent} />
              <Text style={[styles.statValue, { color: colors.accent }]}>{stats?.subjects_count || stats?.courses_count || 0}</Text>
            </View>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>المواد</Text>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem} onPress={() => navigation.reset('Lab')}>
          <Card style={styles.statCard}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="flask-outline" size={20} color={colors.accent} />
              <Text style={[styles.statValue, { color: colors.accent }]}>{stats?.labs_count || 0}</Text>
            </View>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>المختبرات</Text>
          </Card>
        </TouchableOpacity>
      </View>

      {/* Styled Focus Progress Card */}
      <Card style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <View style={styles.progressTextContainer}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>وقت التركيز</Text>
            <Text style={[styles.progressSubtitle, { color: colors.textMuted }]}>هدف اليوم: {targetMinutes} دقيقة</Text>
          </View>
          <View style={[styles.progressIconBadge, { backgroundColor: colors.accent + '15' }]}>
            <Ionicons name="timer-outline" size={24} color={colors.accent} />
          </View>
        </View>

        <View style={styles.progressDetailsRow}>
          <Text style={[styles.bigNumber, { color: colors.accent }]}>{currentMinutes}</Text>
          <Text style={[styles.minutesLabel, { color: colors.textMuted }]}>دقيقة مكتملة</Text>
        </View>

        {/* Progress bar track */}
        <View style={[styles.progressBarTrack, { backgroundColor: colors.surfaceHover }]}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${progressPercent}%`,
                backgroundColor: colors.accent,
                shadowColor: colors.accent,
                shadowOpacity: 0.8,
                shadowRadius: 6,
                elevation: 4,
              },
            ]}
          />
        </View>

        <View style={styles.progressFooter}>
          <Text style={[styles.progressFooterText, { color: colors.textMuted }]}>
            {progressPercent >= 100 ? 'تم إنجاز هدف التركيز اليوم بنجاح! 🏆' : `تبقى لك ${targetMinutes - currentMinutes} دقيقة لإكمال هدف اليوم`}
          </Text>
        </View>
      </Card>

      {/* Quick Activities */}
      <Card style={styles.actionsCard}>
        <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 16 }]}>الأنشطة السريعة</Text>
        
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.accent }]}
          onPress={() => navigation.push('Planner')}
          activeOpacity={0.8}
        >
          <Ionicons name="play-outline" size={20} color={colors.bg} style={styles.btnIcon} />
          <Text style={[styles.actionBtnText, { color: colors.bg }]}>بدء جلسة تركيز</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtnOutlined, { backgroundColor: colors.surfaceHover, borderColor: colors.border }]}
          onPress={() => navigation.reset('Lab')}
          activeOpacity={0.8}
        >
          <Ionicons name="flask-outline" size={20} color={colors.accent} style={styles.btnIcon} />
          <Text style={[styles.actionBtnTextOutlined, { color: colors.text }]}>فتح المختبر الذكي</Text>
        </TouchableOpacity>
      </Card>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Welcome Glow Header
  welcomeHeader: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  glowOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    opacity: 0.15,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  greeting: { fontSize: 22, fontWeight: '800', marginBottom: 6 },
  subtitle: { fontSize: 13, lineHeight: 18, textAlign: 'right' },
  welcomeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Stats Grid
  sectionTitleLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'right',
  },
  gridRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginBottom: 20,
  },
  gridItem: {
    flex: 1,
  },
  statCard: {
    padding: 12,
    alignItems: 'center',
    borderRadius: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 6,
  },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '700' },

  // Progress Card
  progressCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTextContainer: {
    alignItems: 'flex-end',
  },
  cardTitle: { fontSize: 16, fontWeight: '800', textAlign: 'right' },
  progressSubtitle: { fontSize: 12, marginTop: 2, textAlign: 'right' },
  progressIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDetailsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  bigNumber: { fontSize: 36, fontWeight: '800', marginRight: 4 },
  minutesLabel: { fontSize: 13, marginRight: 8, fontWeight: '700' },
  progressBarTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressFooter: {
    alignItems: 'flex-end',
  },
  progressFooterText: { fontSize: 12, fontWeight: '600', textAlign: 'right' },

  // Actions Card
  actionsCard: {
    padding: 20,
    borderRadius: 20,
  },
  actionBtn: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionBtnOutlined: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  btnIcon: {
    marginLeft: 8,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionBtnTextOutlined: {
    fontSize: 14,
    fontWeight: '700',
  },
})

export default DashboardScreen
