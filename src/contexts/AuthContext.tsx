import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import { api, storage } from '@/services/api'
import type {
  AuthResponse,
  CadastroInput,
  LoginInput,
  Papel,
  UsuarioResumido,
} from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  usuario: UsuarioResumido | null
  isAutenticado: boolean
  isCarregando: boolean
  papel: Papel | null
  login:   (dados: LoginInput)   => Promise<UsuarioResumido>
  cadastro:(dados: CadastroInput)=> Promise<UsuarioResumido>
  logout:  () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Contexto
// ─────────────────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario]   = useState<UsuarioResumido | null>(null)
  const [isCarregando, setIsCarregando] = useState(true)

  // ── Restauração de sessão ─────────────────────────────────────────────────
  // Lê o usuário do localStorage — sem chamada de API.
  // O token será validado naturalmente na primeira requisição autenticada.
  // Se estiver expirado, o interceptor tentará o refresh automaticamente.
  // Só redireciona para /login quando o refresh também falhar — e apenas
  // se o usuário estiver em uma rota protegida que de fato exigiu o token.
  useEffect(() => {
    const accessToken = storage.getAccessToken()
    const refreshToken = storage.getRefreshToken()

    if (accessToken && refreshToken) {
      const salvo = storage.getUsuario<UsuarioResumido>()
      if (salvo) setUsuario(salvo)
    }

    setIsCarregando(false)
  }, [])

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (dados: LoginInput): Promise<UsuarioResumido> => {
    const { data } = await api.post<AuthResponse>('/auth/login', dados)
    storage.setTokens(data.accessToken, data.refreshToken)
    storage.setUsuario(data.usuario)
    setUsuario(data.usuario)
    return data.usuario
  }, [])

  // ── Cadastro ──────────────────────────────────────────────────────────────
  const cadastro = useCallback(async (dados: CadastroInput): Promise<UsuarioResumido> => {
    const { data } = await api.post<AuthResponse>('/auth/cadastro', dados)
    storage.setTokens(data.accessToken, data.refreshToken)
    storage.setUsuario(data.usuario)
    setUsuario(data.usuario)
    return data.usuario
  }, [])

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    const refreshToken = storage.getRefreshToken()
    if (refreshToken) {
      api.post('/auth/logout', { refreshToken }).catch(() => null)
    }
    storage.clear()
    setUsuario(null)
    window.location.href = '/login'
  }, [])

  return (
    <AuthContext.Provider
      value={{
        usuario,
        isAutenticado: !!usuario,
        isCarregando,
        papel: usuario?.papel ?? null,
        login,
        cadastro,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}
