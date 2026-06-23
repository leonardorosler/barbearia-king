import { useState, useEffect } from 'react'
import { Link, useLocation, Outlet, NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarDays,
  CalendarPlus,
  CreditCard,
  User,
  Clock,
  UmbrellaOff,
  Users,
  Scissors,
  PackageCheck,
  ClipboardList,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useBarbearia } from '@/contexts/BarbeariaContext'
import { cn } from '@/lib/utils'
import type { Papel } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// Configuração de navegação por papel
// ─────────────────────────────────────────────────────────────────────────────

interface NavItem {
  label: string
  to:    string
  icon:  React.ComponentType<{ className?: string }>
}

const NAV_POR_PAPEL: Record<Papel, NavItem[]> = {
  CLIENTE: [
    { label: 'Dashboard',       to: '/cliente/dashboard',        icon: LayoutDashboard },
    { label: 'Agendamentos',    to: '/cliente/agendamentos',     icon: CalendarDays    },
    { label: 'Novo Agendamento',to: '/cliente/novo-agendamento', icon: CalendarPlus    },
    { label: 'Meu Plano',       to: '/cliente/assinatura',       icon: CreditCard      },
    { label: 'Meu Perfil',      to: '/cliente/perfil',           icon: User            },
  ],
  BARBEIRO: [
    { label: 'Dashboard',       to: '/barbeiro/dashboard',       icon: LayoutDashboard },
    { label: 'Minha Agenda',    to: '/barbeiro/agenda',          icon: CalendarDays    },
    { label: 'Disponibilidade', to: '/barbeiro/disponibilidade', icon: Clock           },
    { label: 'Folgas',          to: '/barbeiro/folgas',          icon: UmbrellaOff     },
    { label: 'Meu Perfil',      to: '/barbeiro/perfil',          icon: User            },
  ],
  ADMIN: [
    { label: 'Dashboard',       to: '/admin/dashboard',          icon: LayoutDashboard },
    { label: 'Barbeiros',       to: '/admin/barbeiros',          icon: Scissors        },
    { label: 'Clientes',        to: '/admin/clientes',           icon: Users           },
    { label: 'Serviços',        to: '/admin/servicos',           icon: PackageCheck    },
    { label: 'Planos',          to: '/admin/planos',             icon: CreditCard      },
    { label: 'Assinaturas',     to: '/admin/assinaturas',        icon: ClipboardList   },
    { label: 'Agendamentos',    to: '/admin/agendamentos',       icon: CalendarDays    },
    { label: 'Configurações',   to: '/admin/configuracoes',      icon: Settings        },
  ],
}

const LABEL_PAPEL: Record<Papel, string> = {
  CLIENTE:  'Cliente',
  BARBEIRO: 'Barbeiro',
  ADMIN:    'Administrador',
}

// ─────────────────────────────────────────────────────────────────────────────
// Item de navegação
// ─────────────────────────────────────────────────────────────────────────────

function SidebarItem({
  item,
  onClick,
}: {
  item: NavItem
  onClick?: () => void
}) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'relative flex min-w-0 items-center gap-3 rounded-lg px-3 py-2.5',
          'text-sm font-body font-medium',
          'transition-all duration-200 group',
          isActive
            ? 'bg-brand-500/15 text-brand-300 border border-brand-500/25 shadow-brand-sm'
            : 'text-surface-400 hover:bg-surface-800/80 hover:text-surface-100 border border-transparent',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-brand-400 shadow-brand-sm" />
          )}
          <Icon
            className={cn(
              'w-4 h-4 shrink-0 transition-colors',
              isActive ? 'text-brand-400' : 'text-surface-500 group-hover:text-surface-300',
            )}
          />
          <span className="min-w-0 flex-1 whitespace-normal leading-snug">{item.label}</span>
          {isActive && (
            <ChevronRight className="w-3.5 h-3.5 text-brand-500/60 shrink-0" />
          )}
        </>
      )}
    </NavLink>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Conteúdo da sidebar (compartilhado entre desktop e drawer)
// ─────────────────────────────────────────────────────────────────────────────

