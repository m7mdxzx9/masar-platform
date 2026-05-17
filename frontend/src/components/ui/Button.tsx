import React from 'react'
import { cn } from '@/lib/util'

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'neon' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  startIcon?: React.ReactNode
  children: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className, variant = 'primary', size = 'md', fullWidth, startIcon, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 active:scale-[0.98] hover:scale-[1.02] active:scale-[0.95]'
    const variants: Record<ButtonVariant, string> = {
      primary: 'bg-masar-blue text-white shadow-lg shadow-masar-blue/20 hover:bg-masar-blue/90',
      outline: 'border-2 border-masar-cyan/30 text-masar-cyan hover:bg-masar-cyan/10 hover:border-masar-cyan/50',
      ghost: 'text-masar-text-muted hover:text-masar-text hover:bg-masar-surface',
      neon: 'border border-masar-cyan/40 text-masar-cyan bg-transparent hover:bg-masar-cyan/10 hover:shadow-[0_0_15px_rgba(0,255,255,0.2)]',
      danger: 'bg-masar-error/20 text-masar-error border border-masar-error/30 hover:bg-masar-error/30',
    }
    const sizes: Record<ButtonSize, string> = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2.5 text-base',
      lg: 'px-6 py-3 text-lg',
    }

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
        {...props}
      >
        {startIcon && <span className="inline-flex">{startIcon}</span>}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
