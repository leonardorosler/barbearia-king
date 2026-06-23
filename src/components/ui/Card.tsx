import { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?:       ReactNode
  description?: ReactNode
  footer?:      ReactNode
  hover?:       boolean
  padding?:     'none' | 'sm' | 'md' | 'lg'
  /** Borda dourada de destaque */
  highlighted?: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────────────────────────────

const paddingStyles = {
  none: '',
  sm:   'p-3',
  md:   'p-4 lg:p-5',
  lg:   'p-5 lg:p-6',
}

export function Card({
  title,
  description,
  footer,
  hover       = false,
  padding     = 'md',
  highlighted = false,
  children,
  className,
  ...props
}: CardProps) {
  const hasHeader = title || description

  return (
    <div
      className={cn(
        'min-w-0 bg-surface-900 rounded-xl border',
        'shadow-card',
        highlighted
          ? 'border-brand-500/50'
          : 'border-surface-800',
        hover && [
          'cursor-pointer',
          'transition-all duration-200 ease-smooth',
          'hover:-translate-y-0.5 hover:border-brand-500/25 hover:shadow-card-hover',
        ],
        className,
      )}
      {...props}
    >
      {/* Header */}
      {hasHeader && (
        <div
          className={cn(
            'min-w-0 border-b border-surface-800',
            paddingStyles[padding],
            children || footer ? 'pb-4' : '',
          )}
        >
          {title && (
            <h3 className="text-sm font-semibold font-body text-surface-100 leading-snug">
              {title}
            </h3>
          )}
          {description && (
            <p className="mt-0.5 text-xs font-body leading-relaxed text-surface-400">
              {description}
            </p>
          )}
        </div>
      )}

      {/* Body */}
      {children && (
        <div className={cn('min-w-0', paddingStyles[padding])}>
          {children}
        </div>
      )}

      {/* Footer */}
      {footer && (
        <div
          className={cn(
            'min-w-0 border-t border-surface-800',
            paddingStyles[padding],
            'pt-4',
          )}
        >
          {footer}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componentes para composição manual
// ─────────────────────────────────────────────────────────────────────────────

export function CardHeader({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('min-w-0 border-b border-surface-800 px-4 pb-4 pt-4 lg:px-5 lg:pt-5', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardBody({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('min-w-0 p-4 lg:p-5', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('min-w-0 border-t border-surface-800 px-4 pb-4 pt-4 lg:px-5 lg:pb-5', className)}
      {...props}
    >
      {children}
    </div>
  )
}
