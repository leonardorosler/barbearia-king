import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import { publicApi, storage } from '@/services/api'
import type { Barbearia } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

interface BarbeariaContextValue {
  barbearia: Barbearia
  barbeariaId: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Contexto
// ─────────────────────────────────────────────────────────────────────────────

const BarbeariaContext = createContext<BarbeariaContextValue | null>(null)

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

interface BarbeariaProviderProps {
  children: ReactNode
}

export function BarbeariaProvider({ children }: BarbeariaProviderProps) {
  const [barbearia, setBarbearia] = useState<Barbearia | null>(null)
  const [error, setError]         = useState<string | null>(null)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    const slug = import.meta.env.VITE_BARBEARIA_SLUG

    if (!slug) {
      setError('VITE_BARBEARIA_SLUG não configurado no .env')
      setLoading(false)
      return
    }

    publicApi
      .get<Barbearia>(`/barbearia/slug/${slug}`)
      .then(({ data }) => {
        // Persiste o id para o interceptor de request injetar x-barbearia-id
        storage.setBarbeariaId(data.id)
        setBarbearia(data)
      })
      .catch(() => {
        setError(
          `Barbearia com slug "${slug}" não encontrada. Verifique o VITE_BARBEARIA_SLUG no .env.`,
        )
      })
      .finally(() => setLoading(false))
  }, [])

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
          <p className="text-surface-400 font-body text-sm animate-pulse-brand">
            Carregando barbearia…
          </p>
        </div>
      </div>
    )
  }

  // ── Erro ──────────────────────────────────────────────────────────────────
  if (error || !barbearia) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-950">
        <div className="max-w-md mx-auto text-center px-6">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-display font-semibold text-surface-50 mb-2">
            Barbearia não encontrada
          </h1>
          <p className="text-surface-400 font-body text-sm leading-relaxed">
            {error}
          </p>
        </div>
      </div>
    )
  }

  // ── App desbloqueado ──────────────────────────────────────────────────────
  return (
    <BarbeariaContext.Provider
      value={{ barbearia, barbeariaId: barbearia.id }}
    >
      {children}
    </BarbeariaContext.Provider>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useBarbearia(): BarbeariaContextValue {
  const ctx = useContext(BarbeariaContext)
  if (!ctx) {
    throw new Error('useBarbearia deve ser usado dentro de <BarbeariaProvider>')
  }
  return ctx
}
