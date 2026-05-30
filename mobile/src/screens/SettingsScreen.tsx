import React, { useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, TextInput, Alert } from 'react-native'
import { useTheme } from '../theme/ThemeContext'
import { themes } from '../theme/themes'
import { Card } from '../components/Card'
import { setBaseURL, getBaseURL } from '../api/client'
import { Ionicons } from '@expo/vector-icons'
import { syncManager } from '../services/syncManager'

const SettingsScreen: React.FC = () => {
  const { colors, themeId, setThemeById } = useTheme()
  const [notifications, setNotifications] = useState(true)
  const [serverUrl, setServerUrl] = useState(getBaseURL())

  const handleSaveServerUrl = async () => {
    try {
      await setBaseURL(serverUrl)
      syncManager.reconnect()
      await syncManager.pull()
      Alert.alert('تم بنجاح', 'تم تحديث عنوان الخادم بنجاح')
    } catch {
      Alert.alert('خطأ', 'فشل تحديث عنوان الخادم')
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>
      {/* Visual Theme Card Choices Grid */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>مظهر المنصة (اختر سمة من 20 سمة)</Text>
        <View style={styles.themeGrid}>
          {themes.map((t) => {
            const isActive = themeId === t.id
            return (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.themeCard,
                  {
                    backgroundColor: t.colors.surface,
                    borderColor: isActive ? t.colors.accent : t.colors.border,
                    shadowColor: isActive ? t.colors.accent : 'transparent',
                  },
                ]}
                onPress={() => setThemeById(t.id)}
                activeOpacity={0.8}
              >
                <View style={styles.dotsRow}>
                  <View style={[styles.themeDot, { backgroundColor: t.colors.accent }]} />
                  <View style={[styles.themeDot, { backgroundColor: t.colors.secondary }]} />
                  <View style={[styles.themeDot, { backgroundColor: t.colors.success }]} />
                </View>
                <Text style={[styles.themeName, { color: t.colors.text }]} numberOfLines={1}>
                  {t.nameAr}
                </Text>
                {isActive && (
                  <View style={[styles.checkBadge, { backgroundColor: t.colors.accent }]}>
                    <Ionicons name="checkmark" size={10} color={t.colors.bg} />
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>الإشعارات والتنبيهات</Text>
        <Card style={styles.optionCard}>
          <View style={styles.optionRow}>
            <View style={styles.optionTextContainer}>
              <Text style={[styles.optionLabel, { color: colors.text }]}>تذكير المذاكرة اليومي</Text>
              <Text style={[styles.optionSub, { color: colors.textMuted }]}>
                تلقي تنبيهات ذكية وجداول مخصصة للمذاكرة والتركيز
              </Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: colors.border, true: colors.accent + '40' }}
              thumbColor={notifications ? colors.accent : colors.textMuted}
            />
          </View>
        </Card>
      </View>

      {/* Server Configuration Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>إعدادات الاتصال بالخادم</Text>
        <Card style={styles.serverCard}>
          <View style={styles.serverHeaderRow}>
            <View style={styles.serverHeaderText}>
              <Text style={[styles.serverTitle, { color: colors.text }]}>رابط واجهة برمجة التطبيقات (API)</Text>
              <Text style={[styles.serverSubTitle, { color: colors.textMuted }]}>
                تعديل الرابط الأساسي للاتصال بنظام مسار الخلفي
              </Text>
            </View>
            <View style={[styles.serverIconWrapper, { backgroundColor: colors.accent + '15' }]}>
              <Ionicons name="server-outline" size={20} color={colors.accent} />
            </View>
          </View>

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceHover,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={serverUrl}
            onChangeText={setServerUrl}
            placeholder="http://10.0.2.2:8000"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="url"
          />

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.accent }]}
            onPress={handleSaveServerUrl}
            activeOpacity={0.8}
          >
            <Text style={[styles.saveBtnText, { color: colors.bg }]}>حفظ وإعادة الاتصال</Text>
          </TouchableOpacity>
        </Card>
      </View>

      {/* Footer Info */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Text style={[styles.footerVersionText, { color: colors.textMuted }]}>Masar Mohammed Dgriri v2.0.0</Text>
        <Text style={[styles.footerText, { color: colors.textMuted }]}>تطوير وإعداد فريق عمل منصة مسار محمد دغريري</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '700', marginBottom: 12, textAlign: 'right' },
  
  // Theme Grid Choices
  themeGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  themeCard: {
    width: '31.3%',
    height: 90,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 6,
  },
  themeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  themeName: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Switch option card
  optionCard: {
    padding: 16,
    borderRadius: 16,
  },
  optionRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionTextContainer: {
    flex: 1,
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right',
  },
  optionSub: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: 2,
    lineHeight: 16,
  },

  // Server config card
  serverCard: {
    padding: 16,
    borderRadius: 16,
  },
  serverHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 16,
  },
  serverIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  serverHeaderText: {
    flex: 1,
    alignItems: 'flex-end',
  },
  serverTitle: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },
  serverSubTitle: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: 2,
  },
  input: {
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'right',
  },
  saveBtn: {
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Footer
  footer: {
    marginTop: 16,
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1.5,
  },
  footerVersionText: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  footerText: {
    fontSize: 11,
  },
})

export default SettingsScreen
