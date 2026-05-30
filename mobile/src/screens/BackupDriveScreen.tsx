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
  Linking,
} from 'react-native'
import { useTheme } from '../theme/ThemeContext'
import { Ionicons } from '@expo/vector-icons'
import * as Sharing from 'expo-sharing'
import * as FileSystem from 'expo-file-system'
import * as DocumentPicker from 'expo-document-picker'
import { syncManager } from '../services/syncManager'
import {
  getDriveStatus,
  getDriveAuthUrl,
  sendDriveAuthCallback,
  unlinkDrive,
  backupToDrive,
  listDriveBackups,
  getBackupList,
  createBackup,
} from '../api/endpoints'


export const BackupDriveScreen: React.FC = () => {
  const { colors } = useTheme()

  const [driveLinked, setDriveLinked] = useState(false)
  const [driveFolderId, setDriveFolderId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Backups list states
  const [localBackups, setLocalBackups] = useState<any[]>([])
  const [driveBackups, setDriveBackups] = useState<any[]>([])

  // Auth callback simulation code input
  const [authCode, setAuthCode] = useState('')
  const [showAuthCodeInput, setShowAuthCodeInput] = useState(false)

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      const status = await getDriveStatus()
      setDriveLinked(status.linked)
      setDriveFolderId(status.folder_id)

      const locals = await getBackupList()
      setLocalBackups(locals || [])

      if (status.linked) {
        const cloud = await listDriveBackups()
        setDriveBackups(cloud?.backups || [])
      }
    } catch (e) {
      console.log('Error backup metadata', e)
    } finally {
      setLoading(false)
    }
  }

  const handleLinkGoogleDrive = async () => {
    try {
      const res = await getDriveAuthUrl()
      if (res && res.url) {
        // Open authorization URL in web browser
        Linking.openURL(res.url)
        setShowAuthCodeInput(true)
      } else {
        Alert.alert('خطأ', 'فشل في جلب رابط المصادقة')
      }
    } catch (e) {
      Alert.alert('خطأ', 'فشل في الاتصال بالخادم')
    }
  }

  const handleSubmitAuthCode = async () => {
    if (!authCode) return
    setLoading(true)
    try {
      const res = await sendDriveAuthCallback(authCode)
      if (res && res.success) {
        Alert.alert('نجاح', 'تم ربط حساب Google Drive بنجاح!')
        setDriveLinked(true)
        setShowAuthCodeInput(false)
        setAuthCode('')
        fetchInitialData()
      } else {
        Alert.alert('خطأ', 'رمز التحقق غير صالح')
      }
    } catch (e) {
      Alert.alert('خطأ', 'فشل الربط')
    } finally {
      setLoading(false)
    }
  }

  const handleUnlinkDrive = async () => {
    Alert.alert('تأكيد إلغاء الربط', 'هل تريد إلغاء ربط حساب Google Drive بالمنصة؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'تأكيد إلغاء الربط',
        style: 'destructive',
        onPress: async () => {
          setLoading(true)
          try {
            await unlinkDrive()
            setDriveLinked(false)
            setDriveFolderId(null)
            setDriveBackups([])
            Alert.alert('نجاح', 'تم إلغاء ربط الحساب')
          } catch (e) {
            Alert.alert('خطأ', 'فشل إلغاء الربط')
          } finally {
            setLoading(false)
          }
        },
      },
    ])
  }

  const handleExportLocalData = async () => {
    try {
      const data = {
        subjects: syncManager.getSubjects(),
        notes: syncManager.getNotes(),
        scheduleCourses: syncManager.getScheduleCourses(),
        vocabularyWords: syncManager.getVocabulary(),
      }

      const jsonString = JSON.stringify(data, null, 2)
      const ts = new Date().toISOString().replace(/[-:T.]/g, '_').slice(0, 15)
      const fileUri = `${FileSystem.cacheDirectory}masar_backup_${ts}.json`

      await FileSystem.writeAsStringAsync(fileUri, jsonString, { encoding: FileSystem.EncodingType.UTF8 })

      const canShare = await Sharing.isAvailableAsync()
      if (canShare) {
        await Sharing.shareAsync(fileUri, { mimeType: 'application/json', dialogTitle: 'تصدير نسخة احتياطية' })
      } else {
        Alert.alert('تنبيه', `تم حفظ الملف محلياً: ${fileUri}`)
      }
    } catch (e: any) {
      Alert.alert('خطأ', `فشل تصدير البيانات: ${e.message}`)
    }
  }

  const handleImportLocalData = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      })

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return
      }

      const fileAsset = result.assets[0]
      const fileContent = await FileSystem.readAsStringAsync(fileAsset.uri, { encoding: FileSystem.EncodingType.UTF8 })
      const data = JSON.parse(fileContent)

      if (!data.subjects && !data.notes && !data.scheduleCourses && !data.vocabularyWords) {
        Alert.alert('خطأ', 'ملف النسخة الاحتياطية غير صالح أو فارغ.')
        return
      }

      Alert.alert(
        'تأكيد الاستعادة',
        'استعادة النسخة الاحتياطية ستقوم بدمج أو استبدال البيانات الحالية. هل ترغب في الاستمرار؟',
        [
          { text: 'إلغاء', style: 'cancel' },
          {
            text: 'تأكيد الاستعادة',
            onPress: async () => {
              setLoading(true)
              try {
                await syncManager.restoreLocalBackup(data)
                Alert.alert('نجاح', 'تمت استعادة النسخة الاحتياطية المحلية بنجاح!')
                
                // Refresh local statistics lists
                const locals = await getBackupList()
                setLocalBackups(locals || [])
              } catch (err: any) {
                Alert.alert('خطأ', `فشل استعادة البيانات: ${err.message}`)
              } finally {
                setLoading(false)
              }
            }
          }
        ]
      )
    } catch (e: any) {
      Alert.alert('خطأ', `فشل قراءة الملف: ${e.message}`)
    }
  }


  const handleBackupToDrive = async () => {
    if (!driveLinked) {
      Alert.alert('تنبيه', 'يرجى ربط حساب Google Drive أولاً')
      return
    }
    setLoading(true)
    try {
      await backupToDrive()
      const cloud = await listDriveBackups()
      setDriveBackups(cloud?.backups || [])
      Alert.alert('نجاح', 'تم رفع نسخة احتياطية مشفرة ومزامنتها على السحابة بنجاح!')
    } catch (e) {
      Alert.alert('خطأ', 'فشل المزامنة السحابية')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>
      {/* Google Drive Status Section */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.headerRow}>
          <Ionicons
            name="logo-google"
            size={24}
            color={driveLinked ? colors.success : colors.accent}
            style={{ marginLeft: 12 }}
          />
          <Text style={[styles.cardTitle, { color: colors.text, flex: 1, textAlign: 'right' }]}>
            ربط ومزامنة Google Drive
          </Text>
        </View>

        <Text style={[styles.description, { color: colors.textMuted }]}>
          ربط حسابك يتيح لك حفظ ومزامنة الملاحظات، المواد، والتقدم الدراسي على حسابك السحابي الشخصي واستعادتها في أي وقت ومن أي جهاز.
        </Text>

        {/* Steps to link Drive if not linked */}
        {!driveLinked && (
          <View style={[styles.stepsContainer, { borderColor: colors.border }]}>
            <Text style={[styles.stepsTitle, { color: colors.text }]}>خطوات ربط حسابك:</Text>
            
            <View style={styles.stepRow}>
              <View style={[styles.stepNumber, { backgroundColor: colors.accentGlow }]}>
                <Text style={[styles.stepNumberText, { color: colors.accent }]}>١</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.textMuted }]}>
                اضغط على زر الربط أدناه للانتقال لصفحة مصادقة Google الآمنة.
              </Text>
            </View>

            <View style={styles.stepRow}>
              <View style={[styles.stepNumber, { backgroundColor: colors.accentGlow }]}>
                <Text style={[styles.stepNumberText, { color: colors.accent }]}>٢</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.textMuted }]}>
                قم بتسجيل الدخول بحساب Google الخاص بك والموافقة على الأذونات اللازمة.
              </Text>
            </View>

            <View style={styles.stepRow}>
              <View style={[styles.stepNumber, { backgroundColor: colors.accentGlow }]}>
                <Text style={[styles.stepNumberText, { color: colors.accent }]}>٣</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.textMuted }]}>
                انسخ رمز التحقق الظاهر لك وضعه في حقل الإدخال لتفعيل المزامنة.
              </Text>
            </View>
          </View>
        )}

        {driveLinked ? (
          <View style={styles.statusRow}>
            <View style={styles.linkedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} style={{ marginLeft: 6 }} />
              <Text style={[styles.linkedText, { color: colors.success }]}>مرتبط سحابياً بنجاح</Text>
            </View>
            <TouchableOpacity style={styles.unlinkBtn} onPress={handleUnlinkDrive}>
              <Text style={[styles.unlinkBtnText, { color: colors.error }]}>إلغاء ربط الحساب</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={[styles.linkBtn, { backgroundColor: colors.accent }]} onPress={handleLinkGoogleDrive}>
            <Ionicons name="logo-google" size={18} color="#fff" style={{ marginLeft: 8 }} />
            <Text style={styles.linkBtnText}>ربط حساب Google Drive</Text>
          </TouchableOpacity>
        )}

        {showAuthCodeInput && !driveLinked && (
          <View style={[styles.authCodeBox, { borderTopColor: colors.border }]}>
            <Text style={[styles.authCodeLabel, { color: colors.text }]}>أدخل رمز المصادقة المستلم:</Text>
            
            <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surfaceHover }]}>
              <Ionicons name="key-outline" size={18} color={colors.textMuted} style={{ marginLeft: 8 }} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="رمز التحقق (Auth Code)"
                placeholderTextColor={colors.textMuted}
                value={authCode}
                onChangeText={setAuthCode}
              />
            </View>

            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.success }]} onPress={handleSubmitAuthCode}>
              <Ionicons name="checkbox-outline" size={18} color="#fff" style={{ marginLeft: 6 }} />
              <Text style={styles.submitBtnText}>إرسال الرمز للتحقق والتفعيل</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Sync Actions List */}
      <View style={styles.actionList}>
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={handleExportLocalData}
        >
          <View style={[styles.iconCircle, { backgroundColor: colors.accentGlow }]}>
            <Ionicons name="share-social-outline" size={22} color={colors.accent} />
          </View>
          <View style={styles.actionDetails}>
            <Text style={[styles.actionTitle, { color: colors.text }]}>تصدير البيانات محلياً</Text>
            <Text style={[styles.actionSub, { color: colors.textMuted }]}>حفظ نسخة احتياطية من بياناتك (المواد والملاحظات والمفردات) ومشاركتها كملف JSON.</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={handleImportLocalData}
        >
          <View style={[styles.iconCircle, { backgroundColor: colors.accentGlow }]}>
            <Ionicons name="download-outline" size={22} color={colors.accent} />
          </View>
          <View style={styles.actionDetails}>
            <Text style={[styles.actionTitle, { color: colors.text }]}>استيراد البيانات محلياً</Text>
            <Text style={[styles.actionSub, { color: colors.textMuted }]}>استعادة بياناتك السابقة عن طريق رفع ملف نسخة احتياطية JSON.</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
            !driveLinked && { opacity: 0.6 },
          ]}
          onPress={handleBackupToDrive}
          disabled={!driveLinked}
        >
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: driveLinked ? 'rgba(0, 255, 136, 0.12)' : colors.surfaceHover },
            ]}
          >
            <Ionicons name="cloud-upload-outline" size={22} color={driveLinked ? colors.success : colors.textMuted} />
          </View>
          <View style={styles.actionDetails}>
            <Text style={[styles.actionTitle, { color: driveLinked ? colors.text : colors.textMuted }]}>
              مزامنة النسخة السحابية
            </Text>
            <Text style={[styles.actionSub, { color: colors.textMuted }]}>حفظ ورفع نسخة احتياطية مشفرة مباشرة على حساب Google Drive الخاص بك.</Text>
          </View>
        </TouchableOpacity>
      </View>


      {/* Backups List */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>النسخ الاحتياطية المتاحة</Text>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 20 }} />
      ) : (
        <View style={styles.backupContainer}>
          <Text style={[styles.subtitle, { color: colors.accent }]}>النسخ المحلية ({localBackups.length})</Text>
          {localBackups.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>لا توجد نسخ احتياطية محلية حتى الآن.</Text>
            </View>
          ) : (
            localBackups.map((b, idx) => (
              <View key={idx} style={[styles.backupRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.backupIconBox, { backgroundColor: colors.surfaceHover }]}>
                  <Ionicons name="document-text" size={22} color={colors.accent} />
                </View>
                <View style={styles.backupDetails}>
                  <Text style={[styles.backupName, { color: colors.text }]} numberOfLines={1}>
                    {b.filename}
                  </Text>
                  <Text style={[styles.backupMeta, { color: colors.textMuted }]}>
                    تاريخ الإنشاء: {b.date} | الحجم: {Math.round(b.size_bytes / 1024)} كيلوبايت
                  </Text>
                </View>
              </View>
            ))
          )}

          <Text style={[styles.subtitle, { color: colors.success, marginTop: 24 }]}>النسخ على Drive ({driveBackups.length})</Text>
          {!driveLinked ? (
            <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>يرجى ربط حساب Google Drive لعرض النسخ السحابية.</Text>
            </View>
          ) : driveBackups.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>لا توجد نسخ احتياطية على حساب Drive الخاص بك.</Text>
            </View>
          ) : (
            driveBackups.map((b, idx) => (
              <View key={idx} style={[styles.backupRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.backupIconBox, { backgroundColor: 'rgba(0, 255, 136, 0.1)' }]}>
                  <Ionicons name="cloud-done" size={22} color={colors.success} />
                </View>
                <View style={styles.backupDetails}>
                  <Text style={[styles.backupName, { color: colors.text }]} numberOfLines={1}>
                    {b.name || b.filename}
                  </Text>
                  <Text style={[styles.backupMeta, { color: colors.textMuted }]}>
                    تاريخ التعديل: {b.modified_time ? b.modified_time.split('T')[0] : 'غير معروف'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  card: { padding: 18, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  headerRow: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 14 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  description: { fontSize: 13, lineHeight: 20, marginBottom: 16, textAlign: 'right' },
  
  // Steps guide
  stepsContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 12,
  },
  stepsTitle: { fontSize: 13, fontWeight: '700', textAlign: 'right', marginBottom: 4 },
  stepRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  stepNumber: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { fontSize: 12, fontWeight: '700' },
  stepText: { flex: 1, fontSize: 12, lineHeight: 18, textAlign: 'right' },

  statusRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  linkedBadge: { flexDirection: 'row-reverse', alignItems: 'center' },
  linkedText: { fontSize: 13, fontWeight: '700' },
  unlinkBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  unlinkBtnText: { fontSize: 12, fontWeight: '700' },
  
  linkBtn: { height: 48, borderRadius: 12, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center' },
  linkBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  
  authCodeBox: { borderTopWidth: 1, marginTop: 16, paddingTop: 16 },
  authCodeLabel: { fontSize: 13, fontWeight: '700', marginBottom: 8, textAlign: 'right' },
  
  inputContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    textAlign: 'right',
    fontSize: 14,
  },
  submitBtn: { height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row-reverse' },
  submitBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // List
  actionList: { gap: 12, marginBottom: 24 },
  actionCard: { padding: 14, borderRadius: 16, borderWidth: 1, flexDirection: 'row-reverse', alignItems: 'center' },
  iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginLeft: 14 },
  actionDetails: { flex: 1, alignItems: 'flex-end' },
  actionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4, textAlign: 'right' },
  actionSub: { fontSize: 11, lineHeight: 16, textAlign: 'right' },


  // List Backups
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 14, textAlign: 'right' },
  backupContainer: { gap: 10 },
  subtitle: { fontSize: 14, fontWeight: '700', marginBottom: 8, textAlign: 'right' },
  emptyBox: { padding: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  emptyText: { fontSize: 12, textAlign: 'center', fontStyle: 'italic' },
  
  backupRow: { padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 4, flexDirection: 'row-reverse', alignItems: 'center' },
  backupIconBox: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  backupDetails: { flex: 1, alignItems: 'flex-end' },
  backupName: { fontSize: 13, fontWeight: '600' },
  backupMeta: { fontSize: 11, marginTop: 4 },
})

export default BackupDriveScreen
