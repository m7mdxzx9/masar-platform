import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Shield, Zap } from 'lucide-react'
import { useTheme } from '../../theme/ThemeContext'

interface IdentitySwitcherToggleProps {
  className?: string
  compact?: boolean
}

export const IdentitySwitcherToggle: React.FC<IdentitySwitcherToggleProps> = ({
  className = '',
  compact = false,
}) => {
  const { identityMode, setIdentityMode, toggleIdentityMode, direction } = useTheme()

  const isNextGen = identityMode === 'nextgen'

  if (compact) {
    return (
      <button
        onClick={toggleIdentityMode}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
          isNextGen
            ? 'bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_15px_rgba(0,240,255,0.25)]'
            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
        } ${className}`}
        title="انقر للتنقل بين الهوية الكلاسيكية وهوية الجيل الجديد"
      >
        {isNextGen ? <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> : <Shield className="w-3.5 h-3.5 text-slate-400" />}
        <span>{isNextGen ? (direction === 'rtl' ? 'الجيل الجديد 2026' : 'Next-Gen 2026') : (direction === 'rtl' ? 'الهوية الكلاسيكية' : 'Classic Mode')}</span>
      </button>
    )
  }

  return (
    <div className={`flex items-center p-1 rounded-full bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-lg ${className}`}>
      {/* Classic Button */}
      <button
        onClick={() => setIdentityMode('classic')}
        className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer z-10 ${
          !isNextGen
            ? 'text-white'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        {!isNextGen && (
          <motion.div
            layoutId="identity-pill"
            className="absolute inset-0 bg-slate-800 border border-slate-700 rounded-full shadow-md -z-10"
            transition={{ type: 'spring', duration: 0.4 }}
          />
        )}
        <Shield className="w-3.5 h-3.5" />
        <span>{direction === 'rtl' ? 'الهوية الكلاسيكية' : 'Classic Mode'}</span>
      </button>

      {/* Next-Gen Button */}
      <button
        onClick={() => setIdentityMode('nextgen')}
        className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer z-10 ${
          isNextGen
            ? 'text-cyan-300'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        {isNextGen && (
          <motion.div
            layoutId="identity-pill"
            className="absolute inset-0 bg-gradient-to-r from-cyan-500/25 via-indigo-500/25 to-purple-500/25 border border-cyan-400/50 rounded-full shadow-[0_0_20px_rgba(0,240,255,0.3)] -z-10"
            transition={{ type: 'spring', duration: 0.4 }}
          />
        )}
        <Sparkles className={`w-3.5 h-3.5 ${isNextGen ? 'text-cyan-400 animate-spin-slow' : ''}`} />
        <span>{direction === 'rtl' ? 'هوية الجيل الجديد 🚀' : 'Next-Gen AI 🚀'}</span>
      </button>
    </div>
  )
}
