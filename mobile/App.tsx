import React, { useState, useEffect } from 'react'
import { SafeAreaView, StatusBar, StyleSheet, View, Text, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert } from 'react-native'
import { ThemeProvider, useTheme } from './src/theme/ThemeContext'
import { initI18n } from './src/i18n'
import TabBar from './src/components/TabBar'
import { NavigationProvider, useNavigation } from './src/navigation/navigation'
import { Ionicons } from '@expo/vector-icons'
import { getBaseURL, setBaseURL } from './src/api/client'

// Screens
import DashboardScreen from './src/screens/DashboardScreen'
import LabScreen from './src/screens/LabScreen'
import AgentsScreen from './src/screens/AgentsScreen'
import CoursesScreen from './src/screens/CoursesScreen'
import MoreScreen from './src/screens/MoreScreen'
import SubjectsScreen from './src/screens/SubjectsScreen'
import NotesScreen from './src/screens/NotesScreen'
import StudyAssistantScreen from './src/screens/StudyAssistantScreen'
import ChallengesScreen from './src/screens/ChallengesScreen'
import SettingsScreen from './src/screens/SettingsScreen'
import SubjectDetailScreen from './src/screens/SubjectDetailScreen'
import QuizScreen from './src/screens/QuizScreen'
import BackupDriveScreen from './src/screens/BackupDriveScreen'
import FlashcardsScreen from './src/screens/FlashcardsScreen'
import PlannerScreen from './src/screens/PlannerScreen'

const mainTabs = [
  { key: 'Dashboard', label: 'الرئيسية' },
  { key: 'Lab', label: 'المختبر' },
  { key: 'Agents', label: 'الوكلاء' },
  { key: 'Courses', label: 'المسارات' },
  { key: 'More', label: 'المزيد' },
]

const screenTitles: Record<string, string> = {
  Dashboard: 'الرئيسية',
  Lab: 'المختبر الذكي',
  Agents: 'وكلاء الذكاء',
  Courses: 'المسارات التعليمية',
  More: 'المزيد',
  subjects: 'المواد الدراسية',
  notes: 'الملاحظات',
  study: 'المساعد الدراسي',
  challenges: 'التحديات',
  settings: 'الإعدادات',
  SubjectDetail: 'تفاصيل المادة',
  Quiz: 'الاختبار الذكي',
  BackupDrive: 'النسخ الاحتياطي',
  Flashcards: 'بطاقات الاستذكار',
  Planner: 'المخطط الدراسي',
}

initI18n()

function isDarkColor(hex: string): boolean {
  const c = hex.replace('#', '')
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 < 128
}

