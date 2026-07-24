import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Volume2, VolumeX, Sparkles, X, Bot, Play, Square, Loader2, Globe, GripVertical, Trash2, Eye, EyeOff } from 'lucide-react'
import { useVoiceStore } from '../../stores/voiceStore'
import { useVoiceTutor } from '../../hooks/useVoiceTutor'
import ReactMarkdown from 'react-markdown'

interface VoiceTutorWidgetProps {
  codeContext?: string
  errorContext?: string
  className?: string
}

export const VoiceTutorWidget: React.FC<VoiceTutorWidgetProps> = ({
  codeContext,
  errorContext,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const [inputQuery, setInputQuery] = useState('')

  const {
    isListening,
    isSpeaking,
    isProcessing,
    language,
    autoSpeechEnabled,
    lastExplanation,
    logs,
    setLanguage,
    setAutoSpeechEnabled,
    clearLogs,
  } = useVoiceStore()

  const {
    startRecording,
    stopRecording,
    speakText,
    stopSpeaking,
    askTutorWithText,
  } = useVoiceTutor()

  const handleMicClick = () => {
    if (isListening) {
      stopRecording()
    } else {
      startRecording({ codeContext, errorContext })
    }
  }

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputQuery.trim()) return
    askTutorWithText(inputQuery, { codeContext, errorContext })
    setInputQuery('')
  }

  // Hidden State Pill Trigger to restore widget
  if (isHidden) {
    return (
      <div className={`fixed bottom-4 right-4 z-[90] ${className}`}>
        <button
          onClick={() => setIsHidden(false)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 text-indigo-400 border border-indigo-500/40 shadow-xl backdrop-blur-md text-xs font-bold hover:scale-105 transition-all cursor-pointer"
          title="إظهار المعلم الصوتي"
        >
          <Eye className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>المعلم الصوتي</span>
        </button>
      </div>
    )
  }

  return (
    <div className={`fixed bottom-4 right-3 sm:bottom-6 sm:right-6 z-[90] ${className}`}>
      {/* Closed State: Compact Robot Square/Circle Button ONLY (No Text Name) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            drag
            dragMomentum={false}
            dragElastic={0.1}
            dragConstraints={{ top: -500, left: -400, right: 400, bottom: 200 }}
            whileDrag={{ scale: 1.08 }}
            className="cursor-grab active:cursor-grabbing"
          >
            <div className="relative group">
              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setIsOpen(true)}
                className="relative w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-emerald-500 text-white shadow-[0_10px_30px_rgba(99,102,241,0.5)] hover:shadow-indigo-500/70 border border-white/30 backdrop-blur-md flex items-center justify-center cursor-pointer transition-all"
                title="المعلم الصوتي الذكي (انقر للفرد أو التحدث)"
              >
                <div className="relative flex items-center justify-center">
                  <Bot className="w-6 h-6 sm:w-7 sm:h-7 animate-pulse text-white" />
                  {(isListening || isSpeaking) && (
                    <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
                  )}
                </div>
              </motion.button>

              {/* Quick Hide Button next to Orb */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsHidden(true)
                }}
                className="absolute -top-1 -left-1 opacity-0 group-hover:opacity-100 p-1 rounded-full bg-slate-900 text-slate-400 hover:text-white border border-slate-700 transition-opacity cursor-pointer shadow-md"
                title="إخفاء المعلم الصوتي"
              >
                <EyeOff className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Widget Interface (Draggable & Responsive) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            drag
            dragMomentum={false}
            dragElastic={0.1}
            dragConstraints={{ top: -500, left: -400, right: 400, bottom: 200 }}
            initial={{ y: 50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-[92vw] sm:w-[400px] md:w-[420px] max-h-[82vh] md:max-h-[600px] flex flex-col bg-slate-900/95 border border-indigo-500/40 rounded-2xl shadow-2xl backdrop-blur-2xl text-slate-100 overflow-hidden"
          >
            {/* Header (Drag Handle & Quick Controls) */}
            <div className="flex items-center justify-between px-3.5 py-3 bg-slate-800/90 border-b border-slate-700/80 cursor-grab active:cursor-grabbing select-none">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-indigo-400 shrink-0" />
                <div className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-white">
                    {language === 'ar' ? 'المعلم الصوتي' : 'AI Voice Tutor'}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {codeContext ? (language === 'ar' ? 'متصل بالمختبر الذكي 💻' : 'Connected to Lab Code 💻') : (language === 'ar' ? 'جاهز للاستماع والشرح 🎙️' : 'Ready for questions 🎙️')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Clear Chat History */}
                <button
                  onClick={clearLogs}
                  className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 transition-colors"
                  title="مسح سجل المحادثات والأخطاء"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {/* Language switch */}
                <button
                  onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
                  className="p-1 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-[10px] font-bold text-slate-200 flex items-center gap-0.5 transition-colors"
                  title="تغيير اللغة"
                >
                  <Globe className="w-3 h-3" />
                  <span>{language.toUpperCase()}</span>
                </button>

                {/* Auto-speech toggle */}
                <button
                  onClick={() => setAutoSpeechEnabled(!autoSpeechEnabled)}
                  className={`p-1 rounded-lg transition-colors ${
                    autoSpeechEnabled
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-700/60 text-slate-400'
                  }`}
                  title={autoSpeechEnabled ? 'الصوت مفعّل' : 'الصوت مكتوم'}
                >
                  {autoSpeechEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>

                {/* Hide Button */}
                <button
                  onClick={() => {
                    setIsOpen(false)
                    setIsHidden(true)
                  }}
                  className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  title="إخفاء المساعد"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Visualizer Status Header */}
            <div className="relative flex flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800">
              <motion.div
                animate={
                  isListening
                    ? { scale: [1, 1.2, 1], boxShadow: ['0 0 20px rgba(99,102,241,0.4)', '0 0 40px rgba(16,185,129,0.8)', '0 0 20px rgba(99,102,241,0.4)'] }
                    : isSpeaking
                    ? { scale: [1, 1.12, 1], boxShadow: ['0 0 20px rgba(168,85,247,0.4)', '0 0 35px rgba(236,72,153,0.7)', '0 0 20px rgba(168,85,247,0.4)'] }
                    : { scale: 1, boxShadow: '0 0 15px rgba(99,102,241,0.2)' }
                }
                transition={{ repeat: Infinity, duration: 1.8 }}
                onClick={handleMicClick}
                className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${
                  isListening
                    ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white ring-4 ring-emerald-400/30'
                    : isSpeaking
                    ? 'bg-gradient-to-tr from-purple-600 to-pink-500 text-white ring-4 ring-purple-400/30'
                    : 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white hover:brightness-110'
                }`}
              >
                {isProcessing ? (
                  <Loader2 className="w-7 h-7 animate-spin" />
                ) : isListening ? (
                  <Mic className="w-7 h-7 animate-bounce" />
                ) : isSpeaking ? (
                  <Volume2 className="w-7 h-7 animate-pulse" />
                ) : (
                  <Mic className="w-7 h-7" />
                )}
              </motion.div>

              <p className="mt-2 text-[11px] font-medium text-slate-300 text-center">
                {isListening
                  ? language === 'ar'
                    ? 'جاري الاستماع... اضغط لإرسال السؤال 🎙️'
                    : 'Listening... Tap to send 🎙️'
                  : isProcessing
                  ? language === 'ar'
                    ? 'المعلم الذكي يفكر ويستنتج الإجابة... ⚡'
                    : 'Voice tutor analyzing context... ⚡'
                  : isSpeaking
                  ? language === 'ar'
                    ? 'جاري التحدث بالشرح الصوتي... 🔊'
                    : 'Speaking voice explanation... 🔊'
                  : language === 'ar'
                  ? 'اضغط على الميكروفون للتحدث وسؤال المعلم'
                  : 'Tap microphone to start voice query'}
              </p>
            </div>

            {/* Conversation Log & Transcript Body */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3 min-h-[140px] max-h-[220px] text-xs">
              {logs.length === 0 && !lastExplanation && (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center py-5">
                  <Sparkles className="w-7 h-7 mb-2 opacity-40 text-indigo-400" />
                  <p>{language === 'ar' ? 'اسأل المعلم عن خطأ الكود أو شرح مفاهيم الذكاء الاصطناعي.' : 'Ask about code errors or AI concepts.'}</p>
                </div>
              )}

              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`flex flex-col ${
                    log.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-3 py-2 leading-relaxed ${
                      log.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-slate-800 text-slate-200 border border-slate-700/70 rounded-bl-none'
                    }`}
                  >
                    {log.role === 'tutor' ? (
                      <div className="prose prose-invert prose-xs">
                        <ReactMarkdown>{log.text}</ReactMarkdown>
                      </div>
                    ) : (
                      <span>{log.text}</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 px-1">
                    {log.role === 'user' ? (language === 'ar' ? 'أنت' : 'You') : (language === 'ar' ? 'المعلم الصوتي' : 'AI Tutor')}
                  </span>
                </div>
              ))}
            </div>

            {/* Controls & Speech Controls */}
            {lastExplanation && (
              <div className="px-3 py-2 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>{language === 'ar' ? 'التحكم في الصوت:' : 'Audio Control:'}</span>
                <div className="flex items-center gap-2">
                  {isSpeaking ? (
                    <button
                      onClick={stopSpeaking}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition-colors text-[11px]"
                    >
                      <Square className="w-3 h-3 fill-current" />
                      <span>{language === 'ar' ? 'إيقاف الصوت' : 'Stop Audio'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => speakText(lastExplanation)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors text-[11px]"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{language === 'ar' ? 'إعادة الاستماع' : 'Replay Voice'}</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Text Input Form Fallback */}
            <form onSubmit={handleTextSubmit} className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder={
                  language === 'ar'
                    ? 'اكتب سؤالك هنا أو استخدم الميكروفون...'
                    : 'Type your question or use mic...'
                }
                className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={isProcessing || !inputQuery.trim()}
                className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
