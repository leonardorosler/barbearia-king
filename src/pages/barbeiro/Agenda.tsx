import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Ban,
  CalendarCheck2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Scissors,
  Timer,
  UserRound,
  X,
} from 'lucide-react'
import { api } from '@/services/api'
import { Button, BadgeAgendamento, Card, CardBody, CardHeader, SkeletonCard } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'
import { compareIsoDateTime, formatIsoTime, toDateInputValue } from '@/lib/date'
import type { Agendamento, StatusAgendamento } from '@/types'

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.08 } }),
}

const STATUS_ACOES: {
  status: StatusAgendamento
  label: string
  icon: typeof Check
  variant: string
}[] = [
  { status: 'CONFIRMADO',     label: 'Confirmar',      icon: Check,        variant: 'border-blue-500/30 bg-blue-500/15 text-blue-400 hover:bg-blue-500/25' },
  { status: 'CONCLUIDO',      label: 'Concluir',       icon: CheckCircle2, variant: 'border-green-500/30 bg-green-500/15 text-green-400 hover:bg-green-500/25' },
  { status: 'NAO_COMPARECEU', label: 'Não compareceu', icon: Ban,          variant: 'border-surface-700 bg-surface-800 text-surface-400 hover:bg-surface-700 hover:text-surface-200' },
  { status: 'CANCELADO',      label: 'Cancelar',       icon: X,            variant: 'border-red-500/30 bg-red-500/15 text-red-400 hover:bg-red-500/25' },
]

function addDias(date: Date, n: number) {
  const d = new Date(date); d.setDate(d.getDate() + n); return d
}

function toInput(date: Date) { return toDateInputValue(date) }

function formatHora(iso: string) {
  return formatIsoTime(iso)
}

