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
            className="absolute top-0 left-0 h-1 z-50"
            style={{ backgroundColor: theme.colors.accent }}
          />
        )}
      </AnimatePresence>

      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
