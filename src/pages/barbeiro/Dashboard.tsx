import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ArrowUpRight,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Gauge,
  Scissors,
  Timer,
  UserRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ComponentType } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/services/api'
import { Button, Card, CardBody, CardHeader, BadgeAgendamento, SkeletonCard } from '@/components/ui'
import { cn } from '@/lib/utils'
import { compareIsoDateTime, formatIsoDate, formatIsoTime, isoDateKey, toDateInputValue } from '@/lib/date'
import type { Agendamento } from '@/types'

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.08 } }),
}

function formatHora(iso: string) {
  return formatIsoTime(iso)
}

function formatData(iso: string) {
  return formatIsoDate(iso)
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

export default function BarbeiroDashboard() {
  const { usuario } = useAuth()

  const hoje = toDateInputValue()

  const { data: agendamentos, isLoading } = useQuery({
    queryKey: ['barbeiro-agendamentos-hoje'],
    queryFn:  () => api.get<Agendamento[]>('/agendamentos/agenda', { params: { data: hoje } }).then(r => r.data),
  })

  const { data: semana } = useQuery({
    queryKey: ['barbeiro-agendamentos-semana'],
    queryFn:  () => api.get<Agendamento[]>('/agendamentos/agenda').then(r => r.data),
  })

  const lista = agendamentos ?? []
  const pendentes = lista.filter(a => a.status === 'PENDENTE').length
  const confirmados = lista.filter(a => a.status === 'CONFIRMADO').length
  const concluidos = lista.filter(a => a.status === 'CONCLUIDO').length
  const totalHoje = lista.length
  const ativosHoje = pendentes + confirmados
  const taxaConclusao = totalHoje ? Math.round((concluidos / totalHoje) * 100) : 0

  const proximos = lista
    .filter(a => ['PENDENTE', 'CONFIRMADO'].includes(a.status))
    .sort((a, b) => compareIsoDateTime(a.inicio, b.inicio))

  const proximosDias = (semana ?? [])
    .filter(a => {
      const d = isoDateKey(a.inicio)
      return d > hoje && ['PENDENTE','CONFIRMADO'].includes(a.status)
    })
    .sort((a,b) => compareIsoDateTime(a.inicio, b.inicio))
    .slice(0, 5)

  const agendaResumo = [
    { label: 'Pendentes', value: pendentes, tone: 'border-yellow-500/20 bg-yellow-500/10 text-yellow-400' },
    { label: 'Confirmados', value: confirmados, tone: 'border-blue-500/20 bg-blue-500/10 text-blue-400' },
    { label: 'Concluidos', value: concluidos, tone: 'border-green-500/20 bg-green-500/10 text-green-400' },
  ]

  const primeiroNome = usuario?.nome?.split(' ')[0] ?? 'Barbeiro'
  const dataHoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })

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
              <Scissors className="h-3.5 w-3.5" />
              Painel do barbeiro
            </p>
            <h1 className="text-2xl font-display font-bold text-surface-50 sm:text-3xl">
              Ola, {primeiroNome}
            </h1>
            <p className="mt-1 max-w-2xl text-sm font-body leading-relaxed text-surface-400">
              Sua agenda de {dataHoje}, organizada para acompanhar atendimentos, prioridades e proximos horarios.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-lg border border-surface-800 bg-surface-950/60 p-2 xl:min-w-[360px]">
            {agendaResumo.map(item => (
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
        <StatCard index={1} highlight label="Atendimentos hoje" value={totalHoje} icon={CalendarCheck2} helper={`${ativosHoje} ainda em andamento na agenda`} tone="brand" />
        <StatCard index={2} label="Pendentes" value={pendentes} icon={Clock} helper="Precisam de confirmacao ou acompanhamento" tone="yellow" />
        <StatCard index={3} label="Confirmados" value={confirmados} icon={UserRound} helper="Clientes aguardados para hoje" tone="blue" />
        <StatCard index={4} label="Conclusao" value={`${taxaConclusao}%`} icon={Gauge} helper={`${concluidos} atendimentos concluidos`} tone="green" />
      </motion.div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <motion.div variants={fadeUp} custom={5} className="min-w-0">
          <Card className="min-w-0 overflow-hidden">
            <CardHeader className="flex flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-body font-semibold text-surface-100">
                  <CalendarDays className="h-4 w-4 shrink-0 text-brand-400" />
                  <span>Agenda de hoje</span>
                </p>
                <p className="mt-0.5 text-xs font-body text-surface-500">Atendimentos ativos ordenados pelo horario de inicio.</p>
              </div>
              <Link to="/barbeiro/agenda" className="shrink-0">
                <Button variant="ghost" size="sm" rightIcon={<ArrowUpRight className="h-3.5 w-3.5" />}>
                  Ver agenda
                </Button>
              </Link>
            </CardHeader>

            <CardBody className="p-4 sm:p-5">
              {isLoading ? (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} hasAvatar lines={1} />)}
                </div>
              ) : proximos.length === 0 ? (
                <div className="rounded-lg border border-dashed border-surface-800 py-12 text-center">
                  <CheckCircle2 className="mx-auto mb-3 h-9 w-9 text-surface-700" />
                  <p className="text-sm font-body font-semibold text-surface-300">Nenhum atendimento pendente hoje.</p>
                  <p className="mt-1 text-xs font-body text-surface-500">Quando houver agenda ativa, os horarios aparecem aqui.</p>
                </div>
              ) : (
                <div className="flex min-w-0 flex-col gap-3">
                  {proximos.map(ag => (
                    <div
                      key={ag.id}
                      className="group flex min-w-0 flex-col gap-3 rounded-xl border border-surface-800 bg-surface-950/40 p-3 transition-all duration-200 hover:border-brand-500/25 hover:bg-surface-900 sm:flex-row sm:items-center sm:p-4"
                    >
                      <div className="flex shrink-0 items-center gap-3 sm:w-28">
                        <div className="flex h-14 w-14 flex-col items-center justify-center rounded-lg border border-brand-500/20 bg-brand-500/10">
                          <span className="text-sm font-display font-bold leading-none text-brand-300">{formatHora(ag.inicio)}</span>
                          <span className="mt-1 text-[10px] font-body text-brand-200">{formatHora(ag.fim)}</span>
                        </div>
                      </div>

                      <div className="hidden h-12 w-px shrink-0 bg-surface-800 sm:block" />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-body font-semibold text-surface-100">{ag.cliente.usuario.nome}</p>
                        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs font-body text-surface-500">
                          <span className="min-w-0 truncate">{ag.servico.nome}</span>
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
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} custom={6} className="flex min-w-0 flex-col gap-6">
          <Card className="min-w-0 overflow-hidden">
            <CardHeader className="px-4 sm:px-5">
              <p className="flex items-center gap-2 text-sm font-body font-semibold text-surface-100">
                <Timer className="h-4 w-4 text-brand-400" />
                Ritmo do dia
              </p>
              <p className="mt-0.5 text-xs font-body text-surface-500">Leitura rapida da operacao de hoje.</p>
            </CardHeader>
            <CardBody className="p-4 sm:p-5">
              <div className="flex flex-col gap-3">
                {agendaResumo.map(item => (
                  <div key={item.label} className="min-w-0 rounded-lg border border-surface-800 bg-surface-950/40 p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-xs font-body font-semibold uppercase tracking-wider text-surface-500">{item.label}</p>
                      <span className="text-sm font-display font-bold text-surface-100">{item.value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-800">
                      <div
                        className={cn('h-full rounded-full border shadow-brand-sm', item.tone)}
                        style={{ width: `${totalHoje ? Math.max(8, Math.round((item.value / totalHoje) * 100)) : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {proximosDias.length > 0 && (
            <Card className="min-w-0 overflow-hidden">
              <CardHeader className="px-4 sm:px-5">
                <p className="flex items-center gap-2 text-sm font-body font-semibold text-surface-100">
                  <CalendarCheck2 className="h-4 w-4 text-brand-400" />
                  Proximos dias
                </p>
              </CardHeader>
              <CardBody className="p-4 sm:p-5">
                <div className="flex min-w-0 flex-col gap-2">
                  {proximosDias.map(ag => (
                    <div key={ag.id} className="flex min-w-0 items-center gap-3 rounded-lg border border-surface-800 bg-surface-950/40 p-3 transition hover:border-surface-700 hover:bg-surface-900">
                      <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg border border-surface-700 bg-surface-800/80">
                        <p className="text-[10px] font-body uppercase text-surface-500">{formatData(ag.inicio).split('/')[1]}</p>
                        <p className="text-sm font-display font-bold text-surface-100">{formatData(ag.inicio).split('/')[0]}</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-body font-medium text-surface-100">{ag.cliente.usuario.nome}</p>
                        <p className="truncate text-xs font-body text-surface-500">{ag.servico.nome} - {formatHora(ag.inicio)}</p>
                      </div>
                      <BadgeAgendamento status={ag.status} />
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
