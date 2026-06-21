import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────────────────────
// Bloco base animado
// ─────────────────────────────────────────────────────────────────────────────

interface SkeletonBlockProps {
  className?: string
}

function SkeletonBlock({ className }: SkeletonBlockProps) {
  return (
    <div
      className={cn(
        'rounded bg-gradient-to-r',
        'from-surface-800 via-surface-700 to-surface-800',
        'bg-[length:200%_100%]',
        'animate-shimmer',
        className,
      )}
    />
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Linha de texto
// ─────────────────────────────────────────────────────────────────────────────

interface SkeletonTextProps {
  lines?:  number
  /** Última linha mais curta para parecer texto real */
  widths?: string[]
  className?: string
}

export function SkeletonText({
  lines    = 3,
  widths,
  className,
}: SkeletonTextProps) {
  const defaultWidths = ['w-full', 'w-5/6', 'w-4/6']

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock
          key={i}
          className={cn(
            'h-4',
            widths
              ? widths[i] ?? 'w-full'
              : defaultWidths[i % defaultWidths.length],
          )}
        />
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Avatar
// ─────────────────────────────────────────────────────────────────────────────

interface SkeletonAvatarProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const avatarSizes = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-14 h-14' }

export function SkeletonAvatar({ size = 'md', className }: SkeletonAvatarProps) {
  return (
    <SkeletonBlock
      className={cn('rounded-full shrink-0', avatarSizes[size], className)}
    />
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Card
// ─────────────────────────────────────────────────────────────────────────────

interface SkeletonCardProps {
  hasAvatar?: boolean
  lines?:     number
  className?: string
}

export function SkeletonCard({
  hasAvatar = false,
  lines     = 3,
  className,
}: SkeletonCardProps) {
  return (
    <div
      className={cn(
        'bg-surface-900 border border-surface-800 rounded-xl p-5',
        'flex flex-col gap-4',
        className,
      )}
    >
      {hasAvatar && (
        <div className="flex items-center gap-3">
          <SkeletonAvatar />
          <div className="flex flex-col gap-2 flex-1">
            <SkeletonBlock className="h-4 w-1/3" />
            <SkeletonBlock className="h-3 w-1/2" />
          </div>
        </div>
      )}
      <SkeletonText lines={lines} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tabela
// ─────────────────────────────────────────────────────────────────────────────

interface SkeletonTableProps {
  rows?:    number
  columns?: number
  className?: string
}

export function SkeletonTable({
  rows    = 5,
  columns = 4,
  className,
}: SkeletonTableProps) {
  return (
    <div className={cn('w-full', className)}>
      {/* Header */}
      <div
        className="grid gap-4 px-4 py-3 border-b border-surface-800"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonBlock key={i} className="h-3 w-3/4" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="grid gap-4 px-4 py-4 border-b border-surface-800/50"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <SkeletonBlock
              key={colIdx}
              className={cn(
                'h-4',
                colIdx === 0 ? 'w-4/5' : 'w-3/5',
              )}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Export genérico (bloco livre)
// ─────────────────────────────────────────────────────────────────────────────

export { SkeletonBlock as Skeleton }
