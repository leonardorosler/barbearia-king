import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios'
import type { RefreshTokenResponse } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// Chaves do localStorage
// ─────────────────────────────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  ACCESS_TOKEN:  'monky:accessToken',
  REFRESH_TOKEN: 'monky:refreshToken',
  BARBEARIA_ID:  'monky:barbeariaId',
  USUARIO:       'monky:usuario',
} as const

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de storage
// ─────────────────────────────────────────────────────────────────────────────

export const storage = {
  getAccessToken:  () => localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
  getRefreshToken: () => localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
  getBarbeariaId:  () => localStorage.getItem(STORAGE_KEYS.BARBEARIA_ID),

  getUsuario: <T>(): T | null => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USUARIO)
      return raw ? (JSON.parse(raw) as T) : null
    } catch {
      return null
    }
  },

  setUsuario: (usuario: unknown) => {
    localStorage.setItem(STORAGE_KEYS.USUARIO, JSON.stringify(usuario))
  },

  setTokens: (access: string, refresh: string) => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN,  access)
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh)
  },

  setBarbeariaId: (id: string) => {
    localStorage.setItem(STORAGE_KEYS.BARBEARIA_ID, id)
  },

  clear: () => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USUARIO)
    // Mantém o barbeariaId — ele vem do slug, não da sessão do usuário
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Rotas públicas — o interceptor nunca redireciona para /login nelas
const PUBLIC_PATHS = ['/', '/login', '/cadastro', '/esqueceu-senha', '/redefinir-senha', '/pagamento']

function isPublicPath() {
  return PUBLIC_PATHS.some(p => window.location.pathname === p || window.location.pathname.startsWith(p + '/'))
}

// Flag interna: marca requisições de refresh para evitar loop infinito
// ─────────────────────────────────────────────────────────────────────────────

const REFRESH_URL = '/auth/refresh'

// Extende a config do Axios para suportar a flag _isRetry
interface RetryConfig extends InternalAxiosRequestConfig {
  _isRetry?: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Fila de requisições pausadas durante o refresh
// ─────────────────────────────────────────────────────────────────────────────

type QueueItem = {
  resolve: (token: string) => void
  reject:  (err: unknown) => void
}

let isRefreshing = false
let failedQueue:  QueueItem[] = []

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((item) => {
    if (error) {
      item.reject(error)
    } else {
      item.resolve(token as string)
    }
  })
  failedQueue = []
}

// ─────────────────────────────────────────────────────────────────────────────
// Instância Axios
// ─────────────────────────────────────────────────────────────────────────────

export const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
})

// ─────────────────────────────────────────────────────────────────────────────
// Request interceptor — injeta tokens e x-barbearia-id
// ─────────────────────────────────────────────────────────────────────────────

api.interceptors.request.use(
  (config: RetryConfig) => {
    const accessToken = storage.getAccessToken()
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }

    const barbeariaId = storage.getBarbeariaId()
    if (barbeariaId) {
      config.headers['x-barbearia-id'] = barbeariaId
    }

    return config
  },
  (error) => Promise.reject(error),
)

// ─────────────────────────────────────────────────────────────────────────────
// Response interceptor — trata 401 e faz refresh token
// ─────────────────────────────────────────────────────────────────────────────

api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig

    // Não há resposta ou não é 401 — repassa o erro
    if (!error.response || error.response.status !== 401) {
      return Promise.reject(error)
    }

    // Se a própria requisição de refresh retornou 401 → sessão inválida
    if (originalRequest.url === REFRESH_URL) {
      storage.clear()
      if (!isPublicPath()) window.location.href = '/login'
      return Promise.reject(error)
    }

    // Evita retry infinito — se essa req já passou pelo retry, rejeita
    if (originalRequest._isRetry) {
      storage.clear()
      if (!isPublicPath()) window.location.href = '/login'
      return Promise.reject(error)
    }

    // Se já existe um refresh em andamento, enfileira e aguarda
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
        .then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return api(originalRequest)
        })
        .catch((err) => Promise.reject(err))
    }

    // Inicia o refresh
    originalRequest._isRetry = true
    isRefreshing = true

    const refreshToken = storage.getRefreshToken()

    if (!refreshToken) {
      isRefreshing = false
      storage.clear()
      if (!isPublicPath()) window.location.href = '/login'
      return Promise.reject(error)
    }

    try {
      const { data } = await api.post<RefreshTokenResponse>(REFRESH_URL, {
        refreshToken,
      })

      storage.setTokens(data.accessToken, data.refreshToken)
      api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`

      processQueue(null, data.accessToken)

      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
      return api(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)
      storage.clear()
      if (!isPublicPath()) window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default api