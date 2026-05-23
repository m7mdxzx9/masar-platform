import React, { useRef, useState } from 'react'
import { cn } from '@/lib/util'
import { useTheme } from '@/theme/ThemeContext'

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
    const { theme } = useTheme()
    const btnRef = useRef<HTMLButtonElement | null>(null)
    const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null)

    const base =
      'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 active:scale-[0.97] select-none relative overflow-hidden'

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top })
      setTimeout(() => setRipple(null), 600)
      props.onClick?.(e)
    }

    const variants: Record<ButtonVariant, React.CSSProperties> = {
      primary: {
        background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})`,
        color: '#fff',
        boxShadow: `0 4px 16px ${theme.colors.secondary}40`,
      },
      outline: {
        border: `1.5px solid ${theme.colors.accent}40`,
        color: theme.colors.accent,
        background: 'transparent',
      },
      ghost: {
        color: theme.colors.textMuted,
        background: 'transparent',
      },
      neon: {
        border: `1px solid ${theme.colors.accent}30`,
        color: theme.colors.accent,
        background: 'transparent',
      },
      danger: {
        backgroundColor: `${theme.colors.error}15`,
        color: theme.colors.error,
        border: `1px solid ${theme.colors.error}30`,
      },
    }

    const sizes: Record<ButtonSize, string> = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2.5 text-base',
      lg: 'px-6 py-3 text-lg',
    }

    return (
      <button
        ref={(node) => {
          btnRef.current = node
          if (typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
        }}
        className={cn(base, sizes[size], fullWidth && 'w-full', className)}
        style={variants[variant]}
        onClick={handleClick}
        {...props}
      >
        {ripple && (
          <span
            className="absolute rounded-full pointer-events-none animate-ping"
            style={{
              left: ripple.x - 8,
              top: ripple.y - 8,
              width: 16,
              height: 16,
              backgroundColor: 'rgba(255,255,255,0.3)',
            }}
          />
        )}
        {startIcon && <span className="inline-flex shrink-0">{startIcon}</span>}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
