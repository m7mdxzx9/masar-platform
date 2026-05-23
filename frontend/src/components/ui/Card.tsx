import { motion } from 'framer-motion'
import { cn } from '@/lib/util'
import { useTheme } from '@/theme/ThemeContext'

interface CardProps {
  children: React.ReactNode
  className?: string
  glow?: boolean
  hover?: boolean
  accent?: 'top' | 'none'
}

export const Card: React.FC<CardProps> = ({ children, className, glow = false, hover = true, accent = 'none' }) => {
  const { theme } = useTheme()
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      whileHover={hover ? { y: -3, transition: { duration: 0.2 } } : undefined}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={cn(
        'relative overflow-hidden rounded-2xl border transition-all duration-200',
        hover && 'cursor-default',
        className
      )}
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: glow ? theme.colors.accent + '30' : theme.colors.border,
        boxShadow: glow
          ? `0 0 24px ${theme.colors.accentGlow}, 0 8px 32px rgba(0,0,0,0.15)`
          : `0 4px 24px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.08)`,
      }}
    >
      {accent === 'top' && (
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ background: `linear-gradient(90deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}
        />
      )}
      {children}
    </motion.div>
  )
}

export const GlassCard: React.FC<CardProps> = ({ children, className, glow = false, hover = true }) => {
  const { theme } = useTheme()
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      whileHover={hover ? { y: -3, transition: { duration: 0.2 } } : undefined}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={cn(
        'relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-200',
        hover && 'cursor-default',
        className
      )}
      style={{
        backgroundColor: `${theme.colors.surface}60`,
        borderColor: glow ? theme.colors.accent + '30' : theme.colors.border + '50',
        boxShadow: glow
          ? `0 0 24px ${theme.colors.accentGlow}, 0 8px 32px rgba(0,0,0,0.15)`
          : `0 4px 24px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.08)`,
      }}
    >
      {children}
    </motion.div>
  )
}
