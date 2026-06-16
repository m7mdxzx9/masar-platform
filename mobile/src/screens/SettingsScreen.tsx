import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, TextInput, Alert } from 'react-native'
import { useTheme } from '../theme/ThemeContext'
import { themes } from '../theme/themes'
import { Card } from '../components/Card'
import { setBaseURL, getBaseURL } from '../api/client'
import { Ionicons } from '@expo/vector-icons'
import { syncManager } from '../services/syncManager'
import { storage } from '../utils/asyncStorage'
import { mlcLlmService, MLC_MODELS } from '../services/mlcLlmService'

const SettingsScreen: React.FC = () => {
  const { colors, themeId, setThemeById, designStyle, setDesignStyle } = useTheme()
  const [notifications, setNotifications] = useState(true)
  const [serverUrl, setServerUrl] = useState(getBaseURL())

  const [activeModel, setActiveModel] = useState(() => storage.getString('active_local_model') || 'Llama-3.2-1B-Instruct-q4f16_1-MLC')
  const [currentProvider, setCurrentProvider] = useState(() => storage.getString('llm_provider') || 'openrouter')
  const [downloadingModel, setDownloadingModel] = useState<string | null>(null)
  const [downloadProgress, setDownloadProgress] = useState<number>(0)
  const [installedModels, setInstalledModels] = useState<string[]>([])
  
  const [scanning, setScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)

  const checkMlcModelsStatus = async () => {
    const installed = []
    for (const m of MLC_MODELS) {
      const isDownloaded = await mlcLlmService.isModelDownloaded(m.id)
      if (isDownloaded) {
        installed.push(m.id)
      }
    }
    setInstalledModels(installed)
  }

  useEffect(() => {
    checkMlcModelsStatus()
  }, [activeModel])

  const handleDownloadMlcModel = async (modelId: string) => {
    setDownloadingModel(modelId)
    setDownloadProgress(0)
    try {
      await mlcLlmService.downloadModel(modelId, (progress) => {
        setDownloadProgress(progress)
      })
      await checkMlcModelsStatus()
      setDownloadingModel(null)
      Alert.alert('نجاح', `تم تحميل نموذج الـ GPU ${modelId} بنجاح!`)
    } catch (err) {
      console.error('Failed to download MLC model:', err)
      setDownloadingModel(null)
      Alert.alert('خطأ', 'فشل تحميل ملفات النموذج. يرجى التحقق من اتصال الإنترنت.')
    }
  }

  const handleAutoDiscoverServer = async () => {
    setScanning(true)
    setScanProgress(0)
    
    // We will scan subnets 192.168.1.X and 192.168.8.X (plus 192.168.0.X and 10.0.2.X)
    const subnets = ['192.168.1', '192.168.8', '192.168.0', '10.0.2']
    let foundUrl = null

    // We can also try the emulator host IP directly first
    try {
      const controller = new AbortController()
      const id = setTimeout(() => controller.abort(), 1000)
      const res = await fetch('http://10.0.2.2:8000/health', { signal: controller.signal })
      clearTimeout(id)
      if (res.status === 200) {
        foundUrl = 'http://10.0.2.2:8000'
      }
    } catch (e) {}

    if (foundUrl) {
      setServerUrl(foundUrl)
      await setBaseURL(foundUrl)
      syncManager.reconnect()
      await syncManager.pull()
      checkMlcModelsStatus()
      setScanning(false)
      Alert.alert('تم العثور على الخادم!', `تم الاتصال تلقائياً بخادم محاكي الأندرويد: ${foundUrl}`)
      return
    }

    // Otherwise scan subnets in batches of 35 requests to prevent socket exhaustion
    const batchSize = 35
    const timeoutMs = 1200

    for (const subnet of subnets) {
      if (foundUrl) break
      
      // Split 254 hosts into batches
      for (let batchStart = 1; batchStart < 255; batchStart += batchSize) {
        if (foundUrl) break
        
        const batchEnd = Math.min(batchStart + batchSize, 255)
        setScanProgress(Math.round((batchStart / 254) * 100))
        
        const promises = []
        for (let host = batchStart; host < batchEnd; host++) {
          const ip = `${subnet}.${host}`
          const url = `http://${ip}:8000`
          
          const p = (async () => {
            try {
              const controller = new AbortController()
              const id = setTimeout(() => controller.abort(), timeoutMs)
              const res = await fetch(`${url}/health`, { signal: controller.signal })
              clearTimeout(id)
              if (res.status === 200) {
                foundUrl = url
              }
            } catch (e) {}
          })()
          promises.push(p)
        }
        
        await Promise.all(promises)
        // Give a tiny breather between batches
        await new Promise(r => setTimeout(r, 50))
      }
    }

    setScanning(false)
    if (foundUrl) {
      setServerUrl(foundUrl)
      await setBaseURL(foundUrl)
      syncManager.reconnect()
      await syncManager.pull()
      checkMlcModelsStatus()
      Alert.alert('تم العثور على الخادم!', `تم الاتصال تلقائياً بالخادم المحلي: ${foundUrl}`)
    } else {
      Alert.alert('لم يتم العثور على خادم نشط', 'يرجى التأكد من تشغيل خادم الكمبيوتر (start.bat) وأن الهاتف متصل بنفس شبكة الواي فاي.')
    }
  }

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

      {/* Design Style Selector Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>طراز تصميم الواجهة (Layout Style)</Text>
        <View style={styles.styleGrid}>
          {[
            { id: 'classic', name: 'كلاسيك حديث', icon: 'sparkles-outline', desc: 'حواف دائرية وظلال ناعمة ومتناسقة' },
            { id: 'brutalist', name: 'سيبربانك وحشي', icon: 'terminal-outline', desc: 'حواف حادة وظلال كرتونية مسطحة وخط تقني' },
            { id: 'glass', name: 'زجاجي مستقبلي', icon: 'layers-outline', desc: 'خلفية زجاجية شفافة وتأثير متوهج مضيء' }
          ].map((styleOption) => {
            const isActive = designStyle === styleOption.id
            return (
              <TouchableOpacity
                key={styleOption.id}
                style={[
                  styles.styleCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isActive ? colors.accent : colors.border,
                  }
                ]}
                onPress={() => setDesignStyle(styleOption.id as any)}
                activeOpacity={0.8}
              >
                <View style={[styles.styleIconWrapper, { backgroundColor: isActive ? colors.accent + '20' : colors.surfaceHover }]}>
                  <Ionicons 
                    name={styleOption.icon as any} 
                    size={20} 
                    color={isActive ? colors.accent : colors.textMuted} 
                  />
                </View>
                <View style={styles.styleCardContent}>
                  <Text style={[styles.styleName, { color: colors.text }]}>{styleOption.name}</Text>
                  <Text style={[styles.styleDesc, { color: colors.textMuted }]}>{styleOption.desc}</Text>
                </View>
                {isActive && (
                  <View style={[styles.styleCheckBadge, { backgroundColor: colors.accent }]}>
                    <Ionicons name="checkmark" size={10} color={colors.bg} />
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

      {/* AI Models Configuration Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>إعدادات نماذج الذكاء الاصطناعي</Text>
        <Card style={styles.serverCard}>
          <Text style={[styles.optionLabel, { color: colors.text, marginBottom: 8, textAlign: 'right' }]}>مزود الخدمة النشط</Text>
          <View style={styles.providerRow}>
            {[
              { id: 'google', name: 'Gemini Direct' },
              { id: 'openrouter', name: 'OpenRouter' },
              { id: 'mlc', name: 'MLC LLM (Local GPU)' }
            ].map((p) => {
              const active = currentProvider === p.id
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.providerBtn,
                    {
                      borderColor: active ? colors.accent : colors.border,
                      backgroundColor: active ? colors.accentGlow : colors.surfaceHover
                    }
                  ]}
                  onPress={() => {
                    setCurrentProvider(p.id)
                    storage.set('llm_provider', p.id)
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: active ? colors.accent : colors.text }}>
                    {p.name}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          {currentProvider === 'mlc' && (
            <View style={{ marginTop: 16 }}>
              <Text style={[styles.optionLabel, { color: colors.text, marginBottom: 8, textAlign: 'right' }]}>النموذج المحلي النشط</Text>
              <View style={styles.activeModelRow}>
                {MLC_MODELS.map((m) => {
                  const active = activeModel === m.id
                  const isInstalled = installedModels.includes(m.id)
                  return (
                    <TouchableOpacity
                      key={m.id}
                      style={[
                        styles.activeModelBtn,
                        {
                          borderColor: active ? colors.accent : colors.border,
                          backgroundColor: active ? colors.accentGlow : colors.surfaceHover
                        }
                      ]}
                      onPress={() => {
                        setActiveModel(m.id)
                        storage.set('active_local_model', m.id)
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: 'bold', color: active ? colors.accent : colors.text }}>
                        {m.id.split('-')[0]}{isInstalled ? '' : ' (غير مثبت)'}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>

              <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 12 }}>
                <Text style={[styles.optionLabel, { color: colors.text, marginBottom: 8, textAlign: 'right' }]}>تنزيل وإدارة النماذج المحلية</Text>
                <View style={{ gap: 8 }}>
                  {MLC_MODELS.map((m) => {
                    const isInstalled = installedModels.includes(m.id)
                    const isDownloading = downloadingModel === m.id
                    return (
                      <View key={m.id} style={styles.downloadItem}>
                        <View style={{ alignItems: 'flex-start', minWidth: 80 }}>
                          {isInstalled ? (
                            <Text style={{ color: '#22c55e', fontSize: 11, fontWeight: 'bold' }}>مثبت (جاهز)</Text>
                          ) : isDownloading ? (
                            <Text style={{ color: '#f59e0b', fontSize: 11, fontWeight: 'bold' }}>
                              تحميل {Math.round(downloadProgress * 100)}%
                            </Text>
                          ) : (
                            <TouchableOpacity
                              style={[styles.downloadActionBtn, { backgroundColor: colors.accent }]}
                              onPress={() => handleDownloadMlcModel(m.id)}
                              disabled={downloadingModel !== null}
                            >
                              <Text style={{ color: colors.bg, fontSize: 10, fontWeight: 'bold' }}>تنزيل للـ GPU</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                        <View style={{ flex: 1, alignItems: 'flex-end', paddingRight: 8 }}>
                          <Text style={{ color: colors.text, fontSize: 12, fontWeight: 'bold' }}>{m.name}</Text>
                          <Text style={{ color: colors.textMuted, fontSize: 10 }}>الحجم: {m.size} • يعمل بالكامل محلياً</Text>
                        </View>
                      </View>
                    )
                  })}
                </View>
              </View>
            </View>
          )}
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
            style={[styles.saveBtn, { backgroundColor: colors.accent, marginBottom: 8 }]}
            onPress={handleSaveServerUrl}
            activeOpacity={0.8}
          >
            <Text style={[styles.saveBtnText, { color: colors.bg }]}>حفظ وإعادة الاتصال</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.discoverBtn,
              {
                borderColor: colors.accent,
                borderWidth: 1.5,
                backgroundColor: scanning ? colors.surfaceHover : 'transparent',
              }
            ]}
            onPress={handleAutoDiscoverServer}
            disabled={scanning}
            activeOpacity={0.8}
          >
            {scanning ? (
              <Text style={[styles.discoverBtnText, { color: colors.accent }]}>
                جاري البحث عن الخادم تلقائياً... ({scanProgress}%)
              </Text>
            ) : (
              <Text style={[styles.discoverBtnText, { color: colors.accent }]}>
                البحث التلقائي عن الخادم (Auto-Discover)
              </Text>
            )}
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
  styleGrid: {
    flexDirection: 'column',
    gap: 8,
  },
  styleCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    position: 'relative',
  },
  styleIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  styleCardContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  styleName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  styleDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  styleCheckBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 8,
  },
  providerBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  activeModelRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
  },
  activeModelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  downloadItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  downloadActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discoverBtn: {
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  discoverBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
})

export default SettingsScreen
