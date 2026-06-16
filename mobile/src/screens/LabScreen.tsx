import React, { useState, useEffect, useRef } from 'react'
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Clipboard, Alert } from 'react-native'
import { useTheme } from '../theme/ThemeContext'
import { Card } from '../components/Card'
import { runCode } from '../api/endpoints'
import { syncManager } from '../services/syncManager'
import { WebView } from 'react-native-webview'
import { Ionicons } from '@expo/vector-icons'

const HTML_CONTENT = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background-color: #090A0F;
      overflow: hidden;
      font-family: sans-serif;
    }
    #editor {
      width: 100%;
      height: 100%;
      display: none;
    }
    #loader {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #FFBD2E;
      text-align: center;
      z-index: 10;
      width: 80%;
    }
    .spinner {
      border: 4px solid rgba(255, 255, 255, 0.1);
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border-left-color: #00FFCC;
      animation: spin 1s linear infinite;
      margin: 0 auto 15px auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    #offline-alert {
      display: none;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: #1A0B0E;
      border: 1.5px solid #FF5F56;
      border-radius: 12px;
      padding: 20px;
      color: #FF8F8A;
      text-align: center;
      z-index: 20;
      width: 80%;
      box-shadow: 0 0 20px rgba(255, 95, 86, 0.2);
    }
    #offline-alert h3 {
      margin-top: 0;
      color: #FF5F56;
    }
  </style>