function formatMoeda(valor: string | number) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function BarbeiroAgenda() {
  const qc = useQueryClient()
  const { success, error } = useToast()
  const [base, setBase] = useState(new Date())

  const dias = Array.from({ length: 7 }, (_, i) => addDias(base, i))
  const [diaSelecionado, setDiaSelecionado] = useState(toInput(new Date()))

  const { data: agendamentos, isLoading } = useQuery({
    queryKey: ['barbeiro-agenda', diaSelecionado],
    queryFn:  () => api.get<Agendamento[]>('/agendamentos/agenda', { params: { data: diaSelecionado } }).then(r => r.data),
  })

  const { mutate: atualizar } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: StatusAgendamento }) =>
      api.patch(`/agendamentos/${id}/status`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['barbeiro-agenda'] }); success('Status atualizado.') },
    onError:   () => error('Erro', 'Não foi possível atualizar.'),
  })

  const sorted = [...(agendamentos ?? [])].sort((a, b) => compareIsoDateTime(a.inicio, b.inicio))
  const pendentes = sorted.filter(a => a.status === 'PENDENTE').length
  const confirmados = sorted.filter(a => a.status === 'CONFIRMADO').length
  const concluidos = sorted.filter(a => a.status === 'CONCLUIDO').length
  const totalDia = sorted.length
  const dataSelecionada = new Date(diaSelecionado + 'T12:00:00')
  const dataExtenso = dataSelecionada.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
  const diaCurto = dataSelecionada.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')

  const resumo = [
    { label: 'Pendentes', value: pendentes, icon: Clock, tone: 'border-yellow-500/20 bg-yellow-500/10 text-yellow-400' },
    { label: 'Confirmados', value: confirmados, icon: CalendarCheck2, tone: 'border-blue-500/20 bg-blue-500/10 text-blue-400' },
    { label: 'Concluídos', value: concluidos, icon: CheckCircle2, tone: 'border-green-500/20 bg-green-500/10 text-green-400' },
    { label: 'Total do dia', value: totalDia, icon: CalendarDays, tone: 'border-brand-500/25 bg-brand-500/10 text-brand-300' },
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
              <Scissors className="h-3.5 w-3.5" />
              Agenda do barbeiro
            </p>
            <h1 className="text-2xl font-display font-bold text-surface-50 sm:text-3xl">
              Minha Agenda
            </h1>
            <p className="mt-1 max-w-2xl text-sm font-body leading-relaxed text-surface-400">
              Atendimentos de {dataExtenso}, organizados por horário, status e ações disponíveis.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 rounded-lg border border-surface-800 bg-surface-950/60 p-2">
            <Button variant="ghost" size="sm" onClick={() => setBase(d => addDias(d, -7))} aria-label="Semana anterior">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setBase(new Date()); setDiaSelecionado(toInput(new Date())) }}>
              Hoje
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setBase(d => addDias(d, 7))} aria-label="Próxima semana">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} custom={1} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {resumo.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="min-w-0 rounded-xl border border-surface-800 bg-surface-900 p-4 shadow-card">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-body font-semibold uppercase tracking-wider text-surface-500">{label}</p>
                <p className="mt-2 text-3xl font-display font-black leading-none text-surface-50">{value}</p>
              </div>
              <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border', tone)}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      <motion.div variants={fadeUp} custom={2}>
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col gap-4 px-4 sm:px-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-body font-semibold text-surface-100">
                <CalendarDays className="h-4 w-4 shrink-0 text-brand-400" />
                <span>Semana em exibição</span>
              </p>
              <p className="mt-0.5 text-xs font-body text-surface-500">Escolha um dia para consultar os atendimentos.</p>
            </div>

            <div className="grid grid-cols-7 gap-1.5 rounded-lg border border-surface-800 bg-surface-950/60 p-1.5">
              {dias.map(dia => {
                const val    = toInput(dia)
                const hoje   = toInput(new Date())
                const ativo  = val === diaSelecionado
                const isHoje = val === hoje
                return (
                  <button
                    key={val}
                    onClick={() => setDiaSelecionado(val)}
                    className={cn(
                      'group flex min-h-[72px] min-w-0 flex-col items-center justify-center rounded-md border px-1.5 py-2 text-center transition-all duration-150 sm:min-w-[74px]',
                      ativo
                        ? 'border-brand-500/50 bg-brand-500/15 text-brand-300 shadow-brand-sm'
                        : 'border-transparent bg-surface-900 text-surface-400 hover:border-surface-700 hover:bg-surface-800/80 hover:text-surface-200',
                    )}
                  >
                    <span className="text-[10px] font-body font-semibold uppercase tracking-wider">
                      {dia.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                    </span>
                    <span className={cn('mt-1 text-xl font-display font-black leading-none', ativo ? 'text-brand-200' : 'text-surface-100')}>
                      {dia.getDate()}
                    </span>
                    <span className={cn('mt-1 h-1.5 w-1.5 rounded-full', isHoje ? 'bg-brand-400' : 'bg-transparent')}>
                      {/* <span className="sr-only">{isHoje ? 'Hoje' : ''}</span> */}
                    </span>
                  </button>
                )
              })}
            </div>
          </CardHeader>

          <CardBody className="p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-body font-semibold text-surface-100">Atendimentos de {diaCurto}</p>
                <p className="text-xs font-body text-surface-500">{totalDia} atendimento(s) em {dataExtenso}</p>
              </div>
            </div>

            {isLoading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} hasAvatar lines={2} />)}
              </div>
            ) : sorted.length === 0 ? (
              <div className="rounded-xl border border-dashed border-surface-800 bg-surface-950/40 px-4 py-14 text-center">
                <CalendarDays className="mx-auto mb-3 h-10 w-10 text-surface-700" />
                <p className="text-sm font-body font-semibold text-surface-300">Nenhum agendamento neste dia.</p>
                <p className="mt-1 text-xs font-body text-surface-500">Quando houver atendimento marcado, ele aparecerá aqui com horário, cliente e status.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {sorted.map(ag => {
                  const acoesDisponiveis = STATUS_ACOES.filter(a => {
                    if (ag.status === 'PENDENTE')   return ['CONFIRMADO','CANCELADO'].includes(a.status)
                    if (ag.status === 'CONFIRMADO') return ['CONCLUIDO','NAO_COMPARECEU','CANCELADO'].includes(a.status)
                    return false
                  })

                  return (
                    <div key={ag.id} className="group overflow-hidden rounded-xl border border-surface-800 bg-surface-950/40 transition-all duration-200 hover:border-brand-500/25 hover:bg-surface-900">
                      <div className="flex min-w-0 flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between lg:p-5">
                        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
                          <div className="flex h-16 w-full shrink-0 items-center justify-center gap-3 rounded-lg border border-brand-500/20 bg-brand-500/10 px-4 sm:w-28 sm:flex-col sm:gap-1 sm:px-2">
                            <span className="text-lg font-display font-black leading-none text-brand-300">{formatHora(ag.inicio)}</span>
                            <span className="text-xs font-body text-brand-200">{formatHora(ag.fim)}</span>
                          </div>

                          <div className="hidden h-14 w-px shrink-0 bg-surface-800 sm:block" />

                          <div className="min-w-0">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <p className="truncate text-base font-body font-semibold text-surface-100">{ag.cliente.usuario.nome}</p>
                              <BadgeAgendamento status={ag.status} />
                            </div>
                            <div className="grid min-w-0 grid-cols-1 gap-2 text-xs font-body text-surface-500 sm:grid-cols-3">
                              <span className="inline-flex min-w-0 items-center gap-1.5 rounded-md border border-surface-800 bg-surface-900 px-2 py-1">
                                <Scissors className="h-3.5 w-3.5 shrink-0 text-brand-400" />
                                <span className="truncate">{ag.servico.nome}</span>
                              </span>
                              <span className="inline-flex items-center gap-1.5 rounded-md border border-surface-800 bg-surface-900 px-2 py-1">
                                <Timer className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                                {ag.servico.duracao}min
                              </span>
                              <span className="inline-flex items-center gap-1.5 rounded-md border border-surface-800 bg-surface-900 px-2 py-1">
                                <DollarSign className="h-3.5 w-3.5 shrink-0 text-green-400" />
                                {formatMoeda(ag.servico.preco)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2 text-xs font-body text-surface-500">
                          <UserRound className="h-4 w-4 text-surface-600" />
                          Cliente
                        </div>
                      </div>

                      {acoesDisponiveis.length > 0 && (
                        <div className="flex flex-col gap-2 border-t border-surface-800 bg-surface-900/70 p-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                          <p className="text-xs font-body font-semibold uppercase tracking-wider text-surface-500">Ações do agendamento</p>
                          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                            {acoesDisponiveis.map(acao => {
                              const Icon = acao.icon
                              return (
                                <button
                                  key={acao.status}
                                  onClick={() => atualizar({ id: ag.id, status: acao.status })}
                                  className={cn(
                                    'inline-flex h-8 items-center justify-center gap-1.5 rounded-md border px-3 text-xs font-body font-medium transition-all',
                                    acao.variant,
                                  )}
                                >
                                  <Icon className="h-3.5 w-3.5" />
                                  {acao.label}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardBody>
        </Card>
      </motion.div>
    </motion.div>
  )
}
