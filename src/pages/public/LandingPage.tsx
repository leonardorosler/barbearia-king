import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, useInView } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { CalendarPlus, Clock, ChevronRight, Check, MapPin, Phone, Star, Scissors } from 'lucide-react'
import { useBarbearia } from '@/contexts/BarbeariaContext'
import { publicApi } from '@/services/api'
import { Button, SkeletonCard, Badge } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { Servico, Barbeiro, Plano } from '@/types'

function barbeiroEstaAtivo(barbeiro: Barbeiro) {
  return barbeiro.usuario.ativo ?? barbeiro.ativo ?? true
}

function formatTelefone(telefone: string) {
  const digits = telefone.replace(/\D/g, '')
  const semCodigoPais = digits.length > 11 && digits.startsWith('55')
    ? digits.slice(2)
    : digits

  if (semCodigoPais.length === 11) {
    return semCodigoPais.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }

  if (semCodigoPais.length === 10) {
    return semCodigoPais.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }

  return telefone
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
  '/banner.png'

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
        className="absolute inset-0 h-full w-full object-cover bg-surface-950"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-surface-950/82 to-surface-950/35" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_42%,rgba(200,133,26,0.22),transparent_30%)]" />
      <div className="absolute inset-0 bg-hero-pattern opacity-30" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col px-4 pb-10 pt-12 sm:px-6 sm:pt-14 lg:pt-8">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="hidden items-center justify-between gap-4 border-y border-white/10 bg-black/25 px-4 py-3 text-xs font-body text-surface-300 backdrop-blur-sm lg:flex"
        >
          <span className="inline-flex min-w-0 items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-400" />
            <span className="truncate">{barbearia.endereco ?? 'Atendimento com hora marcada'}</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-brand-400" />
            {horarioResumo}
          </span>
          {barbearia.telefone && (
            <a href={`tel:${barbearia.telefone}`} className="inline-flex items-center gap-2 hover:text-brand-300">
              <Phone className="h-3.5 w-3.5 text-brand-400" />
              {formatTelefone(barbearia.telefone)}
            </a>
          )}
        </motion.div>

        <div className="grid flex-1 items-center gap-10 py-14 sm:py-16 lg:grid-cols-[minmax(0,1fr)_360px] lg:py-16">
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
              <span className="text-gradient-brand ">King</span>
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
        </div>

      </div>
    </section>
  )
}

