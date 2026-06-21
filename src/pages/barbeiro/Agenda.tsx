import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { api } from '@/services/api'
import { Button, BadgeAgendamento } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'
import { compareIsoDateTime, formatIsoTime, toDateInputValue } from '@/lib/date'
import type { Agendamento, StatusAgendamento } from '@/types'
// import { LABEL_STATUS_AGENDAMENTO } from '@/types'

const STATUS_ACOES: { status: StatusAgendamento; label: string; variant: string }[] = [
  { status: 'CONFIRMADO',    label: 'Confirmar',         variant: 'bg-blue-500/15 text-blue-400 border-blue-500/30 hover:bg-blue-500/25'   },
  { status: 'CONCLUIDO',     label: 'Concluir',          variant: 'bg-green-500/15 text-green-400 border-green-500/30 hover:bg-green-500/25'},
  { status: 'NAO_COMPARECEU',label: 'Não compareceu',    variant: 'bg-surface-800 text-surface-400 border-surface-700 hover:bg-surface-700'  },
  { status: 'CANCELADO',     label: 'Cancelar',          variant: 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25'       },
]

function addDias(date: Date, n: number) {
  const d = new Date(date); d.setDate(d.getDate() + n); return d
}
function toInput(date: Date) { return toDateInputValue(date) }
function formatHora(iso: string) {
  return formatIsoTime(iso)
}
// function nomeDia(date: Date) {
//   return date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
// }

export default function BarbeiroAgenda() {
  const qc = useQueryClient()
  const { success, error } = useToast()
  const [base, setBase] = useState(new Date())

  // 7 dias a partir de base
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

  const sorted = (agendamentos ?? []).sort((a, b) => compareIsoDateTime(a.inicio, b.inicio))

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-surface-50 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-brand-400" /> Minha Agenda
        </h1>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setBase(d => addDias(d, -7))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setBase(new Date()); setDiaSelecionado(toInput(new Date())) }}>
            Hoje
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setBase(d => addDias(d, 7))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Seletor de dia */}
      <div className="grid grid-cols-7 gap-1">
        {dias.map(dia => {
          const val    = toInput(dia)
          const hoje   = toInput(new Date())
          const ativo  = val === diaSelecionado
          const isHoje = val === hoje
          return (
            <button key={val} onClick={() => setDiaSelecionado(val)}
              className={cn(
                'flex flex-col items-center py-2 px-1 rounded-lg border text-center transition-all duration-150',
                ativo
                  ? 'bg-brand-500/15 border-brand-500/40 text-brand-400'
                  : 'bg-surface-900 border-surface-800 text-surface-400 hover:border-surface-700',
              )}
            >
              <span className="text-2xs font-body uppercase tracking-wider">
                {dia.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
              </span>
              <span className={cn(
                'text-base font-display font-bold mt-0.5',
                ativo ? 'text-brand-300' : isHoje ? 'text-surface-100' : 'text-surface-300',
              )}>
                {dia.getDate()}
              </span>
              {isHoje && !ativo && (
                <div className="w-1 h-1 rounded-full bg-brand-500 mt-1" />
              )}
            </button>
          )
        })}
      </div>

      {/* Lista de atendimentos */}
      <div>
        <p className="text-sm font-body text-surface-400 mb-3">
          {sorted.length} atendimento(s) em {new Date(diaSelecionado + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
        </p>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-surface-800 animate-shimmer" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="py-12 text-center border border-surface-800 rounded-xl bg-surface-900">
            <CalendarDays className="w-8 h-8 text-surface-700 mx-auto mb-3" />
            <p className="text-surface-400 font-body text-sm">Nenhum agendamento neste dia.</p>
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
                <div key={ag.id} className="p-4 rounded-xl border bg-surface-900 border-surface-800">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 shrink-0 text-center">
                        <p className="text-sm font-display font-bold text-brand-400">{formatHora(ag.inicio)}</p>
                        <p className="text-xs text-surface-600">{formatHora(ag.fim)}</p>
                      </div>
                      <div>
                        <p className="font-body font-semibold text-surface-100">{ag.cliente.usuario.nome}</p>
                        <p className="text-xs text-surface-500 mt-0.5">
                          {ag.servico.nome} · {ag.servico.duracao}min ·
                          R$ {Number(ag.servico.preco).toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                    </div>
                    <BadgeAgendamento status={ag.status} />
                  </div>

                  {acoesDisponiveis.length > 0 && (
                    <div className="flex gap-2 flex-wrap pt-3 border-t border-surface-800">
                      {acoesDisponiveis.map(acao => (
                        <button key={acao.status}
                          onClick={() => atualizar({ id: ag.id, status: acao.status })}
                          className={cn(
                            'px-3 py-1 rounded-lg text-xs font-body font-medium border transition-all',
                            acao.variant,
                          )}
                        >
                          {acao.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}
