import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/util'

interface CardProps {
  children: React.ReactNode
  className?: string
  glow?: boolean
  hover?: boolean
}

export const Card: React.FC<CardProps> = ({ children, className, glow = false, hover = true }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { y: -4, boxShadow: '0 0 20px rgba(0, 255, 255, 0.15)' } : undefined}
      transition={{ duration: 0.3 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-masar-border bg-masar-surface/80 backdrop-blur-md p-6',
        glow && 'shadow-lg shadow-masar-cyan-glow',
        hover && 'hover:border-masar-cyan/20 hover:shadow-masar-cyan-glow transition-all duration-300',
        className
      )}
    >
      {children}
    </motion.div>
  )
}

export const GlassCard: React.FC<CardProps> = ({ children, className, glow = false, hover = true }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { y: -4, boxShadow: '0 0 20px rgba(36, 0, 255, 0.15)' } : undefined}
      transition={{ duration: 0.3 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-masar-border/50 bg-masar-surface/60 backdrop-blur-xl p-6',
        glow && 'shadow-lg shadow-masar-blue-glow',
        hover && 'hover:border-masar-cyan/20 transition-all duration-300',
        className
      )}
    >
      {children}
    </motion.div>
  )
}
