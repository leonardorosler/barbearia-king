import { useState, type ComponentType } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowUpRight,
  Bell,
  BarChart3,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Crown,
  Megaphone,
  PackageCheck,
  Scissors,
  Settings,
  TrendingUp,
  Users,
} from 'lucide-react'
import { api } from '@/services/api'
import { BadgeAgendamento, Button, Card, CardBody, CardHeader, SkeletonCard } from '@/components/ui'
import { cn } from '@/lib/utils'
import { compareIsoDateTime, formatIsoTime, toDateInputValue } from '@/lib/date'
import type { Agendamento, Dashboard } from '@/types'

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.07 } }),
}

function formatMoeda(valor: string | number) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatHora(iso: string) {
  return formatIsoTime(iso)
}

function formatDataCurta(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

interface StatCardProps {
  label: string
  value: string | number
  icon: ComponentType<{ className?: string }>
  sub?: string
  tone?: 'brand' | 'green' | 'blue' | 'amber'
  highlight?: boolean
  index: number
}

const toneStyles = {
  brand: 'bg-brand-500/10 border-brand-500/20 text-brand-400',
  green: 'bg-green-500/10 border-green-500/20 text-green-400',
  blue:  'bg-blue-500/10 border-blue-500/20 text-blue-400',
  amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
}

function StatCard({ label, value, icon: Icon, sub, tone = 'brand', highlight, index }: StatCardProps) {
  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      className={cn(
        'relative min-w-0 overflow-hidden rounded-xl border p-4 sm:p-5',
        highlight
          ? 'border-brand-400/30 bg-brand-gradient shadow-brand'
          : 'border-surface-800 bg-surface-900 shadow-card',
      )}
    >
      {highlight && <div className="absolute inset-0 bg-hero-pattern opacity-10" />}
      <div className="relative z-10 flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={cn(
            'mb-2 truncate text-xs font-body font-semibold uppercase tracking-wider',
            highlight ? 'text-white/70' : 'text-surface-500',
          )}>
            {label}
          </p>
          <p className={cn(
            'truncate text-2xl font-display font-black leading-tight sm:text-3xl',
            highlight ? 'text-white' : 'text-surface-50',
          )}>
            {value}
          </p>
          {sub && (
            <p className={cn('mt-1 truncate text-xs font-body', highlight ? 'text-white/65' : 'text-surface-500')}>
              {sub}
            </p>
          )}
        </div>
        <div className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border',
          highlight ? 'border-white/20 bg-white/20 text-white' : toneStyles[tone],
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  )
}

function RankingEmpty({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-surface-800 px-4 py-6 text-center">
      <p className="text-sm font-body text-surface-500">{label}</p>
    </div>
  )
}