function SidebarContent({
  items,
  onNavClick,
}: {
  items: NavItem[]
  onNavClick?: () => void
}) {
  const { barbearia }        = useBarbearia()
  const { usuario, papel, logout } = useAuth()

  return (
    <div className="flex h-full min-w-0 flex-col">
      {/* Logo */}
      <div className="border-b border-surface-800 px-4 py-5">
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <img src="/logoking.png" alt={barbearia.nome} className="h-7 w-auto shrink-0 object-contain" />
          <span className="font-display font-bold text-surface-50 truncate">
            {barbearia.nome}
          </span>
        </Link>
      </div>

      {/* Label do papel */}
      {papel && (
        <div className="px-4 pt-4 pb-2">
          <span className="text-2xs font-semibold font-body text-surface-600 uppercase tracking-widest">
            {LABEL_PAPEL[papel]}
          </span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-4">
        {items.map((item) => (
          <SidebarItem key={item.to} item={item} onClick={onNavClick} />
        ))}
      </nav>

      {/* Usuário + logout */}
      <div className="border-t border-surface-800 p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          {/* Avatar inicial */}
          <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold font-body text-brand-400">
              {usuario?.nome?.charAt(0).toUpperCase() ?? '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium font-body text-surface-100 truncate">
              {usuario?.nome}
            </p>
            <p className="text-xs font-body text-surface-500 truncate">
              {usuario?.email}
            </p>
          </div>
          <button
            onClick={logout}
            title="Sair"
            className={cn(
              'p-1.5 rounded-lg shrink-0',
              'text-surface-500 hover:text-red-400 hover:bg-red-500/10',
              'transition-colors duration-150',
            )}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Header mobile
// ─────────────────────────────────────────────────────────────────────────────

function MobileHeader({
  onMenuOpen,
}: {
  onMenuOpen: () => void
}) {
  const { barbearia }      = useBarbearia()
  const { usuario } = useAuth()

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-surface-800 bg-surface-950/95 px-4 backdrop-blur-md lg:hidden">
      {/* Hamburger */}
      <button
        onClick={onMenuOpen}
        className="p-2 rounded-lg text-surface-400 hover:bg-surface-800 hover:text-surface-100 transition-colors"
        aria-label="Abrir menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Logo centralizado */}
      <Link to="/" className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
        <img src="/logoking.png" alt={barbearia.nome} className="h-6 w-auto object-contain" />
      </Link>

      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
        <span className="text-xs font-bold font-body text-brand-400">
          {usuario?.nome?.charAt(0).toUpperCase() ?? '?'}
        </span>
      </div>
    </header>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout principal
// ─────────────────────────────────────────────────────────────────────────────

export function DashboardLayout() {
  const { papel }             = useAuth()
  const location              = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Fecha drawer ao navegar
  useEffect(() => setDrawerOpen(false), [location.pathname])

  if (!papel) return null

  const items = NAV_POR_PAPEL[papel]

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-surface-950">

      {/* ── Sidebar desktop ──────────────────────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[17rem] shrink-0 flex-col border-r border-surface-800 bg-surface-950 lg:flex">
        <SidebarContent items={items} />
      </aside>

      {/* ── Drawer mobile ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Overlay */}
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
            />
            {/* Painel */}
            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[88vw] flex-col border-r border-surface-800 bg-surface-950 lg:hidden"
            >
              {/* Botão fechar */}
              <button
                onClick={() => setDrawerOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-surface-400 hover:bg-surface-800 hover:text-surface-100 transition-colors"
                aria-label="Fechar menu"
              >
                <X className="w-4 h-4" />
              </button>
              <SidebarContent items={items} onNavClick={() => setDrawerOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Header mobile ────────────────────────────────────────────────── */}
      <MobileHeader onMenuOpen={() => setDrawerOpen(true)} />

      {/* ── Conteúdo principal ───────────────────────────────────────────── */}
      <main className={cn(
        'min-h-screen min-w-0 flex-1 overflow-x-hidden',
        'w-full lg:pl-[17rem]',
        'pt-14 lg:pt-0',
      )}>
        <div className="min-w-0 p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
