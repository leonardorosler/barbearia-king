import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Scissors,
  Sparkles,
  Timer,
  User,
  UserRound,
} from 'lucide-react'
import { api } from '@/services/api'
import { Button, Card, CardBody, CardHeader, SkeletonCard } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'
import { formatIsoDateLong, formatIsoTime, toDateInputValue } from '@/lib/date'
import type { Servico, Barbeiro, HorarioDisponivel, PlanoUtilizacao, Assinatura } from '@/types'

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.08 } }),
}

const STEPS = [
  { id: 1, label: 'Serviço',   icon: Scissors },
  { id: 2, label: 'Barbeiro',  icon: User },
  { id: 3, label: 'Horário',   icon: Calendar },
  { id: 4, label: 'Confirmar', icon: Check },
]

function barbeiroEstaAtivo(barbeiro: Barbeiro) {
  return barbeiro.usuario.ativo ?? barbeiro.ativo ?? true
}

function toDateInput(date: Date) {
  return toDateInputValue(date)
}

function formatHora(iso: string) {
  return formatIsoTime(iso)
}

function formatDataExtenso(iso: string) {
  return formatIsoDateLong(iso)
}

function formatMoeda(valor: string | number) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function buildDateTime(data: string, hora: string) {
  return `${data}T${hora}:00`
}

