import { ReactNode, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

export interface ModalProps {
  isOpen:   boolean
  onClose:  () => void
  title?:   string
  size?:    ModalSize
  children: ReactNode
  /** Impede fechar ao clicar no overlay */
  persistent?: boolean
  /** Esconde o botão X */
  hideClose?: boolean
  footer?:  ReactNode
}

// ─────────────────────────────────────────────────────────────────────────────
// Tamanhos
// ─────────────────────────────────────────────────────────────────────────────

const sizeStyles: Record<ModalSize, string> = {
  sm:   'max-w-sm',
  md:   'max-w-md',
  lg:   'max-w-lg',
  xl:   'max-w-2xl',
  full: 'max-w-[95vw] max-h-[95vh]',
}

// ─────────────────────────────────────────────────────────────────────────────
// Animações
// ─────────────────────────────────────────────────────────────────────────────

const overlayVariants: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
  exit:    { opacity: 0 },
}

const panelVariants: Variants = {
  hidden:  { opacity: 0, scale: 0.95, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 400, damping: 30 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 8,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────────────────────────────

export function Modal({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
  persistent = false,
  hideClose  = false,
  footer,
}: ModalProps) {
  // Fecha com Esc
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !persistent) onClose()
    },
    [onClose, persistent],
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        // Overlay
        <motion.div
          key="overlay"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.2 }}
          className={cn(
            'fixed inset-0 z-modal',
            'flex items-center justify-center p-4',
            'bg-black/60 backdrop-blur-sm',
          )}
          onClick={!persistent ? onClose : undefined}
        >
          {/* Painel */}
          <motion.div
            key="panel"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              'relative w-full bg-surface-900 rounded-xl shadow-glass',
              'border border-surface-700/50',
              'flex flex-col max-h-[90vh]',
              sizeStyles[size],
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {(title || !hideClose) && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-surface-800 shrink-0">
                {title && (
                  <h2 className="text-base font-display font-semibold text-surface-50">
                    {title}
                  </h2>
                )}
                {!hideClose && (
                  <button
                    onClick={onClose}
                    className={cn(
                      'ml-auto p-1.5 rounded-lg text-surface-400',
                      'hover:bg-surface-800 hover:text-surface-100',
                      'transition-colors duration-150',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                    )}
                    aria-label="Fechar modal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="px-6 py-4 border-t border-surface-800 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