function HeroTransition() {
  const itens = [
    { icon: Scissors, label: 'Corte alinhado' },
    { icon: Clock, label: 'Horário marcado' },
    { icon: Star, label: 'Acabamento premium' },
  ]

  return (
    <section className="relative z-20 bg-surface-950 px-3 py-4 sm:px-6 lg:py-5">
      <div className="mr-1 ml-1 border-y border-white/10 bg-surface-950/95 shadow-2xl shadow-black/25 backdrop-blur-md [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-8 lg:px-16 xl:px-52">
          <div className="flex items-center justify-center gap-3 text-center sm:justify-start sm:px-3 sm:text-left">
            <span className="hidden h-px w-7 bg-brand-500 sm:block sm:w-10" />
            <p className="text-xs font-body font-bold uppercase tracking-[0.24em] text-brand-400">
              Experiência King
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 pl-6 min-[420px]:grid-cols-3 min-[420px]:pl-2 sm:flex sm:items-center sm:gap-5 sm:pl-0">
            {itens.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="flex min-w-0 items-center gap-2 text-xs font-body font-semibold text-surface-200 sm:text-sm">
                  <Icon className="h-4 w-4 shrink-0 text-brand-400" />
                  <span className="truncate">{item.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

function Servicos() {
  const [mostrarTodos, setMostrarTodos] = useState(false)
  const { data, isLoading } = useQuery({
    queryKey: ['servicos-publicos'],
    queryFn:  () => publicApi.get<Servico[]>('/servicos').then((r) => r.data),
  })

  const servicos = (data ?? []).filter((s) => s.ativo)
  const servicoDestaque = servicos[0]
  const limiteServicosVisiveis = 7
  const servicosRestantes = servicos.slice(1)
  const servicosLista = mostrarTodos
    ? servicosRestantes
    : servicosRestantes.slice(0, Math.max(limiteServicosVisiveis - 1, 0))
  const temServicosOcultos = servicos.length > limiteServicosVisiveis
  const quantidadeOculta = Math.max(servicos.length - limiteServicosVisiveis, 0)

  return (
    <Section id="servicos" className="bg-surface-950 px-0 py-0 lg:px-6 ">
      <div className="mx-auto grid max-w-6xl overflow-hidden lg:items-start lg:gap-6 lg:overflow-visible lg:grid-cols-[390px_minmax(0,1fr)] xl:grid-cols-[430px_minmax(0,1fr)]">
        <motion.div variants={fadeIn} className="relative min-h-[420px] bg-surface-900 lg:sticky lg:top-24 lg:h-[540px] lg:min-h-0 lg:overflow-hidden xl:h-[580px]">
          <img
            src="/finalizando.png"
            alt="Barbeiro finalizando corte"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 border border-white/15 bg-black/55 p-5 backdrop-blur-sm">
            <p className="text-xs font-body font-semibold uppercase tracking-[0.22em] text-brand-300">
              Atendimento com estilo
            </p>
            <p className="mt-2 font-display text-3xl font-black uppercase leading-none text-white">
              Corte certo<br />confiança em alta
            </p>
          </div>
        </motion.div>

        <div className="relative overflow-hidden bg-[#f7f4ee] px-5 py-12 text-surface-950 sm:px-8 lg:px-10 lg:py-10 xl:px-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full border border-brand-500/20" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-32 w-32 border-l border-t border-brand-500/10" />

          <motion.div variants={fadeUp} className="relative mb-10">
            <span className="mb-4 inline-flex items-center gap-2 border border-brand-500/25 bg-white/70 px-3 py-2 text-xs font-body font-bold uppercase tracking-[0.22em] text-brand-700 shadow-sm">
              <Scissors className="h-4 w-4" /> O que fazemos
            </span>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="max-w-xl font-display text-4xl font-black uppercase leading-[0.92] text-surface-950 sm:text-5xl lg:text-[3.15rem]">
                  Serviços para sair no detalhe
                </h2>
                <p className="mt-5 max-w-xl text-sm font-body leading-relaxed text-surface-600 sm:text-base">
                  Escolha o serviço, veja duração e valor antes de reservar. A agenda segue conectada aos horários reais da barbearia.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex lg:grid lg:min-w-[190px]">
                <span className="inline-flex items-center gap-2 rounded-md border border-brand-500/20 bg-white/80 px-3 py-2 text-xs font-body font-bold text-surface-700 shadow-sm shadow-surface-950/5">
                  <Check className="h-3.5 w-3.5 shrink-0 text-brand-600" />
                  <span>Preço claro</span>
                </span>
                <span className="inline-flex items-center gap-2 rounded-md border border-brand-500/20 bg-white/80 px-3 py-2 text-xs font-body font-bold text-surface-700 shadow-sm shadow-surface-950/5">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-brand-600" />
                  <span>Horário online</span>
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
            <div className="relative border-t border-surface-200/80 pt-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <p className="text-xs font-body font-bold uppercase tracking-[0.2em] text-surface-500">
                  Menu de serviços
                </p>
                <span className="h-px flex-1 bg-surface-200" />
              </div>

              {servicoDestaque && (
                <motion.div variants={fadeUp} className="relative mb-5 overflow-hidden rounded-md border border-brand-500/30 bg-surface-950 p-5 text-white shadow-card lg:p-4">
                  <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-brand-500/20 to-transparent" />
                  <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0">
                      <p className="inline-flex items-center gap-2 text-xs font-body font-bold uppercase tracking-[0.18em] text-brand-300">
                        <Star className="h-3.5 w-3.5" /> Serviço em destaque
                      </p>
                      <h3 className="mt-3 max-w-lg break-words font-display text-2xl font-black uppercase leading-tight text-white lg:text-[1.35rem]">{servicoDestaque.nome}</h3>
                      {servicoDestaque.descricao && (
                        <p className="mt-2 max-w-md text-sm font-body leading-relaxed text-surface-300">{servicoDestaque.descricao}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center justify-between gap-3 sm:block sm:text-right">
                      <p className="font-display text-3xl font-black leading-none text-brand-300">
                        R$ {Number(servicoDestaque.preco).toFixed(2).replace('.', ',')}
                      </p>
                      <p className="inline-flex items-center gap-1.5 border border-white/10 bg-white/5 px-3 py-1 text-xs font-body text-surface-300 sm:mt-3">
                        <Clock className="h-3.5 w-3.5" /> {servicoDestaque.duracao} min
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="grid gap-4 sm:grid-cols-2 lg:gap-3">
                {servicosLista.map((servico, i) => (
                  <motion.div
                    key={servico.id}
                    variants={fadeUp}
                    custom={i}
                    className="group relative flex min-h-[190px] flex-col overflow-hidden rounded-md border border-surface-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-500/50 hover:shadow-card-hover lg:min-h-[166px] lg:p-4"
                  >
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-brand-500/0 transition-colors group-hover:bg-brand-500" />
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-50 font-display text-sm font-black text-brand-600 ring-1 ring-surface-200 transition-colors group-hover:bg-brand-500 group-hover:text-white">
                        {String(i + 2).padStart(2, '0')}
                      </span>
                      <span className="shrink-0 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-body font-bold text-brand-700 ring-1 ring-brand-500/15">
                        R$ {Number(servico.preco).toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <h3 className="max-w-full break-words font-display text-[1.05rem] font-black uppercase leading-[1.05] text-surface-950 transition-colors group-hover:text-brand-700 sm:text-lg lg:text-[1rem]">
                        {servico.nome}
                      </h3>
                      {servico.descricao && (
                        <p className="mt-3 line-clamp-2 text-xs font-body leading-relaxed text-surface-500">
                          {servico.descricao}
                        </p>
                      )}
                      <div className="mt-auto flex items-center justify-between gap-3 border-t border-surface-100 pt-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-body font-medium text-surface-500">
                          <Clock className="h-3.5 w-3.5" /> {servico.duracao} min
                        </span>
                        <Link to="/cadastro" className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-body font-bold uppercase tracking-wide text-brand-600 transition-colors hover:bg-brand-500/10 hover:text-brand-700">
                          Agendar <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {temServicosOcultos && (
                <motion.div variants={fadeUp} className="mt-6 flex flex-col items-center gap-3 border-t border-surface-200 pt-5 sm:flex-row sm:justify-between">
                  <p className="text-center text-xs font-body font-semibold text-surface-500 sm:text-left">
                    {mostrarTodos
                      ? 'Mostrando todos os serviços disponíveis.'
                      : `Mais ${quantidadeOculta} serviço${quantidadeOculta > 1 ? 's' : ''} disponível${quantidadeOculta > 1 ? 's' : ''}.`}
                  </p>
                  <button
                    type="button"
                    onClick={() => setMostrarTodos((valor) => !valor)}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-brand-500/30 bg-white px-5 py-2 text-xs font-body font-bold uppercase tracking-[0.16em] text-brand-700 shadow-sm transition-all hover:border-brand-500/60 hover:bg-brand-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  >
                    {mostrarTodos ? 'Ver menos' : 'Ver mais'}
                    <ChevronRight className={cn('h-4 w-4 transition-transform', mostrarTodos ? '-rotate-90' : 'rotate-90')} />
                  </button>
                </motion.div>
              )}
            </div>
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
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['barbeiros-publicos'],
    queryFn:  () => publicApi.get<Barbeiro[]>('/barbeiros').then((r) => r.data),
    retry: 3,
    staleTime: 60 * 1000,
    refetchOnMount: 'always',
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
      ) : isError ? (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="font-body text-sm text-surface-500">
            Nao foi possivel carregar os barbeiros agora.
          </p>
          <Button variant="outline" size="sm" loading={isFetching} onClick={() => refetch()}>
            Tentar novamente
          </Button>
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
    queryFn:  () => publicApi.get<Plano[]>('/planos').then((r) => r.data),
  })

  const planos = (data ?? []).filter((p) => p.ativo)

  if (!isLoading && planos.length === 0) return null

  return (
    <Section id="planos" className="max-w-6xl mx-auto">
      <SectionHeader
        eyebrow="Planos da barbearia"
        title={<>Nossos planos </>}
        description="Escolha seu plano, reserve seu horário e mantenha seu visual sempre em dia com a praticidade que sua rotina pede."
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
      <HeroTransition />
      <Servicos />
      <Barbeiros />
      <Planos />
      <CtaBanner />
      <Contato />
    </div>
  )
}


