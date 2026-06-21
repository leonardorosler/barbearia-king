import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
export type ButtonSize    = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  ButtonVariant
  size?:     ButtonSize
  loading?:  boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Estilos
// ─────────────────────────────────────────────────────────────────────────────

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 ' +
    'shadow-brand hover:shadow-brand-lg focus-visible:ring-brand-500',
  secondary:
    'bg-surface-800 text-surface-100 hover:bg-surface-700 active:bg-surface-600 ' +
    'focus-visible:ring-surface-500',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 ' +
    'focus-visible:ring-red-500',
  ghost:
    'bg-transparent text-surface-300 hover:bg-surface-800 hover:text-surface-100 ' +
    'active:bg-surface-700 focus-visible:ring-surface-500',
  outline:
    'bg-transparent border border-brand-500 text-brand-400 ' +
    'hover:bg-brand-500/10 active:bg-brand-500/20 focus-visible:ring-brand-500',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8  px-3   text-xs  gap-1.5 rounded',
  md: 'h-10 px-4   text-sm  gap-2   rounded-md',
  lg: 'h-12 px-6   text-base gap-2.5 rounded-lg',
}

const iconSizeStyles: Record<ButtonSize, string> = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4   h-4',
  lg: 'w-5   h-5',
}

// ─────────────────────────────────────────────────────────────────────────────
// Spinner
// ─────────────────────────────────────────────────────────────────────────────

function Spinner({ size }: { size: ButtonSize }) {
  return (
    <svg
      className={cn('animate-spin shrink-0', iconSizeStyles[size])}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12" cy="12" r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────────────────────────────

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant   = 'primary',
      size      = 'md',
      loading   = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      className,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          // Base
          'inline-flex items-center justify-center font-body font-medium',
          'transition-all duration-150 ease-smooth',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'focus-visible:ring-offset-surface-950',
          'select-none cursor-pointer',
          // Variante e tamanho
          variantStyles[variant],
          sizeStyles[size],
          // Estados
          isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
          fullWidth  && 'w-full',
          className,
        )}
        {...props}
      >
        {loading
          ? <Spinner size={size} />
          : leftIcon && (
              <span className={cn('shrink-0', iconSizeStyles[size])}>
                {leftIcon}
              </span>
            )
        }
        {children}
        {!loading && rightIcon && (
          <span className={cn('shrink-0', iconSizeStyles[size])}>
            {rightIcon}
          </span>
        )}
      </button>
    )
  },
)

Button.displayName = 'Button'
