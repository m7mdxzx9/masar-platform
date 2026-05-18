import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../theme/ThemeContext'
import Sidebar from '@/components/layout/Sidebar'
import { useState, useEffect } from 'react'

export default function PageLayout() {
  const { theme } = useTheme()
  const location = useLocation()
  const [isNavigating, setIsNavigating] = useState(false)

  useEffect(() => {
    setIsNavigating(true)
    const timer = setTimeout(() => setIsNavigating(false), 300)
    return () => clearTimeout(timer)
  }, [location.pathname])

  return (
    <div
      className="flex min-h-screen relative overflow-hidden"
      style={{ backgroundColor: theme.colors.bg, color: theme.colors.text }}
    >

      {/* Top Progress Bar */}
      <AnimatePresence>
        {isNavigating && (
          <motion.div
            initial={{ width: 0, opacity: 1 }}
            animate={{ width: '100%', opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute top-0 left-0 h-1 z-50 shadow-lg"
            style={{
              backgroundColor: theme.colors.accent,
              boxShadow: `0 0 20px ${theme.colors.accent}`,
            }}
          />
        )}
      </AnimatePresence>

      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
