import { useState, useEffect } from 'react'
import type { AxiosError } from 'axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Plus,
  Power,
  Save,
  Scissors,
  Timer,
  Trash2,
  Utensils,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { api } from '@/services/api'
import { Button, Card, CardBody, CardHeader, CardFooter, SkeletonCard } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import type { Barbeiro } from '@/types'

const DIAS = [
  { idx: 1, label: 'Segunda-feira', short: 'Seg' },
  { idx: 2, label: 'Terça-feira',   short: 'Ter' },
  { idx: 3, label: 'Quarta-feira',  short: 'Qua' },
  { idx: 4, label: 'Quinta-feira',  short: 'Qui' },
  { idx: 5, label: 'Sexta-feira',   short: 'Sex' },
  { idx: 6, label: 'Sábado',        short: 'Sáb' },
  { idx: 0, label: 'Domingo',       short: 'Dom' },
]

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.08 } }),
}

interface HorarioDia {
  ativo:  boolean
  inicio: string
  fim:    string
  intervalos: IntervaloDia[]
}

interface IntervaloDia {
  inicio: string
  fim: string
}

type Grade = Record<number, HorarioDia>

interface DisponibilidadeApi {
  diaSemana: number
  horaInicio: string
  horaFim: string
  intervalos?: IntervaloDia[] | null
}

interface SummaryCardProps {
  label: string
  value: string | number
  helper: string
  icon: LucideIcon
  tone: string
}

function buildDefaultGrade(): Grade {
  const grade: Grade = {}
  DIAS.forEach(d => {
    grade[d.idx] = { ativo: false, inicio: '08:00', fim: '18:00', intervalos: [] }
  })
  return grade
}

function buildGrade(disp: DisponibilidadeApi[]): Grade {
  const grade = buildDefaultGrade()
  DIAS.forEach(d => {
    const item = disp.find(x => x.diaSemana === d.idx)
    if (item) {
      grade[d.idx] = {
        ativo: true,
        inicio: item.horaInicio,
        fim: item.horaFim,
        intervalos: Array.isArray(item.intervalos) ? item.intervalos : [],
      }
    }
  })
  return grade
}

function minutesBetween(inicio: string, fim: string) {
  const [inicioHora, inicioMinuto] = inicio.split(':').map(Number)
  const [fimHora, fimMinuto] = fim.split(':').map(Number)
  const start = inicioHora * 60 + inicioMinuto
  const end = fimHora * 60 + fimMinuto
  return Math.max(0, end - start)
}

function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (!hours) return `${minutes}min`
  if (!minutes) return `${hours}h`
  return `${hours}h ${minutes}min`
}

function minutosUteisDia(dia: HorarioDia) {
  const expediente = minutesBetween(dia.inicio, dia.fim)
  const intervalos = dia.intervalos.reduce((total, intervalo) => total + minutesBetween(intervalo.inicio, intervalo.fim), 0)
  return Math.max(0, expediente - intervalos)
}