function addMinutesToDateTime(data: string, hora: string, minutos: number) {
  const [ano, mes, dia] = data.split('-').map(Number)
  const [hh, mm] = hora.split(':').map(Number)
  const dt = new Date(ano, mes - 1, dia, hh, mm, 0, 0)
  dt.setMinutes(dt.getMinutes() + minutos)

  const pad = (n: number) => String(n).padStart(2, '0')
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}:00`
}

function StepBar({ atual }: { atual: number }) {
  return (
    <div className="flex min-w-0 justify-center rounded-lg border border-surface-800 bg-surface-900 px-2.5 py-2 shadow-card">
      <div className="inline-flex min-w-0 items-center justify-center">
      {STEPS.map((step) => {
        const done = step.id < atual
        const active = step.id === atual
        const Icon = step.icon

        return (
          <div key={step.id} className="flex min-w-0 items-center">
            <div
              className={cn(
                'flex min-w-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-xs font-body font-semibold transition-colors',
                active
                  ? 'bg-brand-500/10 text-brand-300'
                  : done
                    ? 'text-green-400'
                    : 'text-surface-500',
              )}
            >
              <span className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border',
                active
                  ? 'border-brand-500/35 bg-brand-500/15'
                  : done
                    ? 'border-green-500/25 bg-green-500/10'
                    : 'border-surface-800 bg-surface-950/50',
              )}>
                {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              </span>
              <span className="hidden truncate sm:inline">{step.label}</span>
            </div>
            {step.id < STEPS.length && (
              <span className={cn(
                'mx-1.5 h-px w-4 rounded-full sm:w-8',
                done ? 'bg-green-500/35' : 'bg-surface-800',
              )} />
            )}
          </div>
        )
      })}
      </div>
    </div>
  )
}

function StepServico({
  utilizacao,
  assinatura,
  onSelect,
}: {
  utilizacao: PlanoUtilizacao | null | undefined
  assinatura: Assinatura | null | undefined
  onSelect: (s: Servico) => void
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['servicos-ag'],
    queryFn:  () => api.get<Servico[]>('/servicos').then(r => r.data.filter(s => s.ativo)),
  })

  return (
    <div>
      <div className="mb-5">
        <p className="flex items-center gap-2 text-sm font-body font-semibold text-surface-100">
          <Scissors className="h-4 w-4 text-brand-400" />
          Escolha o serviço
        </p>
        <p className="mt-0.5 text-xs font-body text-surface-500">Selecione o atendimento que você deseja realizar.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={2} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(data ?? []).map(s => {
            const beneficio = utilizacao?.servicos.find(item => item.servicoId === s.id)
            const servicoNoPlano = !!beneficio || !!assinatura?.plano.planosServicos.some(item => item.servico.id === s.id)
            const temSaldoPlano = !!beneficio && beneficio.disponiveis > 0

            return (
              <button
                key={s.id}
                onClick={() => onSelect(s)}
                className={cn(
                  'group relative min-w-0 overflow-hidden rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-500/40 hover:bg-surface-900 hover:shadow-card-hover',
                  servicoNoPlano ? 'border-brand-500/40 bg-brand-500/5' : 'border-surface-800 bg-surface-950/40',
                )}
              >
                {servicoNoPlano && (
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-brand-500/30 bg-brand-500/15 px-2 py-0.5 text-[10px] font-body font-bold uppercase leading-none text-brand-300">
                    <Sparkles className="h-3 w-3" />
                    Plano
                  </span>
                )}
                <div className={cn('mb-3 pr-0', servicoNoPlano && 'pr-16')}>
                  <p className="truncate text-base font-body font-semibold text-surface-100 transition-colors group-hover:text-brand-300">
                    {s.nome}
                  </p>
                  {s.descricao && (
                    <p className="mt-1 line-clamp-2 text-xs font-body leading-relaxed text-surface-500">{s.descricao}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-body text-surface-500">
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-surface-800 bg-surface-900 px-2 py-1">
                    <Timer className="h-3.5 w-3.5 text-blue-400" />
                    {s.duracao}min
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-surface-800 bg-surface-900 px-2 py-1 font-semibold text-brand-400">
                    <CreditCard className="h-3.5 w-3.5" />
                    {temSaldoPlano ? 'Plano' : formatMoeda(s.preco)}
                  </span>
                </div>
                {beneficio && (
                  <p className="mt-3 text-xs font-body text-surface-500">
                    {beneficio.disponiveis} de {beneficio.limite} usos disponíveis no plano.
                  </p>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StepBarbeiro({ onSelect }: { onSelect: (b: Barbeiro) => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['barbeiros-ag'],
    queryFn:  () => api.get<Barbeiro[]>('/barbeiros').then(r => r.data.filter(barbeiroEstaAtivo)),
  })

  return (
    <div>
      <div className="mb-5">
        <p className="flex items-center gap-2 text-sm font-body font-semibold text-surface-100">
          <UserRound className="h-4 w-4 text-brand-400" />
          Escolha o barbeiro
        </p>
        <p className="mt-0.5 text-xs font-body text-surface-500">Selecione quem vai realizar o atendimento.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} hasAvatar lines={1} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(data ?? []).map(b => (
            <button
              key={b.id}
              onClick={() => onSelect(b)}
              className="group flex min-w-0 flex-col items-center gap-3 rounded-xl border border-surface-800 bg-surface-950/40 p-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-500/40 hover:bg-surface-900 hover:shadow-card-hover"
            >
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-surface-700 bg-surface-800 transition-colors group-hover:border-brand-500/50">
                {b.foto ? (
                  <img src={b.foto} alt={b.usuario.nome} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="text-xl font-display font-bold text-brand-500/60">
                      {b.usuario.nome.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-body font-semibold text-surface-100">{b.usuario.nome}</p>
                {(b.especialidades ?? []).length > 0 && (
                  <p className="mt-0.5 truncate text-xs font-body text-surface-500">
                    {(b.especialidades ?? []).slice(0, 1).join(', ')}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function StepHorario({
  servicoId,
  barbeiroId,
  duracaoMinutos,
  onSelect,
}: {
  servicoId: string
  barbeiroId: string
  duracaoMinutos: number
  onSelect: (h: HorarioDisponivel) => void
}) {
  const hoje = new Date()
  const [dataSelecionada, setDataSelecionada] = useState(toDateInput(hoje))

  interface HorariosDisponiveisResponse {
    data: string
    horarios: string[]
  }

  const { data: resposta, isLoading } = useQuery({
    queryKey: ['horarios', barbeiroId, servicoId, dataSelecionada],
    queryFn:  () => api
      .get<HorariosDisponiveisResponse>('/agendamentos/horarios-disponiveis', {
        params: { barbeiroId, servicoId, data: dataSelecionada },
      })
      .then(r => r.data),
    enabled: !!dataSelecionada,
  })

  const horarios = resposta?.horarios ?? []

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-body font-semibold text-surface-100">
            <Calendar className="h-4 w-4 text-brand-400" />
            Escolha o horário
          </p>
          <p className="mt-0.5 text-xs font-body text-surface-500">Selecione a data e um horário disponível.</p>
        </div>
        <label className="min-w-0 sm:w-48">
          <span className="mb-1 block text-[11px] font-body font-semibold uppercase tracking-wider text-surface-500">Data</span>
          <input
            type="date"
            value={dataSelecionada}
            min={toDateInput(hoje)}
            onChange={e => setDataSelecionada(e.target.value)}
            className="h-10 w-full rounded-md border border-surface-700 bg-surface-900 px-3 text-sm font-body text-surface-100 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 [color-scheme:dark]"
          />
        </label>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-surface-800 animate-shimmer" />
          ))}
        </div>
      ) : !horarios.length ? (
        <div className="rounded-xl border border-dashed border-surface-800 bg-surface-950/40 px-4 py-12 text-center">
          <Clock className="mx-auto mb-3 h-9 w-9 text-surface-700" />
          <p className="text-sm font-body font-semibold text-surface-300">Nenhum horário disponível nesta data.</p>
          <p className="mt-1 text-xs font-body text-surface-500">Tente outro dia para encontrar novos horários.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {horarios.map(hora => (
            <button
              key={hora}
              onClick={() => onSelect({
                inicio: buildDateTime(dataSelecionada, hora),
                fim: addMinutesToDateTime(dataSelecionada, hora, duracaoMinutos),
              })}
              className="h-11 rounded-lg border border-surface-800 bg-surface-950/40 text-sm font-body font-semibold text-surface-300 transition-all duration-150 hover:border-brand-500/50 hover:bg-brand-500/10 hover:text-brand-300"
            >
              {hora}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function StepConfirmar({
  servico,
  barbeiro,
  horario,
  loading,
  onConfirmar,
}: {
  servico: Servico
  barbeiro: Barbeiro
  horario: HorarioDisponivel
  loading: boolean
  onConfirmar: () => void
}) {
  const items = [
    { label: 'Serviço',  value: servico.nome },
    { label: 'Barbeiro', value: barbeiro.usuario.nome },
    { label: 'Data',     value: formatDataExtenso(horario.inicio) },
    { label: 'Horário',  value: `${formatHora(horario.inicio)} - ${formatHora(horario.fim)}` },
    { label: 'Duração',  value: `${servico.duracao} minutos` },
    { label: 'Valor',    value: formatMoeda(servico.preco), highlight: true },
  ]

  return (
    <div>
      <div className="mb-5">
        <p className="flex items-center gap-2 text-sm font-body font-semibold text-surface-100">
          <CheckCircle2 className="h-4 w-4 text-brand-400" />
          Confirmar agendamento
        </p>
        <p className="mt-0.5 text-xs font-body text-surface-500">Confira os detalhes antes de confirmar.</p>
      </div>

      <div className="mb-6 overflow-hidden rounded-xl border border-surface-800 bg-surface-950/40">
        {items.map((item, i) => (
          <div
            key={item.label}
            className={cn(
              'flex flex-col gap-1 px-4 py-3 font-body text-sm sm:flex-row sm:items-center sm:justify-between',
              i < items.length - 1 && 'border-b border-surface-800',
            )}
          >
            <span className="text-surface-500">{item.label}</span>
            <span className={cn('break-words font-medium sm:text-right', item.highlight ? 'text-brand-400' : 'text-surface-100')}>
              {item.value}
            </span>
          </div>
        ))}
      </div>

      <Button
        variant="primary"
        size="lg"
        fullWidth
        loading={loading}
        leftIcon={<Check className="h-4 w-4" />}
        onClick={onConfirmar}
      >
        Confirmar agendamento
      </Button>
    </div>
  )
}

export default function NovoAgendamento() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { success, error } = useToast()

  const [step, setStep] = useState(1)
  const [servico, setServico] = useState<Servico | null>(null)
  const [barbeiro, setBarbeiro] = useState<Barbeiro | null>(null)
  const [horario, setHorario] = useState<HorarioDisponivel | null>(null)

  const { data: assinaturaPlano } = useQuery({
    queryKey: ['cliente-assinatura'],
    queryFn: () => api.get<Assinatura[]>('/assinaturas/minhas').then(r => r.data.find(item => item.status === 'ATIVA') ?? r.data[0] ?? null).catch(() => null),
  })

  const { data: utilizacaoPlano } = useQuery({
    queryKey: ['cliente-plano-utilizacao'],
    queryFn: () => api.get<PlanoUtilizacao | null>('/assinaturas/minha/utilizacao').then(r => r.data).catch(() => null),
  })

  const { mutate: confirmar, isPending } = useMutation({
    mutationFn: () => api.post('/agendamentos', {
      servicoId: servico!.id,
      barbeiroId: barbeiro!.id,
      inicio: horario!.inicio,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cliente-agendamentos'] })
      qc.invalidateQueries({ queryKey: ['cliente-agendamentos-lista'] })
      qc.invalidateQueries({ queryKey: ['cliente-plano-utilizacao'] })
      success('Agendamento confirmado!', 'Até logo.')
      navigate('/cliente/agendamentos')
    },
    onError: (err: unknown) => {
      const mensagem =
        (err as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem ??
        'Não foi possível confirmar. Tente novamente.'
      error('Erro', mensagem)
    },
  })

  const voltar = () => setStep(s => Math.max(1, s - 1))

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
              <Calendar className="h-3.5 w-3.5" />
              Reserva de horário
            </p>
            <h1 className="text-2xl font-display font-bold text-surface-50 sm:text-3xl">
              Novo Agendamento
            </h1>
            <p className="mt-1 max-w-2xl text-sm font-body leading-relaxed text-surface-400">
              Escolha serviço, barbeiro e horário para confirmar seu próximo atendimento.
            </p>
          </div>

          <div className="rounded-lg border border-surface-800 bg-surface-950/60 px-3 py-2 text-xs font-body text-surface-400">
            Etapa {step} de {STEPS.length}
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} custom={1}>
        <StepBar atual={step} />
      </motion.div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <motion.div variants={fadeUp} custom={2} className="min-w-0">
          <Card className="min-w-0 overflow-hidden">
            <CardBody className="p-4 sm:p-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {step === 1 && (
                    <StepServico
                      utilizacao={utilizacaoPlano}
                      assinatura={assinaturaPlano}
                      onSelect={s => { setServico(s); setStep(2) }}
                    />
                  )}
                  {step === 2 && (
                    <StepBarbeiro onSelect={b => { setBarbeiro(b); setStep(3) }} />
                  )}
                  {step === 3 && servico && barbeiro && (
                    <StepHorario
                      servicoId={servico.id}
                      barbeiroId={barbeiro.id}
                      duracaoMinutos={servico.duracao}
                      onSelect={h => { setHorario(h); setStep(4) }}
                    />
                  )}
                  {step === 4 && servico && barbeiro && horario && (
                    <StepConfirmar
                      servico={servico}
                      barbeiro={barbeiro}
                      horario={horario}
                      loading={isPending}
                      onConfirmar={confirmar}
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              {step > 1 && (
                <div className="mt-6 border-t border-surface-800 pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    fullWidth
                    leftIcon={<ArrowLeft className="h-4 w-4" />}
                    onClick={voltar}
                    className="sm:w-auto"
                  >
                    Voltar
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} custom={3} className="flex min-w-0 flex-col gap-6">
          <Card className="min-w-0 overflow-hidden">
            <CardHeader className="px-4 sm:px-5">
              <p className="flex items-center gap-2 text-sm font-body font-semibold text-surface-100">
                <Sparkles className="h-4 w-4 text-brand-400" />
                Resumo da escolha
              </p>
              <p className="mt-0.5 text-xs font-body text-surface-500">Os detalhes aparecem conforme você avança.</p>
            </CardHeader>
            <CardBody className="p-4 sm:p-5">
              <div className="flex flex-col gap-3">
                <ResumoItem icon={Scissors} label="Serviço" value={servico?.nome ?? 'Ainda não selecionado'} active={!!servico} />
                <ResumoItem icon={UserRound} label="Barbeiro" value={barbeiro?.usuario.nome ?? 'Ainda não selecionado'} active={!!barbeiro} />
                <ResumoItem icon={Clock} label="Horário" value={horario ? `${formatDataExtenso(horario.inicio)} às ${formatHora(horario.inicio)}` : 'Ainda não selecionado'} active={!!horario} />
              </div>
            </CardBody>
          </Card>

          {servico && (
            <Card className="min-w-0 overflow-hidden">
              <CardHeader className="px-4 sm:px-5">
                <p className="flex items-center gap-2 text-sm font-body font-semibold text-surface-100">
                  <Timer className="h-4 w-4 text-brand-400" />
                  Serviço selecionado
                </p>
              </CardHeader>
              <CardBody className="p-4 sm:p-5">
                <div className="rounded-lg border border-surface-800 bg-surface-950/40 p-3">
                  <p className="text-sm font-body font-semibold text-surface-100">{servico.nome}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs font-body">
                    <span className="rounded-md border border-surface-800 bg-surface-900 px-2 py-1 text-surface-400">{servico.duracao}min</span>
                    <span className="rounded-md border border-brand-500/20 bg-brand-500/10 px-2 py-1 text-brand-300">{formatMoeda(servico.preco)}</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}

function ResumoItem({
  icon: Icon,
  label,
  value,
  active,
}: {
  icon: typeof Scissors
  label: string
  value: string
  active: boolean
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-lg border border-surface-800 bg-surface-950/40 p-3">
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border', active ? 'border-brand-500/25 bg-brand-500/10 text-brand-300' : 'border-surface-800 bg-surface-900 text-surface-600')}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-body font-semibold uppercase tracking-wider text-surface-500">{label}</p>
        <p className={cn('mt-0.5 truncate text-sm font-body font-semibold', active ? 'text-surface-100' : 'text-surface-600')}>
          {value}
        </p>
      </div>
    </div>
  )
}
