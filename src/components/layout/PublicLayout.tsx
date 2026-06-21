import { useState, useEffect } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { Menu, X, Scissors, Phone } from 'lucide-react'
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

// ─────────────────────────────────────────────────────────────────────────────
// Navbar
// ─────────────────────────────────────────────────────────────────────────────

function Navbar() {
  const { barbearia }              = useBarbearia()
  const { isAutenticado, papel }   = useAuth()
  const location                   = useLocation()
  const [menuOpen, setMenuOpen]    = useState(false)
  const [scrolled, setScrolled]    = useState(false)

  // Sombra ao rolar
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Fecha menu ao navegar
  useEffect(() => setMenuOpen(false), [location.pathname])

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
            <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center">
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
                location.pathname === link.to
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

  return (
    <footer className="bg-surface-950 border-t border-surface-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Identidade */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              {barbearia.logo ? (
                <img src={barbearia.logo} alt={barbearia.nome} className="h-7 w-auto" />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-brand-gradient flex items-center justify-center">
                  <Scissors className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <span className="font-display font-bold text-surface-50">{barbearia.nome}</span>
            </div>
            {barbearia.endereco && (
              <p className="text-sm font-body text-surface-500 leading-relaxed">
                {barbearia.endereco}
              </p>
            )}
          </div>

          {/* Links */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold font-body text-surface-400 uppercase tracking-wider">
              Navegação
            </h4>
            <nav className="flex flex-col gap-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-sm font-body text-surface-500 hover:text-surface-200 transition-colors w-fit"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contato e redes */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold font-body text-surface-400 uppercase tracking-wider">
              Contato
            </h4>
            <div className="flex flex-col gap-2">
              {barbearia.telefone && (
                <a
                  href={`tel:${barbearia.telefone}`}
                  className="flex items-center gap-2 text-sm font-body text-surface-500 hover:text-surface-200 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {barbearia.telefone}
                </a>
              )}
              {barbearia.instagram && (
                <a
                  href={`https://instagram.com/${barbearia.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-body text-surface-500 hover:text-brand-400 transition-colors"
                >
                  <InstagramIcon className="w-3.5 h-3.5" />
                  {barbearia.instagram}
                </a>
              )}
              {barbearia.facebook && (
                <a
                  href={`https://facebook.com/${barbearia.facebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-body text-surface-500 hover:text-brand-400 transition-colors"
                >
                  <FacebookIcon className="w-3.5 h-3.5" />
                  {barbearia.facebook}
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-surface-800 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs font-body text-surface-600">
            © {new Date().getFullYear()} {barbearia.nome}. Todos os direitos reservados.
          </p>
          <p className="text-xs font-body text-surface-700">
            Powered by Monky Software
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
      <Navbar />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
