import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronLeft, Scissors, User, Calendar, Clock } from 'lucide-react'
import { api } from '@/services/api'
import { Button, SkeletonCard } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'
import { formatIsoDateLong, formatIsoTime, toDateInputValue } from '@/lib/date'
import type { Servico, Barbeiro, HorarioDisponivel } from '@/types'

function barbeiroEstaAtivo(barbeiro: Barbeiro) {
  return barbeiro.usuario.ativo ?? barbeiro.ativo ?? true
}

// ─── Steps ───────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Serviço',  icon: Scissors  },
  { id: 2, label: 'Barbeiro', icon: User       },
  { id: 3, label: 'Horário',  icon: Calendar   },
  { id: 4, label: 'Confirmar',icon: Check      },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDateInput(date: Date) {
  return toDateInputValue(date)
}

function formatHora(iso: string) {
  return formatIsoTime(iso)
}

function formatDataExtenso(iso: string) {
  return formatIsoDateLong(iso)
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

// ─── Barra de progresso ───────────────────────────────────────────────────────

function StepBar({ atual }: { atual: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((step, i) => {
        const done    = step.id < atual
        const active  = step.id === atual
        const Icon    = step.icon
        return (
          <div key={step.id} className="flex items-center gap-2 flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                done   && 'bg-brand-500 border-brand-500',
                active && 'bg-brand-500/15 border-brand-500',
                !done && !active && 'bg-surface-900 border-surface-700',
              )}>
                {done
                  ? <Check className="w-3.5 h-3.5 text-white" />
                  : <Icon className={cn('w-3.5 h-3.5', active ? 'text-brand-400' : 'text-surface-600')} />
                }
              </div>
              <span className={cn(
                'text-2xs font-body hidden sm:block',
                active ? 'text-brand-400' : done ? 'text-surface-400' : 'text-surface-600',
              )}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                'flex-1 h-px mb-4 transition-colors duration-300',
                done ? 'bg-brand-500' : 'bg-surface-800',
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Step 1: Serviço ──────────────────────────────────────────────────────────

function StepServico({ onSelect }: { onSelect: (s: Servico) => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['servicos-ag'],
    queryFn:  () => api.get<Servico[]>('/servicos').then(r => r.data.filter(s => s.ativo)),
  })

  return (
    <div>
      <h2 className="text-xl font-display font-bold text-surface-50 mb-1">Escolha o serviço</h2>
      <p className="text-surface-400 font-body text-sm mb-6">Selecione o que você deseja realizar.</p>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={2} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(data ?? []).map(s => (
            <button key={s.id} onClick={() => onSelect(s)}
              className={cn(
                'group text-left p-4 rounded-xl border transition-all duration-200',
                'bg-surface-900 border-surface-800',
                'hover:border-brand-500/50 hover:shadow-brand',
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <p className="font-display font-semibold text-surface-50 group-hover:text-brand-300 transition-colors">
                  {s.nome}
                </p>
                <span className="text-brand-400 font-bold font-body text-sm shrink-0 ml-2">
                  R$ {Number(s.preco).toFixed(2).replace('.', ',')}
                </span>
              </div>
              {s.descricao && (
                <p className="text-surface-500 font-body text-xs mb-2 line-clamp-2">{s.descricao}</p>
              )}
              <div className="flex items-center gap-1 text-surface-500 text-xs font-body">
                <Clock className="w-3 h-3" /> {s.duracao} min
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Step 2: Barbeiro ─────────────────────────────────────────────────────────

function StepBarbeiro({ onSelect }: { onSelect: (b: Barbeiro) => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['barbeiros-ag'],
    queryFn:  () => api.get<Barbeiro[]>('/barbeiros').then(r => r.data.filter(barbeiroEstaAtivo)),
  })

  return (
    <div>
      <h2 className="text-xl font-display font-bold text-surface-50 mb-1">Escolha o barbeiro</h2>
      <p className="text-surface-400 font-body text-sm mb-6">Quem vai cuidar de você hoje?</p>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} hasAvatar lines={1} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {(data ?? []).map(b => (
            <button key={b.id} onClick={() => onSelect(b)}
              className={cn(
                'group text-center p-4 rounded-xl border transition-all duration-200',
                'bg-surface-900 border-surface-800',
                'hover:border-brand-500/50 hover:shadow-brand flex flex-col items-center gap-3',
              )}
            >
              <div className="w-16 h-16 rounded-full overflow-hidden bg-surface-800 border-2 border-surface-700 group-hover:border-brand-500/50 transition-colors shrink-0">
                {b.foto ? (
                  <img src={b.foto} alt={b.usuario.nome} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-xl font-display font-bold text-brand-500/50">
                      {b.usuario.nome.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <p className="font-body font-semibold text-surface-100 text-sm">{b.usuario.nome}</p>
                {(b.especialidades ?? []).length > 0 && (
                  <p className="text-xs text-surface-500 mt-0.5">
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

// ─── Step 3: Horário ──────────────────────────────────────────────────────────

function StepHorario({
  servicoId, barbeiroId,
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
      <h2 className="text-xl font-display font-bold text-surface-50 mb-1">Escolha o horário</h2>
      <p className="text-surface-400 font-body text-sm mb-6">Selecione o dia e o horário disponível.</p>

      <div className="mb-5">
        <label className="text-sm font-medium font-body text-surface-200 block mb-1.5">Data</label>
        <input
          type="date"
          value={dataSelecionada}
          min={toDateInput(hoje)}
          onChange={e => setDataSelecionada(e.target.value)}
          className={cn(
            'w-full sm:w-auto h-10 px-3 rounded-md border bg-surface-900',
            'border-surface-700 text-surface-100 font-body text-sm',
            'focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500',
            '[color-scheme:dark]',
          )}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-surface-800 animate-shimmer" />
          ))}
        </div>
      ) : !horarios?.length ? (
        <div className="py-10 text-center">
          <Clock className="w-8 h-8 text-surface-700 mx-auto mb-3" />
          <p className="text-surface-400 font-body text-sm">Nenhum horário disponível nesta data.</p>
          <p className="text-surface-600 font-body text-xs mt-1">Tente outro dia.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {horarios.map(hora => (
            <button
              key={hora}
              onClick={() => onSelect({
                inicio: buildDateTime(dataSelecionada, hora),
                fim: addMinutesToDateTime(dataSelecionada, hora, duracaoMinutos),
              })}
              className={cn(
                'h-10 rounded-lg border text-sm font-body font-medium transition-all duration-150',
                'bg-surface-900 border-surface-700 text-surface-300',
                'hover:border-brand-500/60 hover:bg-brand-500/10 hover:text-brand-300',
              )}
            >
              {hora}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Step 4: Confirmação ──────────────────────────────────────────────────────

function StepConfirmar({
  servico, barbeiro, horario, loading, onConfirmar,
}: {
  servico:    Servico
  barbeiro:   Barbeiro
  horario:    HorarioDisponivel
  loading:    boolean
  onConfirmar: () => void
}) {
  const items = [
    { label: 'Serviço',   value: servico.nome                                            },
    { label: 'Barbeiro',  value: barbeiro.usuario.nome                                   },
    { label: 'Data',      value: formatDataExtenso(horario.inicio)                       },
    { label: 'Horário',   value: `${formatHora(horario.inicio)} – ${formatHora(horario.fim)}` },
    { label: 'Duração',   value: `${servico.duracao} minutos`                            },
    { label: 'Valor',     value: `R$ ${Number(servico.preco).toFixed(2).replace('.', ',')}` },
  ]

  return (
    <div>
      <h2 className="text-xl font-display font-bold text-surface-50 mb-1">Confirmar agendamento</h2>
      <p className="text-surface-400 font-body text-sm mb-6">Confira os detalhes antes de confirmar.</p>

      <div className="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden mb-6">
        {items.map((item, i) => (
          <div key={item.label} className={cn(
            'flex items-center justify-between px-4 py-3 font-body text-sm',
            i < items.length - 1 && 'border-b border-surface-800',
          )}>
            <span className="text-surface-500">{item.label}</span>
            <span className={cn(
              'font-medium',
              item.label === 'Valor' ? 'text-brand-400' : 'text-surface-100',
            )}>
              {item.value}
            </span>
          </div>
        ))}
      </div>

      <Button
        variant="primary" size="lg" fullWidth
        loading={loading}
        leftIcon={<Check className="w-4 h-4" />}
        onClick={onConfirmar}
      >
        Confirmar agendamento
      </Button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NovoAgendamento() {
  const navigate = useNavigate()
  const qc       = useQueryClient()
  const { success, error } = useToast()

  const [step, setStep]       = useState(1)
  const [servico, setServico] = useState<Servico | null>(null)
  const [barbeiro, setBarbeiro] = useState<Barbeiro | null>(null)
  const [horario, setHorario] = useState<HorarioDisponivel | null>(null)

  const { mutate: confirmar, isPending } = useMutation({
    mutationFn: () => api.post('/agendamentos', {
      servicoId: servico!.id,
      barbeiroId: barbeiro!.id,
      inicio: horario!.inicio,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cliente-agendamentos'] })
      qc.invalidateQueries({ queryKey: ['cliente-agendamentos-lista'] })
      success('Agendamento confirmado!', 'Até logo. ✂️')
      navigate('/cliente/agendamentos')
    },
    onError: () => error('Erro', 'Não foi possível confirmar. Tente novamente.'),
  })

  const voltar = () => setStep(s => Math.max(1, s - 1))

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-surface-50">Novo Agendamento</h1>
        <p className="text-surface-400 font-body text-sm mt-0.5">Siga os passos abaixo.</p>
      </div>

      <StepBar atual={step} />

      <div className="bg-surface-900 border border-surface-800 rounded-xl p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 1 && (
              <StepServico onSelect={s => { setServico(s); setStep(2) }} />
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
          <div className="mt-6 pt-4 border-t border-surface-800">
            <Button variant="ghost" size="sm" leftIcon={<ChevronLeft className="w-4 h-4" />} onClick={voltar}>
              Voltar
            </Button>
          </div>
        )}
      </div>

      {/* Resumo lateral do que já foi selecionado */}
      {(servico || barbeiro) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {servico && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-xs font-body text-brand-400">
              <Scissors className="w-3 h-3" /> {servico.nome}
            </span>
          )}
          {barbeiro && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-xs font-body text-brand-400">
              <User className="w-3 h-3" /> {barbeiro.usuario.nome}
            </span>
          )}
        </div>
      )}
    </motion.div>
  )
}
