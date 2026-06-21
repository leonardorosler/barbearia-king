import { lazy, Suspense, ReactNode } from 'react'
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
} from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import type { Papel } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// Lazy imports
// ─────────────────────────────────────────────────────────────────────────────

// Públicas
const LandingPage      = lazy(() => import('@/pages/public/LandingPage'))
const Login            = lazy(() => import('@/pages/public/Login'))
const Cadastro         = lazy(() => import('@/pages/public/Cadastro'))
const EsqueceuSenha    = lazy(() => import('@/pages/public/EsqueceuSenha'))
const RedefinirSenha   = lazy(() => import('@/pages/public/RedefinirSenha'))
const PagamentoSucesso = lazy(() => import('@/pages/public/PagamentoSucesso'))
const PagamentoFalha   = lazy(() => import('@/pages/public/PagamentoFalha'))

// Cliente
const ClienteDashboard       = lazy(() => import('@/pages/cliente/Dashboard'))
const ClienteAgendamentos    = lazy(() => import('@/pages/cliente/Agendamentos'))
const ClienteNovoAgendamento = lazy(() => import('@/pages/cliente/NovoAgendamento'))
const ClienteAssinatura      = lazy(() => import('@/pages/cliente/Assinatura'))
const ClientePerfil          = lazy(() => import('@/pages/cliente/Perfil'))

// Barbeiro
const BarbeiroDashboard      = lazy(() => import('@/pages/barbeiro/Dashboard'))
const BarbeiroAgenda         = lazy(() => import('@/pages/barbeiro/Agenda'))
const BarbeiroDisponibilidade= lazy(() => import('@/pages/barbeiro/Disponibilidade'))
const BarbeiroFolgas         = lazy(() => import('@/pages/barbeiro/Folgas'))
const BarbeiroPerfil         = lazy(() => import('@/pages/barbeiro/Perfil'))

// Admin
const AdminDashboard    = lazy(() => import('@/pages/admin/Dashboard'))
const AdminBarbeiros    = lazy(() => import('@/pages/admin/Barbeiros'))
const AdminClientes     = lazy(() => import('@/pages/admin/Clientes'))
const AdminServicos     = lazy(() => import('@/pages/admin/Servicos'))
const AdminPlanos       = lazy(() => import('@/pages/admin/Planos'))
const AdminAssinaturas  = lazy(() => import('@/pages/admin/Assinaturas'))
const AdminAgendamentos = lazy(() => import('@/pages/admin/Agendamentos'))
const AdminConfiguracoes= lazy(() => import('@/pages/admin/Configuracoes'))

// ─────────────────────────────────────────────────────────────────────────────
// Fallback de Suspense
// ─────────────────────────────────────────────────────────────────────────────

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
        <span className="text-surface-500 text-sm font-body">Carregando…</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Página 404
// ─────────────────────────────────────────────────────────────────────────────

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-surface-950 gap-4">
      <span className="text-7xl font-display font-bold text-brand-500">404</span>
      <p className="text-surface-400 font-body">Página não encontrada.</p>
      <a
        href="/"
        className="text-brand-400 hover:text-brand-300 underline underline-offset-4 font-body text-sm transition-colors"
      >
        Voltar ao início
      </a>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Guards
// ─────────────────────────────────────────────────────────────────────────────

const DESTINO_POR_PAPEL: Record<Papel, string> = {
  CLIENTE:  '/cliente/dashboard',
  BARBEIRO: '/barbeiro/dashboard',
  ADMIN:    '/admin/dashboard',
}

interface GuardProps {
  papelRequerido: Papel
  redirectTo?: string
  children?: ReactNode
}

function Guard({ papelRequerido, redirectTo = '/login' }: GuardProps) {
  const { isAutenticado, papel } = useAuth()

  if (!isAutenticado) return <Navigate to={redirectTo} replace />

  if (papel !== papelRequerido) {
    const destino = papel ? DESTINO_POR_PAPEL[papel] : redirectTo
    return <Navigate to={destino} replace />
  }

  return <Outlet />
}