</head>
<body>
  <div id="loader">
    <div class="spinner"></div>
    <div id="status-text" style="font-size: 14px; color: #00FFCC; letter-spacing: 0.5px;">Initializing Python Environment...</div>
  </div>

  <div id="offline-alert">
    <h3>⚠️ لا يوجد اتصال بالإنترنت</h3>
    <p>يتطلب تحميل محرّر الأكواد (Monaco Editor) الاتصال بالشبكة للمرة الأولى.</p>
    <p style="font-size: 12px; opacity: 0.8;">سيقوم التطبيق باستخدام مفسر الخادم المحلي كبديل تلقائي.</p>
  </div>

  <div id="editor"></div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.6/require.min.js" onerror="handleLoadError('requirejs')"></script>
  <script src="https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js" onerror="handleLoadError('pyodide')"></script>

  <script>
    var pyodide = null;
    var editor = null;
    var isPyodideReady = false;
    var isEditorReady = false;
    var loadTimeout = null;

    function sendLog(type, data) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, ...data }));
      }
    }

    function handleLoadError(source) {
      clearTimeout(loadTimeout);
      document.getElementById('loader').style.display = 'none';
      document.getElementById('offline-alert').style.display = 'block';
      sendLog('error', { error: 'Failed to load external asset: ' + source, offline: true });
    }

    if (!navigator.onLine) {
      handleLoadError('navigator_offline');
    } else {
      loadTimeout = setTimeout(function() {
        if (!isEditorReady || !isPyodideReady) {
          handleLoadError('timeout');
        }
      }, 12000);
    }

    async function initPyodide() {
      try {
        if (typeof loadPyodide === 'undefined') {
          return;
        }
        pyodide = await loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/"
        });
        await pyodide.loadPackage(['numpy', 'pandas']);
        await pyodide.runPythonAsync(\`
import sys
import io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
        \`);
        isPyodideReady = true;
        updateStatus();
      } catch (e) {
        handleLoadError('pyodide_init_fail');
      }
    }

    if (typeof require !== 'undefined') {
      require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs' } });
      require(['vs/editor/editor.main'], function() {
        editor = monaco.editor.create(document.getElementById('editor'), {
          value: '',
          language: 'python',
          theme: 'vs-dark',
          automaticLayout: true,
          fontSize: 13,
          minimap: { enabled: false },
          scrollbar: { vertical: 'visible', horizontal: 'visible' },
          lineNumbers: 'on',
          renderLineHighlight: 'all',
          tabSize: 4
        });

        editor.onDidChangeModelContent(function() {
          sendLog('code_change', { code: editor.getValue() });
        });

        isEditorReady = true;
        updateStatus();
      }, function(err) {
        handleLoadError('monaco_load_fail');
      });
    }

    function updateStatus() {
      if (isPyodideReady && isEditorReady) {
        clearTimeout(loadTimeout);
        document.getElementById('loader').style.display = 'none';
        document.getElementById('editor').style.display = 'block';
        sendLog('ready', {});
      } else if (isEditorReady) {
        document.getElementById('status-text').innerText = 'Initializing local Python compiler...';
      }
    }

    window.setEditorValue = function(val) {
      if (editor) {
        editor.setValue(val);
      }
    };

    window.runCode = async function(codeToRun) {
      if (!isPyodideReady) {
        sendLog('run_result', { error: 'بيئة بايثون ليست جاهزة بعد' });
        return;
      }
      try {
        await pyodide.runPythonAsync(\`
import sys
sys.stdout.truncate(0)
sys.stdout.seek(0)
sys.stderr.truncate(0)
sys.stderr.seek(0)
        \`);
        
        await pyodide.runPythonAsync(codeToRun || (editor ? editor.getValue() : ''));
        
        const stdout = pyodide.runPython('sys.stdout.getvalue()');
        const stderr = pyodide.runPython('sys.stderr.getvalue()');
        
        sendLog('run_result', {
          output: stdout || '',
          error: stderr || null
        });
      } catch (e) {
        sendLog('run_result', {
          output: '',
          error: e.message
        });
      }
    };

    if (navigator.onLine) {
      initPyodide();
    }
  </script>
</body>
</html>
`;

const LabScreen: React.FC = () => {
  const { colors } = useTheme()
  const [code, setCode] = useState('# اكتب كود بايثون هنا\nimport numpy as np\nimport pandas as pd\n\rarr = np.array([1, 2, 3])\nprint("المصفوفة محلياً:", arr)\n')
  const [output, setOutput] = useState('')
  const [running, setRunning] = useState(false)
  const [engineState, setEngineState] = useState<'loading' | 'ready' | 'fallback'>('loading')
  
  const isIncomingUpdate = useRef(false)
  const webViewRef = useRef<WebView | null>(null)
  const resolveRunRef = useRef<((value: any) => void) | null>(null)

  // Load initial code and subscribe to real-time updates
  useEffect(() => {
    const initialCode = syncManager.getLabCode()
    if (initialCode) {
      isIncomingUpdate.current = true
      setCode(initialCode)
    }

    const unsubscribe = syncManager.subscribeWS((msg: any) => {
      if (msg.type === 'LAB_CODE_UPDATE' && msg.sender !== 'mobile') {
        if (msg.code !== undefined && msg.code !== code) {
          isIncomingUpdate.current = true
          setCode(msg.code)
          webViewRef.current?.injectJavaScript(`window.setEditorValue(${JSON.stringify(msg.code)}); void(0);`)
        }
      }
    })
    return () => unsubscribe()
  }, [])

  // Sync changes
  useEffect(() => {
    if (isIncomingUpdate.current) {
      isIncomingUpdate.current = false
      return
    }
    const timer = setTimeout(() => {
      syncManager.updateLabCode(code, 'mobile')
    }, 300) // 300ms debounce
    return () => clearTimeout(timer)
  }, [code])

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data)
      if (data.type === 'ready') {
        setEngineState('ready')
        webViewRef.current?.injectJavaScript(`window.setEditorValue(${JSON.stringify(code)}); void(0);`)
      } else if (data.type === 'error') {
        setEngineState('fallback')
        if (data.offline) {
          Alert.alert('تنبيه غير متصل', 'يتعذر تحميل المحرر المحلي لعدم وجود اتصال بالإنترنت. تم تفعيل مفسر الأكواد المحلي عبر الخادم كبديل.')
        }
      } else if (data.type === 'code_change') {
        if (data.code !== code) {
          isIncomingUpdate.current = true
          setCode(data.code)
        }
      } else if (data.type === 'run_result') {
        if (resolveRunRef.current) {
          resolveRunRef.current(data)
          resolveRunRef.current = null
        }
      }
    } catch (e) {
      console.error('WebView message parse error:', e)
    }
  }

  const handleRun = async () => {
    setRunning(true)
    setOutput('')
    
    if (engineState === 'ready' && webViewRef.current) {
      try {
        const runPromise = new Promise<any>((resolve) => {
          resolveRunRef.current = resolve
          const jsCode = `window.runCode(${JSON.stringify(code)}); void(0);`
          webViewRef.current?.injectJavaScript(jsCode)
        })
        
        const res = await runPromise
        if (res.error) {
          setOutput(`❌ خطأ:\n${res.error}`)
        } else {
          setOutput(res.output || '✅ تم التنفيذ بنجاح (لا توجد مخرجات)')
        }
      } catch (e: any) {
        setOutput(`❌ خطأ تشغيل محلي: ${e.message}`)
      } finally {
        setRunning(false)
      }
    } else {
      // Fallback to server side execution
      try {
        const res = await runCode(code)
        setOutput(res?.output || res?.result || '✅ تم التنفيذ بنجاح')
      } catch (e: any) {
        setOutput(`❌ خطأ شبكة: ${e.message}\n(محرك بايثون المحلي قيد التحميل أو لم يكتمل تحميله)`)
      } finally {
        setRunning(false)
      }
    }
  }

  const handleClearCode = () => {
    setCode('')
    webViewRef.current?.injectJavaScript(`window.setEditorValue(''); void(0);`)
  }

  const handleCopyCode = () => {
    if (!code) return
    Clipboard.setString(code)
    Alert.alert('تم النسخ', 'تم نسخ الكود البرمجي بنجاح!')
  }

  const handleResetCode = () => {
    Alert.alert(
      'إعادة تعيين الكود',
      'هل أنت متأكد من إعادة تعيين الكود إلى النموذج الافتراضي؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'نعم، أعد التعيين',
          style: 'destructive',
          onPress: () => {
            const defaultCode = '# اكتب كود بايثون هنا\nimport numpy as np\nimport pandas as pd\n\rarr = np.array([1, 2, 3])\nprint("المصفوفة محلياً:", arr)\n'
            setCode(defaultCode)
            webViewRef.current?.injectJavaScript(`window.setEditorValue(${JSON.stringify(defaultCode)}); void(0);`)
          }
        }
      ]
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>المختبر الذكي</Text>
          
          {/* Status Badge */}
          {engineState === 'loading' && (
            <View style={[styles.badge, { backgroundColor: '#FFBD2E15', borderColor: '#FFBD2E' }]}>
              <ActivityIndicator size="small" color="#FFBD2E" style={{ marginRight: 4 }} />
              <Text style={[styles.badgeText, { color: '#FFBD2E' }]}>جاري تهيئة بايثون ⚙️</Text>
            </View>
          )}
          {engineState === 'ready' && (
            <View style={[styles.badge, { backgroundColor: '#27C93F15', borderColor: '#27C93F' }]}>
              <View style={[styles.statusDot, { backgroundColor: '#27C93F' }]} />
              <Text style={[styles.badgeText, { color: '#27C93F' }]}>التشغيل المحلي نشط 📱</Text>
            </View>
          )}
          {engineState === 'fallback' && (
            <View style={[styles.badge, { backgroundColor: '#00D8FF15', borderColor: '#00D8FF' }]}>
              <View style={[styles.statusDot, { backgroundColor: '#00D8FF' }]} />
              <Text style={[styles.badgeText, { color: '#00D8FF' }]}>مفسر الخادم المحلي 🖥️</Text>
            </View>
          )}
        </View>

        <Card style={[styles.consoleCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          {/* IDE/Editor Header */}
          <View style={[styles.consoleHeader, { backgroundColor: colors.surfaceHover, borderBottomColor: colors.border }]}>
            <View style={styles.consoleDots}>
              <View style={[styles.consoleDot, { backgroundColor: '#FF5F56' }]} />
              <View style={[styles.consoleDot, { backgroundColor: '#FFBD2E' }]} />
              <View style={[styles.consoleDot, { backgroundColor: '#27C93F' }]} />
            </View>
            
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleResetCode} style={styles.actionBtn}>
                <Ionicons name="reload-outline" size={16} color={colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCopyCode} style={styles.actionBtn}>
                <Ionicons name="copy-outline" size={16} color={colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleClearCode} style={styles.actionBtn}>
                <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
              </TouchableOpacity>
              <Text style={[styles.consoleTitle, { color: colors.textMuted }]}>main.py</Text>
            </View>
          </View>

          {/* Visible Monaco Code Editor WebView */}
          <View style={{ height: 350, overflow: 'hidden', borderBottomWidth: 1.5, borderColor: colors.border }}>
            <WebView
              ref={webViewRef}
              source={{ html: HTML_CONTENT }}
              onMessage={handleMessage}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              originWhitelist={['*']}
              mixedContentMode="always"
              style={{ flex: 1, backgroundColor: '#090A0F' }}
            />
          </View>

          {/* Run Button */}
          <TouchableOpacity
            style={[
              styles.runBtn,
              {
                backgroundColor: colors.accent,
                shadowColor: colors.accent,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 8,
                elevation: 6,
                opacity: running ? 0.6 : 1,
              },
            ]}
            onPress={handleRun}
            disabled={running}
          >
            {running ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <View style={styles.runBtnContent}>
                <Text style={[styles.runBtnText, { color: colors.bg }]}>تشغيل الكود</Text>
                <Ionicons name="play" size={16} color={colors.bg} style={{ marginRight: 6 }} />
              </View>
            )}
          </TouchableOpacity>
        </Card>

        {output ? (
          <Card style={[styles.outputCard, { backgroundColor: '#090A0F', borderColor: colors.border, borderWidth: 1.5 }]}>
            <View style={[styles.consoleHeader, { backgroundColor: '#12131A', borderBottomColor: '#20212E', borderBottomWidth: 1 }]}>
              <View style={styles.consoleDots}>
                <View style={[styles.consoleDot, { backgroundColor: '#FF5F56', opacity: 0.6 }]} />
                <View style={[styles.consoleDot, { backgroundColor: '#FFBD2E', opacity: 0.6 }]} />
                <View style={[styles.consoleDot, { backgroundColor: '#27C93F', opacity: 0.6 }]} />
              </View>
              <Text style={[styles.consoleTitle, { color: '#8F93A3' }]}>المخرجات (Terminal)</Text>
            </View>
            <View style={styles.outputBox}>
              <Text style={styles.promptSymbol}>$ </Text>
              <Text style={[styles.outputText, { color: output.startsWith('❌') ? '#FF5F56' : '#00FFCC' }]}>
                {output}
              </Text>
            </View>
          </Card>
        ) : null}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  headerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'right' },
  badge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 6,
  },
  consoleCard: {
    padding: 0,
    overflow: 'hidden',
    borderWidth: 1.5,
  },
  consoleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  consoleDots: {
    flexDirection: 'row',
    gap: 6,
  },
  consoleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  consoleTitle: {
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  editorContainer: {
    flexDirection: 'row',
    minHeight: 250,
  },
  lineNumberColumn: {
    width: 35,
    paddingTop: 16,
    alignItems: 'center',
    borderRightWidth: 1,
  },
  lineNumberText: {
    fontFamily: 'monospace',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  codeInput: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: 14,
    lineHeight: 20,
    paddingTop: 16,
    paddingHorizontal: 16,
    textAlignVertical: 'top',
  },
  runBtn: {
    margin: 16,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  runBtnContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  runBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  outputCard: {
    padding: 0,
    overflow: 'hidden',
    marginTop: 16,
  },
  outputBox: {
    padding: 16,
    minHeight: 100,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  promptSymbol: {
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 18,
    color: '#FF00FF',
    fontWeight: '700',
  },
  outputText: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'left',
  },
})

export default LabScreen
