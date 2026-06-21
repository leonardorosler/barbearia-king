import {
  createContext,
  useCallback,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useRef,
} from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X, CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id:       string
  variant:  ToastVariant
  title:    string
  message?: string
  duration: number
}

export type ToastInput = Omit<ToastItem, 'id' | 'duration'> & {
  duration?: number
}

interface ToastContextValue {
  toast: (input: ToastInput) => void
  success: (title: string, message?: string) => void
  error:   (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info:    (title: string, message?: string) => void
  dismiss: (id: string) => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Estilos por variante
// ─────────────────────────────────────────────────────────────────────────────

const variantConfig: Record<
  ToastVariant,
  { icon: typeof CheckCircle2; container: string; iconClass: string; progress: string }
> = {
  success: {
    icon:      CheckCircle2,
    container: 'border-green-500/30 bg-surface-900',
    iconClass: 'text-green-400',
    progress:  'bg-green-500',
  },
  error: {
    icon:      XCircle,
    container: 'border-red-500/30 bg-surface-900',
    iconClass: 'text-red-400',
    progress:  'bg-red-500',
  },
  warning: {
    icon:      AlertTriangle,
    container: 'border-yellow-500/30 bg-surface-900',
    iconClass: 'text-yellow-400',
    progress:  'bg-yellow-500',
  },
  info: {
    icon:      Info,
    container: 'border-blue-500/30 bg-surface-900',
    iconClass: 'text-blue-400',
    progress:  'bg-blue-500',
  },
} as const

// ─────────────────────────────────────────────────────────────────────────────
// Item individual
// ─────────────────────────────────────────────────────────────────────────────

function ToastItemComponent({
  item,
  onDismiss,
}: {
  item: ToastItem
  onDismiss: (id: string) => void
}) {
  const config = variantConfig[item.variant]
  const Icon   = config.icon
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    timerRef.current = setTimeout(() => onDismiss(item.id), item.duration)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [item.id, item.duration, onDismiss])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{
        opacity: 0,
        x: 40,
        transition: { duration: 0.2 },
      }}
      className={cn(
        'relative w-80 rounded-xl border shadow-glass overflow-hidden',
        'flex items-start gap-3 p-4',
        config.container,
      )}
    >
      {/* Ícone */}
      <Icon className={cn('w-5 h-5 shrink-0 mt-0.5', config.iconClass)} />

      {/* Texto */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium font-body text-surface-100 leading-snug">
          {item.title}
        </p>
        {item.message && (
          <p className="text-xs font-body text-surface-400 mt-0.5 leading-relaxed">
            {item.message}
          </p>
        )}
      </div>

      {/* Fechar */}
      <button
        onClick={() => onDismiss(item.id)}
        className={cn(
          'shrink-0 p-0.5 rounded text-surface-500',
          'hover:text-surface-200 transition-colors',
        )}
        aria-label="Fechar notificação"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Barra de progresso */}
      <motion.div
        className={cn('absolute bottom-0 left-0 h-0.5', config.progress)}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: item.duration / 1000, ease: 'linear' }}
      />
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Contexto
// ─────────────────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((input: ToastInput) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [
      ...prev,
      { ...input, id, duration: input.duration ?? 4000 },
    ])
  }, [])

  const success = useCallback(
    (title: string, message?: string) => toast({ variant: 'success', title, message }),
    [toast],
  )
  const error = useCallback(
    (title: string, message?: string) => toast({ variant: 'error', title, message }),
    [toast],
  )
  const warning = useCallback(
    (title: string, message?: string) => toast({ variant: 'warning', title, message }),
    [toast],
  )
  const info = useCallback(
    (title: string, message?: string) => toast({ variant: 'info', title, message }),
    [toast],
  )

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info, dismiss }}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          className="fixed bottom-4 right-4 z-toast flex flex-col gap-2 items-end"
        >
          <AnimatePresence mode="popLayout">
            {toasts.map((item) => (
              <ToastItemComponent
                key={item.id}
                item={item}
                onDismiss={dismiss}
              />
            ))}
          </AnimatePresence>
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast deve ser usado dentro de <ToastProvider>')
  }
  return ctx
}