const AppContent: React.FC = () => {
  const { colors } = useTheme()
  const { currentRoute, stack, pop, reset } = useNavigation()
  const isDark = isDarkColor(colors.bg)

  const isMainTab = ['Dashboard', 'Lab', 'Agents', 'Courses', 'More'].includes(currentRoute.screen)
  const canGoBack = stack.length > 1

  const [showServerModal, setShowServerModal] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [tempIp, setTempIp] = useState('')

  useEffect(() => {
    checkServerConnection()
  }, [])

  const checkServerConnection = async () => {
    try {
      const response = await fetch(`${getBaseURL()}/health`, { method: 'GET' })
      if (!response.ok) {
        setShowServerModal(true)
      }
    } catch {
      setShowServerModal(true)
    }
  }

  const handleConnect = async () => {
    let cleanIp = tempIp.trim()
    if (!cleanIp) return
    if (!cleanIp.startsWith('http://') && !cleanIp.startsWith('https://')) {
      cleanIp = `http://${cleanIp}`
    }
    if (!cleanIp.includes(':8000') && !cleanIp.includes(':3000')) {
      cleanIp = `${cleanIp}:8000`
    }
    
    setTestingConnection(true)
    try {
      const response = await fetch(`${cleanIp}/health`, { method: 'GET' })
      if (response.ok) {
        await setBaseURL(cleanIp)
        setShowServerModal(false)
        Alert.alert('نجاح', 'تم الاتصال بالخادم ومزامنة البيانات بنجاح!')
      } else {
        Alert.alert('خطأ', 'الخادم لم يستجب بشكل صحيح.')
      }
    } catch (e) {
      Alert.alert(
        'فشل الاتصال',
        'تعذر الوصول للعنوان المدخل. تأكد أن الهاتف والكمبيوتر متصلان بنفس شبكة الـ Wi-Fi وأن جدار الحماية يسمح بالاتصال.'
      )
    } finally {
      setTestingConnection(false)
    }
  }

  const renderScreen = () => {
    switch (currentRoute.screen) {
      case 'Dashboard':
        return <DashboardScreen />
      case 'Lab':
        return <LabScreen />
      case 'Agents':
        return <AgentsScreen />
      case 'Courses':
        return <CoursesScreen />
      case 'More':
        return <MoreScreen />
      case 'subjects':
        return <SubjectsScreen />
      case 'notes':
        return <NotesScreen />
      case 'study':
        return <StudyAssistantScreen />
      case 'challenges':
        return <ChallengesScreen />
      case 'settings':
        return <SettingsScreen />
      case 'SubjectDetail':
        return <SubjectDetailScreen subjectId={currentRoute.params?.subjectId} />
      case 'Quiz':
        return (
          <QuizScreen
            topic={currentRoute.params?.topic}
            fileContent={currentRoute.params?.fileContent}
          />
        )
      case 'BackupDrive':
        return <BackupDriveScreen />
      case 'Flashcards':
        return <FlashcardsScreen />
      case 'Planner':
        return <PlannerScreen />
      default:
        return <DashboardScreen />
    }
  }

  const handleTabChange = (key: string) => {
    reset(key)
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
      
      {/* Premium Server Connection Modal */}
      <Modal visible={showServerModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Ionicons name="wifi-outline" size={28} color={colors.accent} style={{ marginLeft: 10 }} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>ربط الهاتف بالمنصة (الكمبيوتر)</Text>
            </View>
            <Text style={[styles.modalDesc, { color: colors.textMuted }]}>
              لم نتمكن من الاتصال التلقائي بالخادم. يرجى إدخال عنوان IP الخاص بجهاز الكمبيوتر الخاص بك للمزامنة وعرض المواد الدراسية.
            </Text>
            
            <View style={styles.ipHintBox}>
              <Text style={[styles.ipHintText, { color: colors.accent }]}>
                العناوين المتوقعة لخادمك الحالي:
              </Text>
              <Text style={[styles.ipHintValue, { color: colors.text }]}>
                192.168.1.30  أو  192.168.8.146
              </Text>
            </View>

            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.surfaceHover,
                  color: colors.text,
                  borderColor: colors.border,
                }
              ]}
              value={tempIp}
              onChangeText={setTempIp}
              placeholder="مثال: 192.168.1.30"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: colors.accent }]} 
                onPress={handleConnect}
                disabled={testingConnection}
              >
                {testingConnection ? (
                  <ActivityIndicator size="small" color={colors.bg} />
                ) : (
                  <Text style={[styles.modalBtnText, { color: colors.bg }]}>اتصال ومزامنة ⚡</Text>
                )}
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.skipBtn} onPress={() => setShowServerModal(false)}>
              <Text style={[styles.skipBtnText, { color: colors.textMuted }]}>تخطي مؤقتاً (دون مزامنة)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Premium Dark Glassmorphism HeaderBar */}
      <View style={[styles.headerBar, { backgroundColor: colors.surface + 'D9', borderColor: colors.border }]}>
        <View style={styles.headerRight}>
          {canGoBack && (
            <TouchableOpacity onPress={pop} style={styles.backButton} activeOpacity={0.7}>
              <Ionicons name="chevron-forward" size={24} color={colors.accent} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {screenTitles[currentRoute.screen] || currentRoute.screen}
        </Text>
        <View style={styles.headerLeft} />
      </View>

      <View style={{ flex: 1 }}>
        {renderScreen()}
      </View>

      {isMainTab && (
        <TabBar tabs={mainTabs} activeTab={currentRoute.screen} onTabChange={handleTabChange} />
      )}
    </SafeAreaView>
  )
}

const App: React.FC = () => (
  <ThemeProvider>
    <NavigationProvider>
      <AppContent />
    </NavigationProvider>
  </ThemeProvider>
)

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBar: {
    height: 56,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-start',
  },
  headerLeft: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalDesc: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
    marginBottom: 16,
  },
  ipHintBox: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  ipHintText: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  ipHintValue: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modalInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  modalBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  skipBtn: {
    marginTop: 16,
    alignItems: 'center',
    padding: 8,
  },
  skipBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
})

export default App
