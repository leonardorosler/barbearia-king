import { useState, useEffect } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { ArrowUpRight, CalendarPlus, Clock, MapPin, Menu, Phone, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBarbearia } from '@/contexts/BarbeariaContext'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { Papel } from '@/types'

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

// Links de navegação
// ─────────────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: 'Início',    to: '/' },
  { label: 'Serviços',  to: '/#servicos' },
  { label: 'Barbeiros', to: '/#barbeiros' },
  { label: 'Planos',    to: '/#planos' },
  { label: 'Contato',   to: '/#contato' },
]

const DASHBOARD_POR_PAPEL: Record<Papel, string> = {
  CLIENTE:  '/cliente/dashboard',
  BARBEIRO: '/barbeiro/dashboard',
  ADMIN:    '/admin/dashboard',
}

const HEADER_OFFSET = 84

function scrollToHash(hash: string) {
  const id = decodeURIComponent(hash.replace('#', ''))
  const element = document.getElementById(id)

  if (!element) return false

  const top = element.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET
  window.scrollTo({ top, behavior: 'smooth' })
  return true
}

function HashScroll() {
  const location = useLocation()

  useEffect(() => {
    if (location.pathname !== '/') return

    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    let attempts = 0
    let timer = 0

    const scrollWhenReady = () => {
      attempts += 1
      if (scrollToHash(location.hash) || attempts >= 10) return
      timer = window.setTimeout(scrollWhenReady, 100)
    }

    timer = window.setTimeout(scrollWhenReady, 80)
    return () => window.clearTimeout(timer)
  }, [location.pathname, location.hash])

  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// Navbar
// ─────────────────────────────────────────────────────────────────────────────

function Navbar() {
  const { barbearia }              = useBarbearia()
  const { isAutenticado, papel }   = useAuth()
  const location                   = useLocation()
  const [menuOpen, setMenuOpen]    = useState(false)
  const [scrolled, setScrolled]    = useState(false)
  const currentPath                = `${location.pathname}${location.hash}`

  // Sombra ao rolar
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Fecha menu ao navegar
  useEffect(() => setMenuOpen(false), [location.pathname, location.hash])

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-50',
        'transition-all duration-300',
        scrolled || menuOpen
          ? 'bg-surface-950/95 backdrop-blur-md border-b border-surface-800 shadow-card'
          : 'bg-transparent',
      )}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          {barbearia.logo ? (
            <img
              src={barbearia.logo}
              alt={barbearia.nome}
              className="h-8 w-auto object-contain"
            />
          ) : (
            <div className="w-8 h-8 rounded-md flex items-center justify-center p-0.5">
              {/* <Scissors className="w-4 h-4 text-white" /> */}
              <img src="/logoking.png" alt="" />
            </div>
          )}
          <span className="font-display font-bold text-surface-50 text-lg leading-none">
            {barbearia.nome}
          </span>
        </Link>

        {/* Links desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-body font-medium',
                'transition-colors duration-150',
                (link.to === '/' ? currentPath === '/' : currentPath === link.to)
                  ? 'text-brand-400 bg-brand-500/10'
                  : 'text-surface-300 hover:text-surface-100 hover:bg-surface-800',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA desktop */}
        <div className="hidden md:flex items-center gap-2">
          {isAutenticado && papel ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => window.location.href = DASHBOARD_POR_PAPEL[papel]}
            >
              Minha área
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => window.location.href = '/login'}>
                Entrar
              </Button>
              <Button variant="primary" size="sm" onClick={() => window.location.href = '/cadastro'}>
                Agendar
              </Button>
            </>
          )}
        </div>

        {/* Hamburger mobile */}
        <button
          className="md:hidden p-2 rounded-lg border border-surface-800 bg-surface-900 text-surface-200 hover:bg-surface-800 transition-colors"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Menu mobile */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 right-0 top-16 md:hidden overflow-hidden border-b border-surface-800 bg-surface-950 shadow-2xl shadow-black/40"
          >
            <nav className="flex flex-col gap-1 px-4 py-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="rounded-lg border border-transparent px-3 py-3 text-sm font-body font-semibold text-surface-200 transition-colors hover:border-surface-700 hover:bg-surface-900 hover:text-brand-300"
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 flex flex-col gap-2 border-t border-surface-800 pt-3">
                {isAutenticado && papel ? (
                  <Button fullWidth variant="primary" size="md" onClick={() => window.location.href = DASHBOARD_POR_PAPEL[papel]}>
                    Minha área
                  </Button>
                ) : (
                  <>
                    <Button fullWidth variant="outline" size="md" onClick={() => window.location.href = '/login'}>
                      Entrar
                    </Button>
                    <Button fullWidth variant="primary" size="md" onClick={() => window.location.href = '/cadastro'}>
                      Agendar agora
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────────────────────────────────────

function Footer() {
  const { barbearia } = useBarbearia()
  const instagram = barbearia.instagram?.replace('@', '')
  const mapsUrl = barbearia.endereco
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(barbearia.endereco)}`
    : null

  return (
    <footer className="relative overflow-hidden border-t border-surface-800 bg-surface-950">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
      <div className="pointer-events-none absolute -right-20 top-12 h-56 w-56 rounded-full border border-brand-500/10" />

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-12">
        <div className="mb-24 grid gap-5 border border-surface-800 bg-surface-900/55 p-5 shadow-2xl shadow-black/20 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-body font-bold uppercase tracking-[0.24em] text-brand-400">
              Sua cadeira espera
            </p>
            <h3 className="mt-3 max-w-2xl font-display text-2xl font-black uppercase leading-none text-white sm:text-3xl">
              Agende seu hor&aacute;rio e mantenha o visual sempre alinhado.
            </h3>
          </div>
          <Link
            to="/cadastro"
            className="inline-flex h-11 items-center justify-center gap-2 bg-brand-500 px-5 text-sm font-body font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-brand-600"
          >
            Agendar agora
            <CalendarPlus className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-10 mt-5 lg:grid-cols-[1.25fr_0.75fr_1fr]">

          {/* Identidade */}
          <div>
            <Link to="/" className="inline-flex items-center gap-3">
              {barbearia.logo ? (
                <img src={barbearia.logo} alt={barbearia.nome} className="h-10 w-auto object-contain" />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-md p-1">
                  <img src="/logoking.png" alt="" />
                </span>
              )}
              <span className="font-display text-xl font-black uppercase leading-none text-surface-50">
                {barbearia.nome}
              </span>
            </Link>

            <p className="mt-5 max-w-sm text-sm font-body leading-relaxed text-surface-400">
              Cortes, barba e acabamento com hora marcada, pre&ccedil;o claro e atendimento pensado para a rotina de quem valoriza presen&ccedil;a.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {barbearia.instagram && instagram && (
                <a
                  href={`https://instagram.com/${instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-surface-800 bg-surface-900 text-surface-300 transition-colors hover:border-brand-500/50 hover:text-brand-400"
                  aria-label="Instagram"
                >
                  <InstagramIcon className="h-4 w-4" />
                </a>
              )}
              {barbearia.facebook && (
                <a
                  href={`https://facebook.com/${barbearia.facebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-surface-800 bg-surface-900 text-surface-300 transition-colors hover:border-brand-500/50 hover:text-brand-400"
                  aria-label="Facebook"
                >
                  <FacebookIcon className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xs font-body font-bold uppercase tracking-[0.22em] text-surface-500">
              Navegação
            </h4>
            <nav className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:flex sm:flex-wrap lg:grid lg:grid-cols-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="group inline-flex w-fit items-center gap-2 text-sm font-body font-semibold text-surface-300 transition-colors hover:text-brand-400"
                >
                  <span className="h-px w-3 bg-surface-700 transition-colors group-hover:bg-brand-500" />
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contato e redes */}
          <div>
            <h4 className="text-xs font-body font-bold uppercase tracking-[0.22em] text-surface-500">
              Contato
            </h4>
            <div className="mt-4 grid gap-3">
              {barbearia.telefone && (
                <a
                  href={`tel:${barbearia.telefone}`}
                  className="group flex items-center gap-3 border border-surface-800 bg-surface-900/70 p-3 text-sm font-body text-surface-300 transition-colors hover:-translate-y-0.5 hover:border-brand-500/40 hover:bg-surface-900 hover:text-surface-100"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-800 text-brand-400">
                    <Phone className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{barbearia.telefone}</span>
                    <span className="mt-0.5 block text-xs text-surface-500 group-hover:text-surface-400">
                      Toque para ligar
                    </span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-surface-600 transition-colors group-hover:text-brand-400" />
                </a>
              )}
              {barbearia.endereco && mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 border border-surface-800 bg-surface-900/70 p-3 text-sm font-body text-surface-300 transition-colors hover:-translate-y-0.5 hover:border-brand-500/40 hover:bg-surface-900 hover:text-surface-100"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-800 text-brand-400">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1 leading-relaxed">
                    <span className="block">{barbearia.endereco}</span>
                    <span className="mt-1 block text-xs text-surface-500 group-hover:text-surface-400">
                      Abrir no mapa
                    </span>
                  </span>
                  <ArrowUpRight className="mt-2 h-4 w-4 shrink-0 text-surface-600 transition-colors group-hover:text-brand-400" />
                </a>
              )}
              <Link
                to="/cadastro"
                className="group flex items-center gap-3 border border-surface-800 bg-surface-900/70 p-3 text-sm font-body text-surface-300 transition-colors hover:-translate-y-0.5 hover:border-brand-500/40 hover:bg-surface-900 hover:text-surface-100"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-800 text-brand-400">
                  <Clock className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">Atendimento com hor&aacute;rio marcado</span>
                  <span className="mt-0.5 block text-xs text-surface-500 group-hover:text-surface-400">
                    Escolher um hor&aacute;rio
                  </span>
                </span>
                <ArrowUpRight className="h-4 w-4 text-surface-600 transition-colors group-hover:text-brand-400" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-surface-800 pt-5 text-xs font-body text-surface-600 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-body text-surface-600">
            © {new Date().getFullYear()} {barbearia.nome}. Todos os direitos reservados.
          </p>
          <p className="text-surface-700">
            Powered by <span className="font-semibold text-surface-500">Monky Software</span>
          </p>
        </div>
      </div>
    </footer>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout
// ─────────────────────────────────────────────────────────────────────────────

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-950">
      <HashScroll />
      <Navbar />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
