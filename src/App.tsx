import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BarbeariaProvider } from '@/contexts/BarbeariaContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/components/ui/Toast'
import { AppRouter } from '@/routes'

// ─────────────────────────────────────────────────────────────────────────────
// QueryClient — configuração global
// ─────────────────────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Não refetch ao focar a janela (evita chamadas desnecessárias)
      refetchOnWindowFocus: false,
      // Tenta 1 vez em caso de erro antes de exibir falha
      retry: 1,
      // Cache de 5 minutos
      staleTime: 5 * 60 * 1000,
    },
    mutations: {
      retry: 0,
    },
  },
})

// ─────────────────────────────────────────────────────────────────────────────
// App
//
// Ordem dos providers:
// 1. BarbeariaProvider  — bloqueia tudo até ter o barbeariaId
// 2. AuthProvider       — restaura sessão (depende do barbeariaId no localStorage)
// 3. QueryClientProvider— TanStack Query disponível para toda a app
// 4. ToastProvider      — notificações disponíveis em qualquer componente
// 5. AppRouter          — roteamento (usa todos os contextos acima)
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BarbeariaProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <AppRouter />
          </ToastProvider>
        </QueryClientProvider>
      </AuthProvider>
    </BarbeariaProvider>
  )
}