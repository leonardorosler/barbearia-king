import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowUpRight,
  CalendarCheck2,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Scissors,
  Sparkles,
  Timer,
  UserRound,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/services/api'
import { Button, Card, CardBody, CardHeader, BadgeAgendamento, BadgeAssinatura, SkeletonCard } from '@/components/ui'
import { cn } from '@/lib/utils'
import { compareIsoDateTime, formatIsoDate, formatIsoDateMonthShort, formatIsoTime } from '@/lib/date'
import type { Agendamento, Assinatura } from '@/types'

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.08 } }),
}

function formatData(iso: string) {
  return formatIsoDateMonthShort(iso)
}

function formatDataCompleta(iso: string) {
  return formatIsoDate(iso)
}

function formatHora(iso: string) {
  return formatIsoTime(iso)
}

interface StatCardProps {
  label: string
  value: string | number
  icon: ComponentType<{ className?: string }>
  helper: string
  tone: 'brand' | 'yellow' | 'blue' | 'green'
  index: number
  highlight?: boolean
}

const statTones = {
  brand:  'border-brand-500/20 bg-brand-500/10 text-brand-400',
  yellow: 'border-yellow-500/20 bg-yellow-500/10 text-yellow-400',
  blue:   'border-blue-500/20 bg-blue-500/10 text-blue-400',
  green:  'border-green-500/20 bg-green-500/10 text-green-400',
}

function StatCard({ label, value, icon: Icon, helper, tone, index, highlight }: StatCardProps) {
  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      className={cn(
        'group relative min-w-0 overflow-hidden rounded-xl border p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-500/30 hover:shadow-card-hover',
        highlight ? 'border-brand-400/30 bg-brand-gradient shadow-brand' : 'border-surface-800 bg-surface-900',
      )}
    >
      {highlight && <div className="absolute inset-0 bg-hero-pattern opacity-10" />}
      <div className="relative z-10 flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={cn('text-xs font-body font-semibold uppercase tracking-wider', highlight ? 'text-white/70' : 'text-surface-500')}>
            {label}
          </p>
          <p className={cn('mt-2 text-3xl font-display font-black leading-none', highlight ? 'text-white' : 'text-surface-50')}>
            {value}
          </p>
          <p className={cn('mt-2 text-xs font-body leading-relaxed', highlight ? 'text-white/65' : 'text-surface-500')}>
            {helper}
          </p>
        </div>
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border', highlight ? 'border-white/20 bg-white/20 text-white' : statTones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  )
}

