import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  BookOpen,
  FlaskConical,
  BrainCircuit,
  Trophy,
  Rocket,
  Globe,
  Sparkles,
  Zap,
} from 'lucide-react'
import { useTheme } from '../../theme/ThemeContext'

export const NextGenCyberDock: React.FC = () => {
  const location = useLocation()
  const { setIdentityMode } = useTheme()

  const dockLinks = [
    { to: '/dashboard', label: 'الرئيسية', icon: LayoutDashboard, color: '#00F0FF' },
    { to: '/courses', label: 'المسارات', icon: BookOpen, color: '#38BDF8' },
    { to: '/labs', label: 'المختبر', icon: FlaskConical, color: '#10B981' },
    { to: '/agents', label: 'الوكلاء', icon: BrainCircuit, color: '#A855F7', badge: '5+' },
    { to: '/challenges', label: 'التحديات', icon: Trophy, color: '#F59E0B' },
    { to: '/projects', label: 'المشاريع', icon: Rocket, color: '#EC4899' },
    { to: '/english', label: 'الإنجليزي', icon: Globe, color: '#3B82F6' },
  ]

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-950/80 border border-cyan-500/40 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,240,255,0.25)] text-white"
    >
      {/* Dock Brand Orb */}
      <div className="flex items-center gap-2 pl-3 border-l border-cyan-500/30">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 15, ease: 'linear' }}
          className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.5)]"
        >
          <Zap className="w-4 h-4 text-white fill-current" />
        </motion.div>
        <span className="font-extrabold text-xs tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 hidden md:inline">
          MASAR 2026
        </span>
      </div>

      {/* Navigation Dock Links */}
      <div className="flex items-center gap-1">
        {dockLinks.map((link) => {
          const isActive = location.pathname === link.to
          const Icon = link.icon

          return (
            <Link
              key={link.to}
              to={link.to}
              className={`relative flex flex-col items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-2xl transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-b from-cyan-500/30 to-purple-600/30 text-white border border-cyan-400/60 shadow-[0_0_20px_rgba(0,240,255,0.4)] scale-110'
                  : 'text-slate-400 hover:text-white hover:bg-white/10 hover:scale-105'
              }`}
            >
              <Icon className="w-5 h-5" style={{ color: isActive ? link.color : undefined }} />
              <span className="text-[9px] font-semibold mt-0.5 hidden md:block">
                {link.label}
              </span>

              {link.badge && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-pink-500 text-white shadow-sm">
                  {link.badge}
                </span>
              )}

              {isActive && (
                <motion.div
                  layoutId="dock-active-dot"
                  className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00F0FF]"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          )
        })}
      </div>

      {/* Identity Switcher Button inside Dock */}
      <div className="pr-3 border-r border-cyan-500/30">
        <button
          onClick={() => setIdentityMode('classic')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-500 transition-all cursor-pointer shadow-md"
          title="العودة للهوية الكلاسيكية"
        >
          <span>🏛️</span>
          <span className="hidden sm:inline">الهوية الكلاسيكية</span>
        </button>
      </div>
    </motion.div>
  )
}
