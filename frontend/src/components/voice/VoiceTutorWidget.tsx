import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Volume2, VolumeX, Sparkles, X, Bot, Play, Square, Loader2, Globe, Move, GripVertical } from 'lucide-react'
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
  const [inputQuery, setInputQuery] = useState('')

  const {
    isListening,
    isSpeaking,
    isProcessing,
    language,
    autoSpeechEnabled,
    lastExplanation,
    transcript,
    logs,
    setLanguage,
    setAutoSpeechEnabled,
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

  return (
    <div className={`fixed bottom-6 right-6 z-[90] ${className}`}>
      {/* Floating Action Orb Button (Draggable) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            drag
            dragMomentum={false}
            dragElastic={0.1}
            whileDrag={{ scale: 1.08 }}
            className="cursor-grab active:cursor-grabbing"
          >
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(true)}
              className="relative flex items-center gap-3 px-5 py-3.5 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-500 text-white shadow-2xl hover:shadow-indigo-500/50 font-semibold border border-white/20 backdrop-blur-md"
            >
              <GripVertical className="w-4 h-4 opacity-70" />
              <div className="relative">
                <Bot className="w-6 h-6 animate-pulse" />
                {(isListening || isSpeaking) && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
                )}
              </div>
              <span>{language === 'ar' ? 'المعلم الصوتي الذكي' : 'AI Voice Tutor'}</span>
              <Sparkles className="w-4 h-4 text-amber-300" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Widget Interface (Draggable) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            drag
            dragMomentum={false}
            dragElastic={0.1}
            initial={{ y: 50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-[360px] md:w-[420px] max-h-[600px] flex flex-col bg-slate-900/95 border border-indigo-500/40 rounded-2xl shadow-2xl backdrop-blur-2xl text-slate-100 overflow-hidden"
          >
            {/* Header (Drag Handle) */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-800/90 border-b border-slate-700/80 cursor-grab active:cursor-grabbing select-none">
              <div className="flex items-center gap-2.5">
                <GripVertical className="w-4 h-4 text-indigo-400 shrink-0" />
                <div className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-white">
                    {language === 'ar' ? 'المعلم الصوتي (قابل للتحريك)' : 'AI Voice Tutor (Draggable)'}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {codeContext ? (language === 'ar' ? 'متصل بالمختبر الذكي 💻' : 'Connected to Lab Code 💻') : (language === 'ar' ? 'جاهز للاستماع والشرح 🎙️' : 'Ready for questions 🎙️')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Language switch */}
                <button
                  onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
                  className="p-1 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-[10px] font-bold text-slate-200 flex items-center gap-1 transition-colors"
                  title="Switch Language"
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
                  title={autoSpeechEnabled ? 'Sound Enabled' : 'Muted'}
                >
                  {autoSpeechEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Glowing Orb / Visualizer Status Header */}
            <div className="relative flex flex-col items-center justify-center p-5 bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800">
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
                className={`w-16 h-16 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${
                  isListening
                    ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white ring-4 ring-emerald-400/30'
                    : isSpeaking
                    ? 'bg-gradient-to-tr from-purple-600 to-pink-500 text-white ring-4 ring-purple-400/30'
                    : 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white hover:brightness-110'
                }`}
              >
                {isProcessing ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : isListening ? (
                  <Mic className="w-8 h-8 animate-bounce" />
                ) : isSpeaking ? (
                  <Volume2 className="w-8 h-8 animate-pulse" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </motion.div>

              <p className="mt-2.5 text-[11px] font-medium text-slate-300">
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