export default function AdminDashboard() {
  const [acoesAberto, setAcoesAberto] = useState(false)

  const { data: dash, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn:  () => api.get<Dashboard>('/dashboard').then(r => r.data),
  })

  const { data: agendamentosHoje } = useQuery({
    queryKey: ['admin-agendamentos-hoje'],
    queryFn:  () => api.get<Agendamento[]>('/agendamentos', { params: { data: toDateInputValue() } }).then(r => r.data),
  })

  const { data: agendamentos, isLoading: loadingAgenda } = useQuery({
    queryKey: ['admin-agendamentos-proximos'],
    queryFn:  () => api.get<Agendamento[]>('/agendamentos').then(r => r.data),
  })

  const agora = new Date()
  const proximos = (agendamentos ?? [])
    .filter(a => ['PENDENTE', 'CONFIRMADO'].includes(a.status))
    .filter(a => new Date(a.inicio) >= agora)
    .sort((a, b) => compareIsoDateTime(a.inicio, b.inicio))
    .slice(0, 6)

  const confirmadosHoje = (agendamentosHoje ?? []).filter(a => a.status === 'CONFIRMADO').length
  const pendentesHoje = (agendamentosHoje ?? []).filter(a => a.status === 'PENDENTE').length
  const concluidosHoje = (agendamentosHoje ?? []).filter(a => a.status === 'CONCLUIDO').length
  const dataHoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
  const alertasAcao = [
    {
      value: dash?.agendamentosPendentes ?? 0,
      title: 'agendamentos pendentes',
      description: 'Aguardando confirmacao para nao perder horario.',
      to: '/admin/agendamentos',
      icon: ClipboardList,
      tone: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    },
    {
      value: dash?.barbeirosSemDisponibilidade ?? 0,
      title: 'barbeiros sem disponibilidade',
      description: 'Cadastre horarios para liberar novos agendamentos.',
      to: '/admin/barbeiros',
      icon: Scissors,
      tone: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    },
    {
      value: dash?.clientesSemRetorno30Dias ?? 0,
      title: 'clientes sem retorno ha 30 dias',
      description: 'Boa oportunidade para campanha ou contato direto.',
      to: '/admin/clientes',
      icon: Users,
      tone: 'text-green-400 bg-green-500/10 border-green-500/20',
    },
    {
      value: dash?.horariosVagosHoje ?? 0,
      title: 'horarios livres hoje',
      description: 'Divulgue encaixes e transforme agenda vazia em receita.',
      to: '/admin/agendamentos',
      icon: Megaphone,
      tone: 'text-brand-400 bg-brand-500/10 border-brand-500/20',
    },
  ].filter(alerta => alerta.value > 0)

  const quickActions = [
    { label: 'Agendamentos', to: '/admin/agendamentos', icon: CalendarDays, tone: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    { label: 'Barbeiros', to: '/admin/barbeiros', icon: Scissors, tone: 'text-brand-400 bg-brand-500/10 border-brand-500/20' },
    { label: 'Clientes', to: '/admin/clientes', icon: Users, tone: 'text-green-400 bg-green-500/10 border-green-500/20' },
    { label: 'Servicos', to: '/admin/servicos', icon: PackageCheck, tone: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    { label: 'Planos', to: '/admin/planos', icon: CreditCard, tone: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
    { label: 'Ajustes', to: '/admin/configuracoes', icon: Settings, tone: 'text-surface-300 bg-surface-800 border-surface-700' },
  ]

  return (
    <motion.div initial="hidden" animate="visible" className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <motion.div
        variants={fadeUp}
        custom={0}
        className="relative overflow-visible rounded-xl border border-surface-800 bg-surface-900 p-5 shadow-card sm:p-6"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-400/60 to-transparent" />
        <div className="flex min-w-0 flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="mb-2 inline-flex items-center gap-2 rounded-md border border-brand-500/20 bg-brand-500/10 px-2.5 py-1 text-xs font-body font-semibold uppercase tracking-wider text-brand-300">
              <BarChart3 className="h-3.5 w-3.5" />
              Visao administrativa
            </p>
            <h1 className="text-2xl font-display font-bold text-surface-50 sm:text-3xl">Dashboard</h1>
            <p className="mt-1 max-w-2xl text-sm font-body text-surface-400">
              Acompanhe agenda, receita, clientes e desempenho da barbearia em {dataHoje}.
            </p>
          </div>

          <div className="flex min-w-0 flex-col gap-3 sm:min-w-[360px]">
            <div className="relative flex justify-start sm:justify-end">
              <Button
                variant={alertasAcao.length > 0 ? 'outline' : 'ghost'}
                size="sm"
                leftIcon={<Bell className="h-3.5 w-3.5" />}
                onClick={() => setAcoesAberto(aberto => !aberto)}
              >
                Acoes
                {alertasAcao.length > 0 && (
                  <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[11px] font-body font-bold text-white">
                    {alertasAcao.length}
                  </span>
                )}
              </Button>

              {acoesAberto && (
                <div className="absolute left-0 top-10 z-30 w-[min(92vw,380px)] overflow-hidden rounded-xl border border-surface-800 bg-surface-950 shadow-card sm:left-auto sm:right-0">
                  <div className="border-b border-surface-800 px-4 py-3">
                    <p className="text-sm font-body font-semibold text-surface-100">Acoes recomendadas</p>
                    <p className="mt-0.5 text-xs font-body text-surface-500">Pontos que merecem atencao agora.</p>
                  </div>

                  {isLoading ? (
                    <div className="p-4">
                      <SkeletonCard lines={3} />
                    </div>
                  ) : alertasAcao.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <Bell className="mx-auto mb-2 h-8 w-8 text-surface-700" />
                      <p className="text-sm font-body text-surface-300">Tudo em dia por aqui.</p>
                      <p className="mt-1 text-xs font-body text-surface-500">Nenhuma acao urgente encontrada.</p>
                    </div>
                  ) : (
                    <div className="max-h-[320px] overflow-y-auto p-2">
                      {alertasAcao.map(alerta => {
                        const Icon = alerta.icon
                        return (
                          <Link
                            key={alerta.title}
                            to={alerta.to}
                            onClick={() => setAcoesAberto(false)}
                            className="group flex min-w-0 gap-3 rounded-lg p-3 transition hover:bg-surface-900"
                          >
                            <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border', alerta.tone)}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-body font-semibold text-surface-100">
                                {alerta.value} {alerta.title}
                              </p>
                              <p className="mt-0.5 text-xs font-body leading-relaxed text-surface-500">
                                {alerta.description}
                              </p>
                            </div>
                            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-surface-600 transition-transform group-hover:translate-x-0.5" />
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-lg border border-surface-800 bg-surface-950/60 p-2">
              {[
                { label: 'Pendentes', value: pendentesHoje },
                { label: 'Confirmados', value: confirmadosHoje },
                { label: 'Concluidos', value: concluidosHoje },
              ].map(item => (
                <div key={item.label} className="min-w-0 rounded-md bg-surface-900 px-3 py-2 text-center">
                  <p className="truncate text-lg font-display font-black text-surface-50">{item.value}</p>
                  <p className="truncate text-[11px] font-body text-surface-500">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} lines={2} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <StatCard index={1} highlight label="Receita do mes" value={formatMoeda(dash?.receitaMes ?? 0)} icon={TrendingUp} sub="Dinheiro realizado" />
          <StatCard index={2} label="Servicos concluidos" value={dash?.servicosConcluidosMes ?? 0} icon={PackageCheck} tone="blue" sub="Entregues no mes" />
          <StatCard index={3} label="Ticket medio" value={formatMoeda(dash?.ticketMedio ?? 0)} icon={CreditCard} tone="green" sub="Valor por atendimento" />
          <StatCard index={4} label="Clientes recorrentes" value={dash?.clientesRecorrentesMes ?? 0} icon={Users} tone="brand" sub="Voltaram no mes" />
          <StatCard index={5} label="Horarios vagos hoje" value={dash?.horariosVagosHoje ?? 0} icon={CalendarDays} tone="amber" sub="Slots para vender" />
          <StatCard index={6} label="Agendamentos pendentes" value={dash?.agendamentosPendentes ?? 0} icon={ClipboardList} tone="blue" sub="Precisam de acao" />
        </div>
      )}

      <motion.div variants={fadeUp} custom={5}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {quickActions.map(action => {
            const Icon = action.icon
            return (
              <Link key={action.to} to={action.to} className="group min-w-0">
                <div className="flex h-full min-w-0 items-center gap-3 rounded-xl border border-surface-800 bg-surface-900 p-3 shadow-card transition-all duration-200 hover:border-surface-700 hover:bg-surface-800">
                  <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border', action.tone)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-body font-semibold text-surface-100">{action.label}</p>
                    <p className="truncate text-xs font-body text-surface-500">Gerenciar</p>
                  </div>
                  <ChevronRight className="hidden h-4 w-4 shrink-0 text-surface-600 transition-transform group-hover:translate-x-0.5 sm:block" />
                </div>
              </Link>
            )
          })}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <motion.div variants={fadeUp} custom={6} className="min-w-0">
          <Card className="min-w-0 overflow-hidden">
            <CardHeader className="flex flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-body font-semibold text-surface-100">
                  <CalendarDays className="h-4 w-4 shrink-0 text-brand-400" />
                  <span className="truncate">Proximos agendamentos</span>
                </p>
                <p className="mt-0.5 text-xs font-body text-surface-500">Alguns atendimentos futuros para acompanhar rapidamente.</p>
              </div>
              <Link to="/admin/agendamentos" className="shrink-0">
                <Button variant="ghost" size="sm" rightIcon={<ArrowUpRight className="h-3.5 w-3.5" />}>
                  Ver mais
                </Button>
              </Link>
            </CardHeader>
            <CardBody className="p-4 sm:p-5">
              {loadingAgenda ? (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} hasAvatar lines={1} />)}
                </div>
              ) : proximos.length === 0 ? (
                <div className="rounded-lg border border-dashed border-surface-800 py-10 text-center">
                  <CalendarDays className="mx-auto mb-3 h-8 w-8 text-surface-700" />
                  <p className="text-sm font-body text-surface-400">Nenhum agendamento futuro encontrado.</p>
                </div>
              ) : (
                <div className="flex min-w-0 flex-col gap-3">
                  {proximos.map(ag => (
                    <div
                      key={ag.id}
                      className="flex min-w-0 flex-col gap-3 rounded-xl border border-surface-800 bg-surface-950/40 p-3 sm:flex-row sm:items-center sm:p-4"
                    >
                      <div className="flex shrink-0 items-center gap-3 sm:w-24">
                        <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg border border-brand-500/20 bg-brand-500/10">
                          <span className="text-sm font-display font-bold leading-none text-brand-300">{formatHora(ag.inicio)}</span>
                          <span className="mt-1 text-[10px] font-body uppercase text-brand-400/70">{formatDataCurta(ag.inicio)}</span>
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-body font-semibold text-surface-100">{ag.cliente.usuario.nome}</p>
                        <div className="mt-1 flex min-w-0 flex-col gap-1 text-xs font-body text-surface-500 sm:flex-row sm:items-center sm:gap-2">
                          <span className="min-w-0 truncate">{ag.servico.nome}</span>
                          <span className="hidden text-surface-700 sm:inline">/</span>
                          <span className="min-w-0 truncate">com {ag.barbeiro.usuario.nome}</span>
                        </div>
                      </div>

                      <div className="self-start sm:self-center">
                        <BadgeAgendamento status={ag.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} custom={7} className="flex min-w-0 flex-col gap-6">
          <Card className="min-w-0 overflow-hidden">
            <CardHeader className="px-4 sm:px-5">
              <p className="flex items-center gap-2 text-sm font-body font-semibold text-surface-100">
                <Crown className="h-4 w-4 text-brand-400" />
                Top barbeiros
              </p>
            </CardHeader>
            <CardBody className="p-4 sm:p-5">
              {isLoading ? <SkeletonCard lines={3} /> : (dash?.barbeirosRanking ?? []).length === 0 ? (
                <RankingEmpty label="Sem dados de barbeiros ainda." />
              ) : (
                <div className="flex min-w-0 flex-col gap-3">
                  {(dash?.barbeirosRanking ?? []).slice(0, 4).map((item, i) => (
                    <div key={item.barbeiro.id} className="flex min-w-0 items-center gap-3 rounded-lg border border-surface-800 bg-surface-950/40 p-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-800 text-xs font-display font-bold text-surface-400">
                        {i + 1}
                      </span>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-800">
                        {item.barbeiro.foto ? (
                          <img src={item.barbeiro.foto} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Scissors className="h-4 w-4 text-surface-500" />
                        )}
                      </div>
                      <p className="min-w-0 flex-1 truncate text-sm font-body font-medium text-surface-200">{item.barbeiro.usuario.nome}</p>
                      <span className="shrink-0 rounded-md bg-brand-500/10 px-2 py-1 text-xs font-body font-semibold text-brand-400">{item.total}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <Card className="min-w-0 overflow-hidden">
            <CardHeader className="px-4 sm:px-5">
              <p className="flex items-center gap-2 text-sm font-body font-semibold text-surface-100">
                <ClipboardList className="h-4 w-4 text-brand-400" />
                Top servicos
              </p>
            </CardHeader>
            <CardBody className="p-4 sm:p-5">
              {isLoading ? <SkeletonCard lines={3} /> : (dash?.servicosRanking ?? []).length === 0 ? (
                <RankingEmpty label="Sem dados de servicos ainda." />
              ) : (
                <div className="flex min-w-0 flex-col gap-2">
                  {(dash?.servicosRanking ?? []).slice(0, 5).map((item, i) => (
                    <div key={item.servico.id} className="flex min-w-0 items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-800/50">
                      <span className="w-5 shrink-0 text-xs font-display font-bold text-surface-600">{i + 1}</span>
                      <p className="min-w-0 flex-1 truncate text-sm font-body text-surface-300">{item.servico.nome}</p>
                      <span className="shrink-0 text-xs font-body font-semibold text-brand-400">{item.total}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
