import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, X, Coffee, Brain, Timer } from 'lucide-react'
import { useTheme } from '@/theme/ThemeContext'
import { useFocusStore } from '@/stores/focusStore'

const FOCUS_DURATION = 25 * 60
const BREAK_DURATION = 5 * 60

export default function PomodoroTimer() {
  const { theme } = useTheme()
  const {
    isActive, timeLeft, sessionType, isPaused,
    setTimeLeft, setIsActive, setSessionType, setIsPaused, completeSession,
  } = useFocusStore()
  const [isOpen, setIsOpen] = useState(false)
  const [dimensions, setDimensions] = useState({ width: 1000, height: 1000 })
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDimensions({ width: window.innerWidth, height: window.innerHeight })
      const handleResize = () => {
        setDimensions({ width: window.innerWidth, height: window.innerHeight })
      }
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        const current = useFocusStore.getState().timeLeft
        if (current <= 1) {
          setIsActive(false)
          if (intervalRef.current) clearInterval(intervalRef.current)
          completeSession(sessionType === 'focus' ? FOCUS_DURATION : BREAK_DURATION)
          if (sessionType === 'focus') {
            setSessionType('break')
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              new Notification('انتهت جلسة التركيز!', { body: 'حان وقت الاستراحة لمدة 5 دقائق' })
            }
          } else {
            setSessionType('focus')
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              new Notification('انتهت الاستراحة!', { body: 'حان وقت التركيز لمدة 25 دقيقة' })
            }
          }
        } else {
          setTimeLeft(current - 1)
        }
      }, 1000)
    } else {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isActive, isPaused, sessionType])

  const toggleTimer = () => {
    if (isActive) {
      setIsPaused(!isPaused)
    } else {
      setIsActive(true)
      setIsPaused(false)
    }
  }

  const resetTimer = () => {
    setIsActive(false)
    setIsPaused(false)
    setTimeLeft(sessionType === 'focus' ? FOCUS_DURATION : BREAK_DURATION)
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const pct = sessionType === 'focus'
    ? ((FOCUS_DURATION - timeLeft) / FOCUS_DURATION) * 100
    : ((BREAK_DURATION - timeLeft) / BREAK_DURATION) * 100

  const switchMode = (mode: 'focus' | 'break') => {
    setIsActive(false)
    setIsPaused(false)
    setSessionType(mode)
  }

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.1}
      dragConstraints={{
        left: -dimensions.width + (isOpen ? 280 : 80),
        right: 0,
        top: -dimensions.height + (isOpen ? 320 : 80),
        bottom: 0
      }}
      className="fixed bottom-6 right-6 z-50 cursor-grab active:cursor-grabbing select-none"
      style={{ touchAction: 'none' }}
      dir="rtl"
    >
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl p-5 shadow-2xl w-64"
            style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}`, backdropFilter: 'blur(20px)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-1">
                <button onClick={() => switchMode('focus')}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                  style={{
                    background: sessionType === 'focus' ? `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` : 'rgba(255,255,255,0.05)',
                    color: sessionType === 'focus' ? '#fff' : theme.colors.textMuted,
                  }}>
                  <Brain size={12} className="inline ml-1" />تركيز
                </button>
                <button onClick={() => switchMode('break')}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                  style={{
                    background: sessionType === 'break' ? `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` : 'rgba(255,255,255,0.05)',
                    color: sessionType === 'break' ? '#fff' : theme.colors.textMuted,
                  }}>
                  <Coffee size={12} className="inline ml-1" />استراحة
                </button>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg hover:bg-white/10 transition-all" style={{ color: theme.colors.textMuted }}>
                <X size={14} />
              </button>
            </div>

            <div className="text-center mb-4">
              <div className="text-4xl font-black tabular-nums mb-1" style={{ color: sessionType === 'focus' ? theme.colors.accent : theme.colors.success }}>
                {formatTime(timeLeft)}
              </div>
              <p className="text-[10px] font-bold" style={{ color: theme.colors.textMuted }}>
                {sessionType === 'focus' ? 'جلسة تركيز' : 'استراحة'}
              </p>
            </div>

            <div className="w-full h-1.5 rounded-full mb-4 overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              <div className="h-full rounded-full transition-all duration-1000" style={{
                width: `${Math.min(100, pct)}%`,
                background: `linear-gradient(90deg, ${theme.colors.secondary}, ${sessionType === 'focus' ? theme.colors.accent : theme.colors.success})`,
              }} />
            </div>

            <div className="flex justify-center gap-3">
              <button onClick={toggleTimer}
                className="flex items-center justify-center w-12 h-12 rounded-xl text-white transition-all hover:scale-105 shadow-lg"
                style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
                {isActive && !isPaused ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
              </button>
              <button onClick={resetTimer}
                className="flex items-center justify-center w-12 h-12 rounded-xl transition-all hover:bg-white/10"
                style={{ color: theme.colors.textMuted, border: `1px solid ${theme.colors.border}` }}>
                <RotateCcw size={18} />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="fab"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            onClick={() => {
              setIsOpen(true)
              if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission()
              }
            }}
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-2xl transition-all hover:scale-110 relative"
            style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}
            title="مؤقت بومودورو"
          >
            <Timer size={24} />
            {isActive && !isPaused && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-ping" style={{ backgroundColor: theme.colors.success }} />
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