export default function ClienteDashboard() {
  const { usuario } = useAuth()

  const { data: agendamentos, isLoading: loadingAg } = useQuery({
    queryKey: ['cliente-agendamentos'],
    queryFn:  () => api.get<Agendamento[]>('/agendamentos/meus').then(r => r.data),
  })

  const { data: assinatura, isLoading: loadingAs } = useQuery({
    queryKey: ['cliente-assinatura'],
    queryFn:  () => api.get<Assinatura[]>('/assinaturas/minhas').then(r => r.data[0] ?? null).catch(() => null),
  })

  const lista = agendamentos ?? []
  const proximos = lista
    .filter(a => ['PENDENTE', 'CONFIRMADO'].includes(a.status))
    .sort((a, b) => compareIsoDateTime(a.inicio, b.inicio))
    .slice(0, 4)
  const pendentes = lista.filter(a => a.status === 'PENDENTE').length
  const confirmados = lista.filter(a => a.status === 'CONFIRMADO').length
  const concluidos = lista.filter(a => a.status === 'CONCLUIDO').length
  const totalAgendamentos = lista.length
  const proximo = proximos[0]
  const primeiroNome = usuario?.nome?.split(' ')[0] ?? 'Cliente'
  const planoAtivo = assinatura?.status === 'ATIVA'

  const resumo = [
    { label: 'Pendentes', value: pendentes, tone: 'border-yellow-500/20 bg-yellow-500/10 text-yellow-400' },
    { label: 'Confirmados', value: confirmados, tone: 'border-blue-500/20 bg-blue-500/10 text-blue-400' },
    { label: 'Concluídos', value: concluidos, tone: 'border-green-500/20 bg-green-500/10 text-green-400' },
  ]

  return (
    <motion.div initial="hidden" animate="visible" className="mx-auto flex w-full max-w-[1400px] flex-col gap-5 lg:gap-6">
      <motion.div
        variants={fadeUp}
        custom={0}
        className="relative min-w-0 overflow-hidden rounded-xl border border-surface-800 bg-surface-900 p-4 shadow-card lg:p-5"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-400/60 to-transparent" />
        <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <p className="mb-2 inline-flex items-center gap-2 rounded-md border border-brand-500/20 bg-brand-500/10 px-2.5 py-1 text-xs font-body font-semibold uppercase tracking-wider text-brand-300">
              <Sparkles className="h-3.5 w-3.5" />
              Área do cliente
            </p>
            <h1 className="text-2xl font-display font-bold text-surface-50 sm:text-3xl">
              Olá, {primeiroNome}
            </h1>
            <p className="mt-1 max-w-2xl text-sm font-body leading-relaxed text-surface-400">
              Acompanhe seus próximos horários, plano e histórico de atendimentos em um só lugar.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-lg border border-surface-800 bg-surface-950/60 p-2 xl:min-w-[360px]">
            {resumo.map(item => (
              <div key={item.label} className="min-w-0 rounded-md bg-surface-900 px-2 py-2 text-center">
                <p className={cn('mx-auto mb-1 h-1.5 w-8 rounded-full border', item.tone)} />
                <p className="text-lg font-display font-black text-surface-50">{item.value}</p>
                <p className="text-[11px] font-body leading-tight text-surface-500">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} custom={1} className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard index={1} highlight label="Próximos" value={proximos.length} icon={CalendarCheck2} helper="Agendamentos pendentes ou confirmados" tone="brand" />
        <StatCard index={2} label="Total" value={totalAgendamentos} icon={CalendarDays} helper="Todos os agendamentos da sua conta" tone="blue" />
        <StatCard index={3} label="Concluídos" value={concluidos} icon={CheckCircle2} helper="Atendimentos finalizados" tone="green" />
        <StatCard index={4} label="Plano" value={planoAtivo ? 'Ativo' : assinatura ? assinatura.status : '-'} icon={CreditCard} helper={assinatura ? 'Status da assinatura atual' : 'Nenhum plano vinculado'} tone={planoAtivo ? 'green' : 'yellow'} />
      </motion.div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <motion.div variants={fadeUp} custom={2} className="min-w-0">
          <Card className="min-w-0 overflow-hidden">
            <CardHeader className="flex flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-body font-semibold text-surface-100">
                  <CalendarDays className="h-4 w-4 shrink-0 text-brand-400" />
                  <span>Próximos agendamentos</span>
                </p>
                <p className="mt-0.5 text-xs font-body text-surface-500">Seus próximos horários ordenados por data.</p>
              </div>
              <Link to="/cliente/agendamentos" className="shrink-0">
                <Button variant="ghost" size="sm" rightIcon={<ArrowUpRight className="h-3.5 w-3.5" />}>
                  Ver todos
                </Button>
              </Link>
            </CardHeader>

            <CardBody className="p-4 sm:p-5">
              {loadingAg ? (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} hasAvatar lines={1} />)}
                </div>
              ) : proximos.length === 0 ? (
                <div className="rounded-xl border border-dashed border-surface-800 bg-surface-950/40 px-4 py-14 text-center">
                  <CalendarDays className="mx-auto mb-3 h-10 w-10 text-surface-700" />
                  <p className="text-sm font-body font-semibold text-surface-300">Nenhum agendamento próximo.</p>
                  <p className="mt-1 text-xs font-body text-surface-500">Escolha um serviço e reserve seu próximo horário.</p>
                  <Link to="/cliente/novo-agendamento" className="mt-4 inline-block">
                    <Button variant="outline" size="sm" leftIcon={<CalendarPlus className="h-3.5 w-3.5" />}>
                      Agendar agora
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex min-w-0 flex-col gap-3">
                  {proximos.map((ag) => {
                    const dataPartes = formatData(ag.inicio).split(' ')
                    return (
                      <div
                        key={ag.id}
                        className="group flex min-w-0 flex-col gap-3 rounded-xl border border-surface-800 bg-surface-950/40 p-3 transition-all duration-200 hover:border-brand-500/25 hover:bg-surface-900 sm:flex-row sm:items-center sm:p-4"
                      >
                        <div className="flex shrink-0 items-center gap-3 sm:w-28">
                          <div className="flex h-14 w-14 flex-col items-center justify-center rounded-lg border border-brand-500/20 bg-brand-500/10">
                            <span className="text-xs font-body uppercase leading-none text-brand-300">{dataPartes[1]}</span>
                            <span className="mt-1 text-lg font-display font-black leading-none text-brand-200">{dataPartes[0]}</span>
                          </div>
                        </div>

                        <div className="hidden h-12 w-px shrink-0 bg-surface-800 sm:block" />

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-body font-semibold text-surface-100">{ag.servico.nome}</p>
                          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs font-body text-surface-500">
                            <span className="inline-flex min-w-0 items-center gap-1 truncate">
                              <UserRound className="h-3.5 w-3.5 shrink-0 text-surface-600" />
                              <span className="truncate">com {ag.barbeiro.usuario.nome}</span>
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 text-surface-600" />
                              {formatHora(ag.inicio)}
                            </span>
                            <span className="rounded-full border border-surface-800 bg-surface-900 px-2 py-0.5 text-[11px] text-surface-400">
                              {ag.servico.duracao}min
                            </span>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
                          <BadgeAgendamento status={ag.status} />
                          <ChevronRight className="hidden h-4 w-4 text-surface-700 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-400 sm:block" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardBody>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} custom={3} className="flex min-w-0 flex-col gap-6">
          <Link to="/cliente/novo-agendamento" className="block">
            <div className="group relative min-w-0 overflow-hidden rounded-xl border border-brand-400/30 bg-brand-gradient p-5 shadow-brand transition-all duration-300 hover:-translate-y-0.5 hover:shadow-brand-lg">
              <div className="absolute inset-0 bg-hero-pattern opacity-10" />
              <div className="relative z-10 flex min-w-0 items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-white/20 bg-white/20 text-white">
                    <CalendarPlus className="h-5 w-5" />
                  </div>
                  <p className="text-lg font-display font-bold text-white">Novo agendamento</p>
                  <p className="mt-1 text-sm font-body leading-relaxed text-white/70">Reserve um horário em poucos passos.</p>
                </div>
                <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-white/60 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </Link>

          <Card className="min-w-0 overflow-hidden">
            <CardHeader className="px-4 sm:px-5">
              <p className="flex items-center gap-2 text-sm font-body font-semibold text-surface-100">
                <CreditCard className="h-4 w-4 text-brand-400" />
                Meu plano
              </p>
              <p className="mt-0.5 text-xs font-body text-surface-500">Status da sua assinatura.</p>
            </CardHeader>
            <CardBody className="p-4 sm:p-5">
              {loadingAs ? (
                <SkeletonCard lines={2} />
              ) : assinatura ? (
                <div className="flex min-w-0 flex-col gap-4">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-body font-semibold text-surface-100">{assinatura.plano.nome}</p>
                      <p className="mt-1 text-xs font-body text-surface-500">Plano vinculado à sua conta.</p>
                    </div>
                    <BadgeAssinatura status={assinatura.status} dot />
                  </div>
                  <Link to="/cliente/assinatura">
                    <Button variant="ghost" size="sm" rightIcon={<ArrowUpRight className="h-3.5 w-3.5" />}>
                      Ver plano
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-surface-800 bg-surface-950/40 px-3 py-4">
                  <p className="text-sm font-body font-semibold text-surface-300">Nenhum plano atribuído.</p>
                  <p className="mt-1 text-xs font-body text-surface-500">Quando houver uma assinatura, ela aparecerá aqui.</p>
                </div>
              )}
            </CardBody>
          </Card>

          {proximo && (
            <Card className="min-w-0 overflow-hidden">
              <CardHeader className="px-4 sm:px-5">
                <p className="flex items-center gap-2 text-sm font-body font-semibold text-surface-100">
                  <Timer className="h-4 w-4 text-brand-400" />
                  Próximo horário
                </p>
              </CardHeader>
              <CardBody className="p-4 sm:p-5">
                <div className="rounded-lg border border-surface-800 bg-surface-950/40 p-3">
                  <p className="text-sm font-body font-semibold text-surface-100">{proximo.servico.nome}</p>
                  <p className="mt-1 text-xs font-body text-surface-500">
                    {formatDataCompleta(proximo.inicio)} às {formatHora(proximo.inicio)}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs font-body text-surface-500">
                    <Scissors className="h-3.5 w-3.5 text-brand-400" />
                    {proximo.barbeiro.usuario.nome}
                  </p>
                </div>
              </CardBody>
            </Card>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
