import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, useInView } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { CalendarPlus, Clock, ChevronRight, Check, MapPin, Phone, Star, Scissors, Sparkles } from 'lucide-react'
import { useBarbearia } from '@/contexts/BarbeariaContext'
import { api } from '@/services/api'
import { Button, SkeletonCard, Badge } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { Servico, Barbeiro, Plano } from '@/types'

function barbeiroEstaAtivo(barbeiro: Barbeiro) {
  return barbeiro.usuario.ativo ?? barbeiro.ativo ?? true
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook reveal
// ─────────────────────────────────────────────────────────────────────────────

function useReveal(threshold = 0.15) {
  const ref    = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -60px 0px', amount: threshold })
  return { ref, inView }
}

// ─────────────────────────────────────────────────────────────────────────────
// Variantes
// ─────────────────────────────────────────────────────────────────────────────

// const fadeUp = {
//   hidden:  { opacity: 0, y: 32 },
//   visible: (i = 0) => ({
//     opacity: 1,
//     y: 0,
//     transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
//   }),
// }

const fadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: 32,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
    },
  },
}


// const fadeIn = {
//   hidden:  { opacity: 0 },
//   visible: (i = 0) => ({
//     opacity: 1,
//     transition: { duration: 0.5, delay: i * 0.08 },
//   }),
// }

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

// ─────────────────────────────────────────────────────────────────────────────
// Section wrapper
// ─────────────────────────────────────────────────────────────────────────────