function GuardPublico() {
  const { isAutenticado, papel } = useAuth()

  if (isAutenticado && papel) {
    return <Navigate to={DESTINO_POR_PAPEL[papel]} replace />
  }

  return <Outlet />
}

// ─────────────────────────────────────────────────────────────────────────────
// Wrapper Suspense
// ─────────────────────────────────────────────────────────────────────────────

function Page({ component: Component }: { component: React.ComponentType }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Roteador com layouts
// ─────────────────────────────────────────────────────────────────────────────

const router = createBrowserRouter([

  // ── Layout público (navbar + footer) ─────────────────────────────────────
  {
    element: <PublicLayout />,
    children: [
      { path: '/',                  element: <Page component={LandingPage} /> },
      { path: '/pagamento/sucesso', element: <Page component={PagamentoSucesso} /> },
      { path: '/pagamento/falha',   element: <Page component={PagamentoFalha} /> },

      // Rotas de auth — sem navbar ocupando foco, mas ainda dentro do layout público
      {
        element: <GuardPublico />,
        children: [
          { path: '/login',           element: <Page component={Login} /> },
          { path: '/cadastro',        element: <Page component={Cadastro} /> },
          { path: '/esqueceu-senha',  element: <Page component={EsqueceuSenha} /> },
          { path: '/redefinir-senha', element: <Page component={RedefinirSenha} /> },
        ],
      },
    ],
  },

  // ── Layout dashboard (sidebar) — CLIENTE ─────────────────────────────────
  {
    element: <DashboardLayout />,
    children: [
      {
        path: '/cliente',
        element: <Guard papelRequerido="CLIENTE" />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard',        element: <Page component={ClienteDashboard} /> },
          { path: 'agendamentos',     element: <Page component={ClienteAgendamentos} /> },
          { path: 'novo-agendamento', element: <Page component={ClienteNovoAgendamento} /> },
          { path: 'assinatura',       element: <Page component={ClienteAssinatura} /> },
          { path: 'perfil',           element: <Page component={ClientePerfil} /> },
        ],
      },
    ],
  },

  // ── Layout dashboard — BARBEIRO ───────────────────────────────────────────
  {
    element: <DashboardLayout />,
    children: [
      {
        path: '/barbeiro',
        element: <Guard papelRequerido="BARBEIRO" />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard',        element: <Page component={BarbeiroDashboard} /> },
          { path: 'agenda',           element: <Page component={BarbeiroAgenda} /> },
          { path: 'disponibilidade',  element: <Page component={BarbeiroDisponibilidade} /> },
          { path: 'folgas',           element: <Page component={BarbeiroFolgas} /> },
          { path: 'perfil',           element: <Page component={BarbeiroPerfil} /> },
        ],
      },
    ],
  },

  // ── Layout dashboard — ADMIN ──────────────────────────────────────────────
  {
    element: <DashboardLayout />,
    children: [
      {
        path: '/admin',
        element: <Guard papelRequerido="ADMIN" />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard',     element: <Page component={AdminDashboard} /> },
          { path: 'barbeiros',     element: <Page component={AdminBarbeiros} /> },
          { path: 'clientes',      element: <Page component={AdminClientes} /> },
          { path: 'servicos',      element: <Page component={AdminServicos} /> },
          { path: 'planos',        element: <Page component={AdminPlanos} /> },
          { path: 'assinaturas',   element: <Page component={AdminAssinaturas} /> },
          { path: 'agendamentos',  element: <Page component={AdminAgendamentos} /> },
          { path: 'configuracoes', element: <Page component={AdminConfiguracoes} /> },
        ],
      },
    ],
  },

  // ── 404 ───────────────────────────────────────────────────────────────────
  { path: '*', element: <NotFound /> },
])

// ─────────────────────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────────────────────

export function AppRouter() {
  return <RouterProvider router={router} />
}