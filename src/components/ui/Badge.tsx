import { cn } from '@/lib/utils'
import type { StatusAgendamento, StatusAssinatura } from '@/types'
import {
  LABEL_STATUS_AGENDAMENTO,
  LABEL_STATUS_ASSINATURA,
} from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'muted'
  | 'brand'

export interface BadgeProps {
  children?: React.ReactNode
  variant?:  BadgeVariant
  /** Renderiza um ponto colorido antes do texto */
  dot?: boolean
  className?: string
}

export interface BadgeAgendamentoProps {
  status: StatusAgendamento
  dot?: boolean
  className?: string
}

export interface BadgeAssinaturaProps {
  status: StatusAssinatura
  dot?: boolean
  className?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Estilos por variante
// ─────────────────────────────────────────────────────────────────────────────

const variantStyles: Record<BadgeVariant, { badge: string; dot: string }> = {
  default: {
    badge: 'bg-surface-800 text-surface-300 border-surface-700',
    dot:   'bg-surface-400',
  },
  success: {
    badge: 'bg-green-500/15 text-green-400 border-green-500/30',
    dot:   'bg-green-400',
  },
  warning: {
    badge: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    dot:   'bg-yellow-400',
  },
  danger: {
    badge: 'bg-red-500/15 text-red-400 border-red-500/30',
    dot:   'bg-red-400',
  },
  info: {
    badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    dot:   'bg-blue-400',
  },
  muted: {
    badge: 'bg-surface-800/60 text-surface-500 border-surface-700/50',
    dot:   'bg-surface-500',
  },
  brand: {
    badge: 'bg-brand-500/15 text-brand-400 border-brand-500/30',
    dot:   'bg-brand-400',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Mapeamento de status → variante
// ─────────────────────────────────────────────────────────────────────────────

const statusAgendamentoVariant: Record<StatusAgendamento, BadgeVariant> = {
  PENDENTE:       'warning',
  CONFIRMADO:     'info',
  CONCLUIDO:      'success',
  CANCELADO:      'danger',
  NAO_COMPARECEU: 'muted',
}

const statusAssinaturaVariant: Record<StatusAssinatura, BadgeVariant> = {
  ATIVA:        'success',
  CANCELADA:    'danger',
  INADIMPLENTE: 'warning',
  EXPIRADA:     'muted',
}

// ─────────────────────────────────────────────────────────────────────────────
// Badge base
// ─────────────────────────────────────────────────────────────────────────────

export function Badge({
  children,
  variant = 'default',
  dot = false,
  className,
}: BadgeProps) {
  const styles = variantStyles[variant]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5',
        'px-2.5 py-0.5 rounded-full',
        'text-xs font-medium font-body',
        'border',
        styles.badge,
        className,
      )}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', styles.dot)} />
      )}
      {children}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Badge semântico — Agendamento
// ─────────────────────────────────────────────────────────────────────────────

export function BadgeAgendamento({ status, dot = true, className }: BadgeAgendamentoProps) {
  return (
    <Badge
      variant={statusAgendamentoVariant[status]}
      dot={dot}
      className={className}
    >
      {LABEL_STATUS_AGENDAMENTO[status]}
    </Badge>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Badge semântico — Assinatura
// ─────────────────────────────────────────────────────────────────────────────

export function BadgeAssinatura({ status, dot = true, className }: BadgeAssinaturaProps) {
  return (
    <Badge
      variant={statusAssinaturaVariant[status]}
      dot={dot}
      className={className}
    >
      {LABEL_STATUS_ASSINATURA[status]}
    </Badge>
  )
}