function Section({ id, children, className }: {
  id?: string
  children: React.ReactNode
  className?: string
}) {
  const { ref, inView } = useReveal()
  return (
    <motion.section
      id={id}
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className={cn('py-20 px-4 sm:px-6', className)}
    >
      {children}
    </motion.section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section header
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({ eyebrow, title, description }: {
  eyebrow: string
  title: React.ReactNode
  description?: string
}) {
  return (
    <div className="text-center mb-14 max-w-2xl mx-auto">
      <motion.span variants={fadeUp} custom={0}
        className="inline-block text-xs font-semibold font-body tracking-[0.2em] uppercase text-brand-500 mb-3">
        {eyebrow}
      </motion.span>
      <motion.h2 variants={fadeUp} custom={1}
        className="text-3xl sm:text-4xl font-display font-bold text-surface-50 leading-tight mb-4">
        {title}
      </motion.h2>
      {description && (
        <motion.p variants={fadeUp} custom={2}
          className="text-surface-400 font-body leading-relaxed">
          {description}
        </motion.p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────────────────────────────────────

const HERO_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=1800&q=85'

type BarbeariaContextValue = ReturnType<typeof useBarbearia>

function getHorarioResumo(horario: BarbeariaContextValue['barbearia']['horarioFuncionamento']) {
  if (!horario) return 'Seg a sab, com hora marcada'

  const diasUteis = [horario.seg, horario.ter, horario.qua, horario.qui, horario.sex]
  const primeiroDiaUtil = diasUteis.find(Boolean)
  const sabado = horario.sab

  if (!primeiroDiaUtil) return 'Horarios definidos pela barbearia'

  return sabado
    ? `Seg a sex ${primeiroDiaUtil.abre}-${primeiroDiaUtil.fecha} / Sab ${sabado.abre}-${sabado.fecha}`
    : `Seg a sex ${primeiroDiaUtil.abre}-${primeiroDiaUtil.fecha}`
}

function Hero() {
  const { barbearia } = useBarbearia()
  const heroImage = barbearia.banner || HERO_FALLBACK_IMAGE
  const horarioResumo = getHorarioResumo(barbearia.horarioFuncionamento)

  return (
    <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-surface-950">
      <img
        src={heroImage}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-surface-950/82 to-surface-950/35" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_42%,rgba(200,133,26,0.22),transparent_30%)]" />
      <div className="absolute inset-0 bg-hero-pattern opacity-30" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col px-4 pb-10 pt-6 sm:px-6 lg:pt-8">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="hidden items-center justify-between gap-4 border-y border-white/10 bg-black/20 px-4 py-3 text-xs font-body text-surface-300 backdrop-blur-sm lg:flex"
        >
          <span className="inline-flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-brand-400" />
            {barbearia.endereco ?? 'Atendimento com hora marcada'}
          </span>
          <span className="inline-flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-brand-400" />
            {horarioResumo}
          </span>
          {barbearia.telefone && (
            <a href={`tel:${barbearia.telefone}`} className="inline-flex items-center gap-2 hover:text-brand-300">
              <Phone className="h-3.5 w-3.5 text-brand-400" />
              {barbearia.telefone}
            </a>
          )}
        </motion.div>

        <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_360px] lg:py-16">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-6 inline-flex items-center gap-3 border border-brand-500/30 bg-brand-500/10 px-4 py-2"
            >
              <Scissors className="h-4 w-4 text-brand-300" />
              <span className="text-xs font-semibold font-body tracking-[0.22em] uppercase text-brand-300">
                Corte, barba e experiencia
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-3xl font-display text-5xl font-black uppercase leading-[0.88] text-white sm:text-7xl lg:text-8xl"
            >
              Barbearia<br />
              <span className="text-gradient-brand">King</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="mt-7 max-w-xl text-base font-body leading-relaxed text-surface-300 sm:text-lg"
            >
              {barbearia.nome} une tecnica, atendimento pontual e acabamento de alto nivel para voce sair pronto para a semana.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-9 flex flex-col gap-3 sm:flex-row"
            >
              <Button variant="primary" size="lg" leftIcon={<CalendarPlus className="w-5 h-5" />}
                onClick={() => window.location.href = '/cadastro'}>
                Agende agora
              </Button>
              <Button variant="ghost" size="lg" rightIcon={<ChevronRight className="w-4 h-4" />}
                onClick={() => document.getElementById('servicos')?.scrollIntoView({ behavior: 'smooth' })}>
                O que fazemos
              </Button>
            </motion.div>
          </div>

          {/* <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.75 }}
            className="hidden justify-self-end lg:block"
          >
            <button
              type="button"
              onClick={() => document.getElementById('servicos')?.scrollIntoView({ behavior: 'smooth' })}
              className="group flex h-24 w-24 items-center justify-center rounded-full border border-white/20 bg-white text-surface-950 shadow-2xl transition-transform hover:scale-105"
              aria-label="Ver servicos"
            >
              <Play className="h-8 w-8 fill-current transition-transform group-hover:translate-x-0.5" />
            </button>
          </motion.div> */}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-3"
        >
          {[
            { icon: Scissors, title: 'Corte preciso', text: 'Servicos com tempo, preco e duracao claros.' },
            { icon: CalendarPlus, title: 'Agenda online', text: 'Escolha barbeiro, data e horario disponivel.' },
            { icon: Sparkles, title: 'Acabamento premium', text: 'Experiencia pensada para fidelizar clientes.' },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="bg-surface-950/86 p-5 backdrop-blur-sm">
                <Icon className="mb-3 h-5 w-5 text-brand-400" />
                <p className="font-display text-lg font-bold text-surface-50">{item.title}</p>
                <p className="mt-1 text-sm font-body leading-relaxed text-surface-400">{item.text}</p>
              </div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
function Servicos() {
  const { data, isLoading } = useQuery({
    queryKey: ['servicos-publicos'],
    queryFn:  () => api.get<Servico[]>('/servicos').then((r) => r.data),
  })

  const servicos = (data ?? []).filter((s) => s.ativo)
  const servicoDestaque = servicos[0]
  const servicosLista = servicos.slice(0, 6)

  return (
    <Section id="servicos" className="bg-surface-100 px-0 py-0">
      <div className="mx-auto grid max-w-6xl overflow-hidden lg:grid-cols-[0.95fr_1.05fr]">
        <motion.div variants={fadeIn} className="relative min-h-[420px] bg-surface-900 lg:min-h-[620px]">
          <img
            src="/finalizando.png"
            alt="Barbeiro finalizando corte"
            className="absolute inset-0 h-full w-auto object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 border border-white/15 bg-black/55 p-5 backdrop-blur-sm">
            <p className="text-xs font-body font-semibold uppercase tracking-[0.22em] text-brand-300">
              Atendimento com estilo
            </p>
            <p className="mt-2 font-display text-3xl font-black uppercase leading-none text-white">
              Corte certo<br />confiaça em alta
            </p>
          </div>
        </motion.div>

        <div className="relative overflow-hidden bg-[#f7f4ee] px-5 py-12 text-surface-950 sm:px-8 lg:px-12 lg:py-16">
          <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full border border-brand-500/20" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-32 w-32 border-l border-t border-brand-500/10" />

          <motion.div variants={fadeUp} className="relative mb-10">
            <span className="mb-4 inline-flex items-center gap-2 border border-brand-500/25 bg-white/70 px-3 py-2 text-xs font-body font-bold uppercase tracking-[0.22em] text-brand-700 shadow-sm">
              <Scissors className="h-4 w-4" /> O que fazemos
            </span>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="max-w-xl font-display text-4xl font-black uppercase leading-[0.92] text-surface-950 sm:text-5xl">
                  Serviços para sair no detalhe
                </h2>
                <p className="mt-5 max-w-xl text-sm font-body leading-relaxed text-surface-600 sm:text-base">
                  Escolha o serviço, veja duração e valor antes de reservar. A agenda segue conectada aos horários reais da barbearia.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex lg:grid">
                <span className="border border-surface-200 bg-white px-3 py-2 text-xs font-body font-semibold text-surface-600">
                  Preço claro
                </span>
                <span className="border border-surface-200 bg-white px-3 py-2 text-xs font-body font-semibold text-surface-600">
                  Horário online
                </span>
              </div>
            </div>
          </motion.div>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={2} />)}
            </div>
          ) : servicos.length === 0 ? (
            <div className="relative border border-surface-200 bg-white p-8 text-center shadow-sm">
              <p className="font-body text-sm text-surface-600">Nenhum serviço disponível no momento.</p>
            </div>
          ) : (
            <>
              {servicoDestaque && (
                <motion.div variants={fadeUp} className="relative mb-8 overflow-hidden border border-brand-500/30 bg-surface-950 p-5 text-white shadow-card">
                  <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-brand-500/15 to-transparent" />
                  <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-body font-bold uppercase tracking-[0.18em] text-brand-300">Serviço em destaque</p>
                      <h3 className="mt-2 font-display text-2xl font-black uppercase leading-tight text-white">{servicoDestaque.nome}</h3>
                      {servicoDestaque.descricao && (
                        <p className="mt-2 max-w-md text-sm font-body leading-relaxed text-surface-300">{servicoDestaque.descricao}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-left sm:text-right">
                      <p className="font-display text-3xl font-black text-brand-300">
                        R$ {Number(servicoDestaque.preco).toFixed(2).replace('.', ',')}
                      </p>
                      <p className="mt-2 inline-flex items-center gap-1.5 border border-white/10 bg-white/5 px-3 py-1 text-xs font-body text-surface-300">
                        <Clock className="h-3.5 w-3.5" /> {servicoDestaque.duracao} min
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                {servicosLista.map((servico, i) => (
                  <motion.div
                    key={servico.id}
                    variants={fadeUp}
                    custom={i}
                    className="group flex min-h-[190px] flex-col border border-surface-200 bg-white/95 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-500/50 hover:bg-white hover:shadow-card-hover"
                  >
                    <div className="flex flex-1 items-start gap-4">
                      <span className="font-display text-3xl font-black leading-none text-brand-500/30 transition-colors group-hover:text-brand-500/55">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="min-w-0">
                          <h3 className="max-w-full break-words font-display text-[1.05rem] font-black uppercase leading-[1.05] text-surface-950 transition-colors group-hover:text-brand-700 sm:text-lg">
                            {servico.nome}
                          </h3>
                          <span className="mt-3 inline-flex w-fit items-center rounded-full bg-brand-500/10 px-3 py-1 text-xs font-body font-bold text-brand-700 ring-1 ring-brand-500/20">
                            R$ {Number(servico.preco).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                        {servico.descricao && (
                          <p className="mt-3 line-clamp-2 text-xs font-body leading-relaxed text-surface-500">
                            {servico.descricao}
                          </p>
                        )}
                        <div className="mt-auto flex items-center justify-between gap-3 border-t border-surface-100 pt-4">
                          <span className="inline-flex items-center gap-1.5 text-xs font-body text-surface-500">
                            <Clock className="h-3.5 w-3.5" /> {servico.duracao} min
                          </span>
                          <Link to="/cadastro" className="inline-flex items-center gap-1 text-xs font-body font-bold uppercase tracking-wide text-brand-600 transition-colors hover:text-brand-700">
                            Agendar <ChevronRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </Section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Barbeiros
// ─────────────────────────────────────────────────────────────────────────────
function Barbeiros() {
  const { data, isLoading } = useQuery({
    queryKey: ['barbeiros-publicos'],
    queryFn:  () => api.get<Barbeiro[]>('/barbeiros').then((r) => r.data).catch(() => []),
  })

  const barbeiros = (data ?? []).filter(barbeiroEstaAtivo)

  return (
    <Section id="barbeiros" className="max-w-6xl mx-auto">
      <SectionHeader
        eyebrow="Nosso time"
        title={<>Barbeiros que<br />entendem de estilo</>}
        description="Profissionais experientes, apaixonados pelo que fazem e prontos para o seu melhor visual."
      />

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} hasAvatar lines={1} />)}
        </div>
      ) : barbeiros.length === 0 ? (
        <p className="text-center text-surface-500 font-body py-12">
          Nenhum barbeiro disponível no momento.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {barbeiros.map((barbeiro, i) => (
            <motion.div key={barbeiro.id} variants={fadeUp} custom={i}
              className="group flex flex-col items-center text-center gap-3">
              <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-surface-800 border border-surface-700 group-hover:border-brand-500/40 transition-colors duration-300">
                {barbeiro.foto ? (
                  <img src={barbeiro.foto} alt={barbeiro.usuario.nome}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface-800 to-surface-900">
                    <span className="text-4xl font-display font-bold text-brand-500/40">
                      {barbeiro.usuario.nome.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-brand-gradient opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              </div>
              <div>
                <p className="font-display font-semibold text-surface-100">{barbeiro.usuario.nome}</p>
                {(barbeiro.especialidades ?? []).length > 0 && (
                  <p className="text-xs font-body text-surface-500 mt-0.5">
                    {(barbeiro.especialidades ?? []).slice(0, 2).join(' · ')}
                  </p>
                )}
              </div>
              <Link to="/cadastro">
                <Badge variant="brand" dot className="cursor-pointer hover:opacity-80 transition-opacity">
                  Agendar
                </Badge>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </Section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Planos
// ─────────────────────────────────────────────────────────────────────────────

function Planos() {
  const { data, isLoading } = useQuery({
    queryKey: ['planos-publicos'],
    queryFn:  () => api.get<Plano[]>('/planos').then((r) => r.data),
  })

  const planos = (data ?? []).filter((p) => p.ativo)

  if (!isLoading && planos.length === 0) return null

  return (
    <Section id="planos" className="max-w-6xl mx-auto">
      <SectionHeader
        eyebrow="Planos da barbearia"
        title={<>Seu plano é<br />definido pela equipe</>}
        description="A barbearia atribui o plano ideal ao seu perfil. O foco continua sendo agendamentos e atendimento."
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} lines={4} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {planos.map((plano, i) => {
            const destaque = i === 1 && planos.length >= 2
            return (
              <motion.div key={plano.id} variants={fadeUp} custom={i}
                className={cn(
                  'relative flex flex-col p-6 rounded-xl border transition-all duration-300',
                  destaque
                    ? 'bg-surface-900 border-brand-500/50 shadow-brand-lg scale-[1.02]'
                    : 'bg-surface-900 border-surface-800 hover:border-surface-700',
                )}
              >
                {destaque && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full text-2xs font-semibold font-body bg-brand-gradient text-white tracking-wide uppercase">
                      Mais popular
                    </span>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="font-display font-bold text-surface-50 text-xl mb-1">{plano.nome}</h3>
                  {plano.descricao && (
                    <p className="text-surface-400 font-body text-sm">{plano.descricao}</p>
                  )}
                </div>
                <div className="mb-6">
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-display font-black text-gradient-brand">
                      R$ {Number(plano.preco).toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-surface-500 font-body text-sm mb-1">/mês</span>
                  </div>
                </div>
                {plano.planosServicos.length > 0 && (
                  <ul className="flex flex-col gap-2.5 mb-8 flex-1">
                    {plano.planosServicos.map((ps) => (
                      <li key={ps.servico.id} className="flex items-center gap-2.5 text-sm font-body text-surface-300">
                        <Check className={cn('w-4 h-4 shrink-0', destaque ? 'text-brand-400' : 'text-surface-500')} />
                        <span>
                          {ps.quantidade}× {ps.servico.nome}
                          <span className="text-surface-500 ml-1">({ps.servico.duracao}min)</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                  <Button variant={destaque ? 'primary' : 'outline'} size="md" fullWidth
                  onClick={() => window.location.href = '/cadastro'}>
                  Criar conta e agendar
                  </Button>
              </motion.div>
            )
          })}
        </div>
      )}
    </Section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CTA Banner
// ─────────────────────────────────────────────────────────────────────────────

function CtaBanner() {
  const { ref, inView } = useReveal()
  return (
    <motion.div ref={ref} initial="hidden" animate={inView ? 'visible' : 'hidden'}
      variants={fadeIn} className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-px">
        <div className="relative rounded-2xl bg-surface-950/90 px-8 py-12 sm:py-16 text-center overflow-hidden">
          <div className="absolute inset-0 bg-hero-pattern opacity-30 pointer-events-none" />
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
          <motion.p variants={fadeUp} custom={0}
            className="text-xs font-body font-semibold tracking-[0.2em] uppercase text-brand-400 mb-3">
            Reserve agora
          </motion.p>
          <motion.h2 variants={fadeUp} custom={1}
            className="text-3xl sm:text-5xl font-display font-black text-surface-50 leading-tight mb-4">
            Seu próximo corte<br />
            <span className="text-gradient-brand">começa aqui</span>
          </motion.h2>
          <motion.p variants={fadeUp} custom={2}
            className="text-surface-400 font-body mb-8 max-w-md mx-auto">
            Crie sua conta em segundos, escolha seu barbeiro e agende no melhor horário para você.
          </motion.p>
          <motion.div variants={fadeUp} custom={3}
            className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="primary" size="lg" leftIcon={<CalendarPlus className="w-5 h-5" />}
              onClick={() => window.location.href = '/cadastro'}>
              Criar conta grátis
            </Button>
            <Button variant="ghost" size="lg" onClick={() => window.location.href = '/login'}>
              Já tenho conta
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Contato
// ─────────────────────────────────────────────────────────────────────────────

function Contato() {
  const { barbearia } = useBarbearia()

  const infos = [
    barbearia.endereco  && { icon: MapPin, label: 'Endereço',  value: barbearia.endereco },
    barbearia.telefone  && { icon: Phone,  label: 'Telefone',  value: barbearia.telefone },
    barbearia.instagram && { icon: Star,   label: 'Instagram', value: `@${barbearia.instagram.replace('@', '')}` },
  ].filter(Boolean) as { icon: typeof MapPin; label: string; value: string }[]

  if (infos.length === 0) return null

  return (
    <Section id="contato" className="max-w-6xl mx-auto">
      <SectionHeader eyebrow="Onde estamos" title="Venha nos visitar" />
      <div className="flex flex-wrap justify-center gap-6">
        {infos.map((info, i) => {
          const Icon = info.icon
          return (
            <motion.div key={info.label} variants={fadeUp} custom={i}
              className="flex items-center gap-4 bg-surface-900 border border-surface-800 rounded-xl px-6 py-5 min-w-[220px]">
              <div className="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-brand-400" />
              </div>
              <div>
                <p className="text-2xs font-body font-semibold text-surface-500 uppercase tracking-wider">
                  {info.label}
                </p>
                <p className="text-sm font-body text-surface-200 mt-0.5">{info.value}</p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </Section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="bg-surface-950">
      <Hero />
      <Servicos />
      <Barbeiros />
      <Planos />
      <CtaBanner />
      <Contato />
    </div>
  )
}


