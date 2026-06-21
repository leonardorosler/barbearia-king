import { forwardRef, InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?:     string
  error?:     string
  hint?:      string
  leftIcon?:  ReactNode
  rightIcon?: ReactNode
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────────────────────────────

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, hint, leftIcon, rightIcon, className, id, ...props },
    ref,
  ) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    const hasError = !!error

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium font-body text-surface-200 select-none"
          >
            {label}
            {props.required && (
              <span className="text-red-400 ml-1">*</span>
            )}
          </label>
        )}

        {/* Wrapper do input */}
        <div className="relative flex items-center">
          {/* Ícone esquerdo */}
          {leftIcon && (
            <span
              className={cn(
                'absolute left-3 flex items-center justify-center',
                'w-4 h-4 text-surface-400 pointer-events-none',
              )}
            >
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              // Base
              'w-full h-10 bg-surface-900 border rounded-md',
              'font-body text-sm text-surface-100 placeholder:text-surface-500',
              'transition-all duration-150 ease-smooth',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              // Padding condicional com ícones
              leftIcon  ? 'pl-9'  : 'pl-3',
              rightIcon ? 'pr-9'  : 'pr-3',
              // Estado normal
              !hasError && [
                'border-surface-700',
                'hover:border-surface-500',
                'focus:border-brand-500 focus:ring-brand-500/20',
              ],
              // Estado de erro
              hasError && [
                'border-red-500',
                'focus:border-red-500 focus:ring-red-500/20',
              ],
              // Disabled
              props.disabled && 'opacity-50 cursor-not-allowed bg-surface-950',
              className,
            )}
            {...props}
          />

          {/* Ícone direito */}
          {rightIcon && (
            <span
              className={cn(
                'absolute right-3 flex items-center justify-center',
                'w-4 h-4 text-surface-400',
              )}
            >
              {rightIcon}
            </span>
          )}
        </div>

        {/* Mensagem de erro */}
        {hasError && (
          <p className="text-xs font-body text-red-400 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}

        {/* Hint (só aparece se não houver erro) */}
        {hint && !hasError && (
          <p className="text-xs font-body text-surface-500">{hint}</p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