function SummaryCard({ label, value, helper, icon: Icon, tone }: SummaryCardProps) {
  return (
    <div className="min-w-0 rounded-xl border border-surface-800 bg-surface-900 p-4 shadow-card">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-body font-semibold uppercase tracking-wider text-surface-500">{label}</p>
          <p className="mt-2 text-3xl font-display font-black leading-none text-surface-50">{value}</p>
          <p className="mt-2 text-xs font-body leading-relaxed text-surface-500">{helper}</p>
        </div>
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border', tone)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

export default function BarbeiroDisponibilidade() {
  const { usuario } = useAuth()
  const qc = useQueryClient()
  const { success, error } = useToast()
  const [grade, setGrade] = useState<Grade>(() => buildDefaultGrade())

  const { data: barbeiros, isLoading: isLoadingBarbeiro } = useQuery({
    queryKey: ['barbeiro-disponibilidade-barbeiros', usuario?.id],
    enabled: !!usuario,
    queryFn:  () => api.get<Barbeiro[]>('/barbeiros').then(r => r.data),
  })

  const barbeiroId = barbeiros?.find(b =>
    b.usuario.id === usuario?.id || b.usuario.email === usuario?.email
  )?.id

  const { data, isLoading } = useQuery({
    queryKey: ['barbeiro-disponibilidade', barbeiroId],
    enabled: !!barbeiroId,
    queryFn:  () => api.get<DisponibilidadeApi[]>(`/disponibilidade/${barbeiroId}`).then(r => r.data),
  })

  useEffect(() => {
    if (data) setGrade(buildGrade(data))
  }, [data])

  const { mutate: salvar, isPending } = useMutation({
    mutationFn: () => {
      if (!barbeiroId) {
        throw new Error('Barbeiro não identificado.')
      }

      const disponibilidades = Object.entries(grade)
        .filter(([, v]) => v.ativo)
        .map(([dia, v]) => ({
          diaSemana: Number(dia),
          horaInicio: v.inicio,
          horaFim: v.fim,
          intervalos: v.intervalos,
        }))
      return api.put(`/disponibilidade/${barbeiroId}`, { disponibilidades })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['barbeiro-disponibilidade', barbeiroId] })
      success('Disponibilidade salva!')
    },
    onError:   (err) => {
      const apiError = err as AxiosError<{ mensagem?: string }>
      const mensagem = apiError.response?.data?.mensagem ?? 'Não foi possível salvar.'
      error('Erro', mensagem)
    },
  })

  const toggle = (idx: number) =>
    setGrade(g => {
      const atual = g[idx] ?? { ativo: false, inicio: '08:00', fim: '18:00', intervalos: [] }
      return { ...g, [idx]: { ...atual, ativo: !atual.ativo } }
    })

  const setHorario = (idx: number, campo: 'inicio' | 'fim', val: string) =>
    setGrade(g => {
      const atual = g[idx] ?? { ativo: false, inicio: '08:00', fim: '18:00', intervalos: [] }
      return { ...g, [idx]: { ...atual, [campo]: val } }
    })

  const adicionarIntervalo = (idx: number) =>
    setGrade(g => {
      const atual = g[idx] ?? { ativo: true, inicio: '08:00', fim: '18:00', intervalos: [] }
      return {
        ...g,
        [idx]: {
          ...atual,
          intervalos: [...atual.intervalos, { inicio: '12:00', fim: '13:00' }],
        },
      }
    })

  const removerIntervalo = (idx: number, intervaloIndex: number) =>
    setGrade(g => {
      const atual = g[idx] ?? { ativo: true, inicio: '08:00', fim: '18:00', intervalos: [] }
      return {
        ...g,
        [idx]: {
          ...atual,
          intervalos: atual.intervalos.filter((_, index) => index !== intervaloIndex),
        },
      }
    })

  const setIntervalo = (idx: number, intervaloIndex: number, campo: keyof IntervaloDia, val: string) =>
    setGrade(g => {
      const atual = g[idx] ?? { ativo: true, inicio: '08:00', fim: '18:00', intervalos: [] }
      return {
        ...g,
        [idx]: {
          ...atual,
          intervalos: atual.intervalos.map((intervalo, index) =>
            index === intervaloIndex ? { ...intervalo, [campo]: val } : intervalo
          ),
        },
      }
    })

  const diasAtivos = DIAS.filter(d => grade[d.idx]?.ativo)
  const diasInativos = DIAS.length - diasAtivos.length
  const totalMinutosSemana = diasAtivos.reduce((total, d) => {
    const dia = grade[d.idx]
    return total + minutosUteisDia(dia)
  }, 0)
  const primeiroDiaAtivo = diasAtivos[0]
  const ultimoDiaAtivo = diasAtivos[diasAtivos.length - 1]
  const faixaSemana = primeiroDiaAtivo && ultimoDiaAtivo
    ? `${primeiroDiaAtivo.short} a ${ultimoDiaAtivo.short}`
    : 'Sem dias ativos'

  return (
    <motion.div initial="hidden" animate="visible" className="mx-auto flex w-full max-w-[1400px] min-w-0 flex-col gap-5 lg:gap-6">
      <motion.div
        variants={fadeUp}
        custom={0}
        className="relative min-w-0 overflow-hidden rounded-xl border border-surface-800 bg-surface-900 p-4 shadow-card lg:p-5"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-400/60 to-transparent" />
        <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <p className="mb-2 inline-flex items-center gap-2 rounded-md border border-brand-500/20 bg-brand-500/10 px-2.5 py-1 text-xs font-body font-semibold uppercase tracking-wider text-brand-300">
              <Clock className="h-3.5 w-3.5" />
              Configuração semanal
            </p>
            <h1 className="text-2xl font-display font-bold text-surface-50 sm:text-3xl">
              Disponibilidade
            </h1>
            <p className="mt-1 max-w-2xl text-sm font-body leading-relaxed text-surface-400">
              Defina os dias e horários em que você atende para alimentar a agenda de marcações.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-lg border border-surface-800 bg-surface-950/60 p-2 xl:min-w-[360px]">
            {DIAS.map(dia => {
              const ativo = grade[dia.idx]?.ativo
              return (
                <div key={dia.idx} className={cn('rounded-md px-2 py-2 text-center', ativo ? 'bg-brand-500/10 text-brand-300' : 'bg-surface-900 text-surface-600')}>
                  <p className="text-[11px] font-body font-semibold uppercase leading-tight">{dia.short}</p>
                  <p className={cn('mx-auto mt-1 h-1.5 w-8 rounded-full', ativo ? 'bg-brand-400' : 'bg-surface-700')} />
                </div>
              )
            })}
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} custom={1} className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Dias ativos"
          value={diasAtivos.length}
          helper="Dias liberados para receber agendamentos"
          icon={CalendarDays}
          tone="border-brand-500/25 bg-brand-500/10 text-brand-300"
        />
        <SummaryCard
          label="Horas semanais"
          value={formatDuration(totalMinutosSemana)}
          helper="Soma dos períodos configurados"
          icon={Timer}
          tone="border-blue-500/20 bg-blue-500/10 text-blue-400"
        />
        <SummaryCard
          label="Folgas padrão"
          value={diasInativos}
          helper="Dias sem atendimento recorrente"
          icon={Power}
          tone="border-surface-700 bg-surface-800/70 text-surface-400"
        />
        <SummaryCard
          label="Faixa da semana"
          value={faixaSemana}
          helper="Primeiro e último dia ativo"
          icon={CheckCircle2}
          tone="border-green-500/20 bg-green-500/10 text-green-400"
        />
      </motion.div>

      <motion.div variants={fadeUp} custom={2}>
        <Card className="w-full min-w-0 overflow-hidden">
          <CardHeader className="flex flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-body font-semibold text-surface-100">
                <Scissors className="h-4 w-4 shrink-0 text-brand-400" />
                <span>Horários de atendimento</span>
              </p>
              <p className="mt-0.5 text-xs font-body text-surface-500">
                Ative os dias de trabalho e defina início e fim do atendimento.
              </p>
            </div>
            <div className="rounded-md border border-surface-800 bg-surface-950/60 px-3 py-2 text-xs font-body text-surface-400">
              {diasAtivos.length} de {DIAS.length} dias configurados
            </div>
          </CardHeader>

          <CardBody className="p-4 sm:p-5">
            {isLoading || isLoadingBarbeiro ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} lines={1} />)}
              </div>
            ) : !barbeiroId ? (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 shrink-0 text-amber-300" />
                  <div>
                    <p className="text-sm font-body font-semibold text-amber-100">Cadastro de barbeiro não encontrado.</p>
                    <p className="mt-1 text-xs font-body leading-relaxed text-amber-200/80">
                      Não encontramos o seu cadastro de barbeiro nesta barbearia.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex min-w-0 flex-col gap-3">
                {DIAS.map(({ idx, label, short }) => {
                  const dia = grade[idx]
                  const ativo = !!dia?.ativo
                  const duracao = dia ? formatDuration(minutosUteisDia(dia)) : '0min'

                  return (
                    <div
                      key={idx}
                      className={cn(
                        'group min-w-0 overflow-hidden rounded-xl border transition-all duration-200',
                        ativo
                          ? 'border-brand-500/25 bg-brand-500/5 hover:border-brand-500/40'
                          : 'border-surface-800 bg-surface-950/40 hover:border-surface-700 hover:bg-surface-900',
                      )}
                    >
                      <div className="flex min-w-0 flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between lg:p-5">
                        <div className="flex min-w-0 items-center gap-3 lg:w-72 lg:shrink-0">
                          <button
                            type="button"
                            onClick={() => toggle(idx)}
                            className={cn(
                              'relative h-6 w-11 shrink-0 rounded-full border transition-all duration-200',
                              ativo ? 'border-brand-400/40 bg-brand-500 shadow-brand-sm' : 'border-surface-700 bg-surface-800',
                            )}
                            aria-pressed={ativo}
                            aria-label={ativo ? `Desativar ${label}` : `Ativar ${label}`}
                          >
                            <span className={cn(
                              'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200',
                              ativo ? 'left-5' : 'left-0.5',
                            )} />
                          </button>

                          <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg border border-surface-800 bg-surface-900">
                            <span className={cn('text-xs font-body font-semibold uppercase', ativo ? 'text-brand-300' : 'text-surface-500')}>
                              {short}
                            </span>
                          </div>

                          <div className="min-w-0">
                            <p className={cn('truncate text-sm font-body font-semibold', ativo ? 'text-surface-100' : 'text-surface-500')}>
                              {label}
                            </p>
                            <p className="mt-0.5 text-xs font-body text-surface-600">
                              {ativo ? `${duracao} de atendimento` : 'Não atende'}
                            </p>
                          </div>
                        </div>

                        {ativo ? (
                          <div className="flex min-w-0 flex-1 flex-col gap-3">
                            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                            <label className="min-w-0">
                              <span className="mb-1 block text-[11px] font-body font-semibold uppercase tracking-wider text-surface-500">Início</span>
                              <input
                                type="time"
                                value={dia.inicio}
                                onChange={e => setHorario(idx, 'inicio', e.target.value)}
                                className="h-10 min-w-0 w-full rounded-md border border-surface-700 bg-surface-900 px-3 text-sm font-body text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 [color-scheme:dark]"
                              />
                            </label>
                            <span className="mt-5 text-sm font-body text-surface-600">até</span>
                            <label className="min-w-0">
                              <span className="mb-1 block text-[11px] font-body font-semibold uppercase tracking-wider text-surface-500">Fim</span>
                              <input
                                type="time"
                                value={dia.fim}
                                onChange={e => setHorario(idx, 'fim', e.target.value)}
                                className="h-10 min-w-0 w-full rounded-md border border-surface-700 bg-surface-900 px-3 text-sm font-body text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 [color-scheme:dark]"
                              />
                            </label>
                            </div>

                            <div className="rounded-lg border border-surface-800 bg-surface-950/50 p-3">
                              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <p className="inline-flex items-center gap-2 text-xs font-body font-semibold uppercase tracking-wider text-surface-500">
                                  <Utensils className="h-3.5 w-3.5 text-brand-400" />
                                  Intervalos
                                </p>
                                <button
                                  type="button"
                                  onClick={() => adicionarIntervalo(idx)}
                                  className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-brand-500/30 bg-brand-500/10 px-3 text-xs font-body font-medium text-brand-300 transition-all hover:bg-brand-500/20"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  Adicionar intervalo
                                </button>
                              </div>

                              {dia.intervalos.length === 0 ? (
                                <p className="rounded-md border border-dashed border-surface-800 bg-surface-900/60 px-3 py-2 text-xs font-body text-surface-600">
                                  Nenhum intervalo configurado para este dia.
                                </p>
                              ) : (
                                <div className="flex flex-col gap-2">
                                  {dia.intervalos.map((intervalo, intervaloIndex) => (
                                    <div key={`${idx}-${intervaloIndex}`} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] items-center gap-2">
                                      <label className="min-w-0">
                                        <span className="sr-only">Início do intervalo</span>
                                        <input
                                          type="time"
                                          value={intervalo.inicio}
                                          onChange={e => setIntervalo(idx, intervaloIndex, 'inicio', e.target.value)}
                                          className="h-9 min-w-0 w-full rounded-md border border-surface-700 bg-surface-900 px-3 text-sm font-body text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 [color-scheme:dark]"
                                        />
                                      </label>
                                      <span className="text-sm font-body text-surface-600">até</span>
                                      <label className="min-w-0">
                                        <span className="sr-only">Fim do intervalo</span>
                                        <input
                                          type="time"
                                          value={intervalo.fim}
                                          onChange={e => setIntervalo(idx, intervaloIndex, 'fim', e.target.value)}
                                          className="h-9 min-w-0 w-full rounded-md border border-surface-700 bg-surface-900 px-3 text-sm font-body text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 [color-scheme:dark]"
                                        />
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() => removerIntervalo(idx, intervaloIndex)}
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-red-500/30 bg-red-500/10 text-red-400 transition-all hover:bg-red-500/20"
                                        aria-label="Remover intervalo"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex min-h-10 min-w-0 flex-1 items-center rounded-lg border border-dashed border-surface-800 bg-surface-900/40 px-3 text-xs font-body text-surface-600">
                            Sem horário recorrente neste dia.
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardBody>

          <CardFooter className="flex flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-xs font-body text-surface-500">
              As alterações passam a valer para os próximos horários disponíveis.
            </p>
            <Button
              variant="primary"
              size="md"
              loading={isPending}
              className="w-full sm:w-auto"
              leftIcon={<Save className="h-4 w-4" />}
              onClick={() => salvar()}
              disabled={!barbeiroId}
            >
              Salvar disponibilidade
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </motion.div>
  )
}
