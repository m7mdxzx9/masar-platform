import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { useTheme } from '../theme/ThemeContext'
import { Card } from '../components/Card'
import { useNavigation } from '../navigation/navigation'
import { Ionicons } from '@expo/vector-icons'

const sections = [
  {
    key: 'subjects',
    label: 'المواد الدراسية',
    icon: 'book-outline' as const,
    desc: 'إدارة ملفات ومحتويات المواد وفهرستها بالذكاء الاصطناعي',
  },
  {
    key: 'notes',
    label: 'الملاحظات الذكية',
    icon: 'document-text-outline' as const,
    desc: 'تدوين وحفظ الملاحظات والمحاضرات الهامة',
  },
  {
    key: 'study',
    label: 'المساعد الدراسي',
    icon: 'school-outline' as const,
    desc: 'توليد اختبارات وبطاقات تعليمية تفاعلية',
  },
  {
    key: 'challenges',
    label: 'تحديات التعلم',
    icon: 'trophy-outline' as const,
    desc: 'متابعة وإنجاز التحديات وتطوير المهارات',
  },
  {
    key: 'BackupDrive',
    label: 'النسخ الاحتياطي',
    icon: 'cloud-done-outline' as const,
    desc: 'مزامنة وحفظ بياناتك سحابياً وآمناً',
  },
  {
    key: 'settings',
    label: 'الإعدادات العامة',
    icon: 'settings-outline' as const,
    desc: 'تخصيص التطبيق وتغيير السمات وعناوين الخادم',
  },
]

const MoreScreen: React.FC = () => {
  const { colors } = useTheme()
  const navigation = useNavigation()

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>
      <View style={styles.list}>
        {sections.map((s) => (
          <TouchableOpacity
            key={s.key}
            activeOpacity={0.7}
            onPress={() => navigation.push(s.key)}
            style={styles.touchable}
          >
            <Card style={styles.optionCard}>
              <View style={styles.row}>
                {/* RTL Chevron Indicator on Left */}
                <Ionicons name="chevron-back" size={18} color={colors.textMuted} />

                {/* Text Details in Middle */}
                <View style={styles.textContainer}>
                  <Text style={[styles.label, { color: colors.text }]}>{s.label}</Text>
                  <Text style={[styles.desc, { color: colors.textMuted }]} numberOfLines={2}>
                    {s.desc}
                  </Text>
                </View>

                {/* Icon on Right */}
                <View style={[styles.iconWrapper, { backgroundColor: colors.accent + '15' }]}>
                  <Ionicons name={s.icon} size={22} color={colors.accent} />
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  list: { gap: 12 },
  touchable: {
    marginBottom: 4,
  },
  optionCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  textContainer: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginRight: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'right',
  },
  desc: {
    fontSize: 12,
    textAlign: 'right',
    lineHeight: 16,
  },
})

export default MoreScreen
