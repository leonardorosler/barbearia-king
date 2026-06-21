import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CalendarDays } from 'lucide-react'
import { api } from '@/services/api'
import { Table, BadgeAgendamento, TableColumn } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { formatIsoDateTime } from '@/lib/date'
import type { Agendamento, StatusAgendamento} from '@/types'
import { LABEL_STATUS_AGENDAMENTO } from '@/types'

const STATUS_OPTIONS: StatusAgendamento[] = ['PENDENTE','CONFIRMADO','CONCLUIDO','CANCELADO','NAO_COMPARECEU']

function formatDateTime(iso: string) {
  return formatIsoDateTime(iso)
}

export default function AdminAgendamentos() {
  const qc = useQueryClient()
  const { success, error } = useToast()
  const [filtro, setFiltro] = useState<StatusAgendamento | 'TODOS'>('TODOS')
  const [data, setData] = useState('')

  const { data: lista, isLoading } = useQuery({
    queryKey: ['admin-agendamentos', data],
    queryFn:  () => api.get<Agendamento[]>('/agendamentos', { params: data ? { data } : {} }).then(r => r.data),
  })

  const { mutate: atualizarStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: StatusAgendamento }) =>
      api.patch(`/agendamentos/${id}/status`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-agendamentos'] }); success('Status atualizado.') },
    onError:   () => error('Erro', 'Não foi possível atualizar o status.'),
  })

  const filtrados = (lista ?? []).filter(a => filtro === 'TODOS' || a.status === filtro)

  const columns: TableColumn<Agendamento>[] = [
    { key: 'cliente', header: 'Cliente',
      render: (a: Agendamento) => <div>
        <p className="font-medium text-surface-100">{a.cliente.usuario.nome}</p>
        <p className="text-xs text-surface-500">{a.servico.nome}</p>
      </div>,
    },
    { key: 'barbeiro', header: 'Barbeiro',
      render: (a: Agendamento) => <span className="text-surface-300">{a.barbeiro.usuario.nome}</span>,
    },
    { key: 'inicio', header: 'Data/hora',
      render: (a: Agendamento) => <span className="text-surface-300 tabular-nums text-sm">{formatDateTime(a.inicio)}</span>,
    },
    { key: 'status', header: 'Status', align: 'center',
      render: (a: Agendamento) => <BadgeAgendamento status={a.status} />,
    },
    { key: 'acoes', header: 'Alterar status', align: 'right',
      render: (a: Agendamento) => (
        <select
          value={a.status}
          onChange={e => atualizarStatus({ id: a.id, status: e.target.value as StatusAgendamento })}
          className="h-8 px-2 rounded-md border bg-surface-900 border-surface-700 text-surface-300 font-body text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        >
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{LABEL_STATUS_AGENDAMENTO[s]}</option>)}
        </select>
      ),
    },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-surface-50 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-brand-400" /> Agendamentos
        </h1>
        <p className="text-surface-400 font-body text-sm mt-0.5">{lista?.length ?? 0} agendamento(s)</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div>
          <label className="text-xs font-body text-surface-400 block mb-1">Filtrar por data</label>
          <input type="date" value={data} onChange={e => setData(e.target.value)}
            className="h-9 px-3 rounded-md border bg-surface-900 border-surface-700 text-surface-100 font-body text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 [color-scheme:dark]" />
        </div>
        <div className="flex gap-2 flex-wrap sm:mt-5">
          {(['TODOS', ...STATUS_OPTIONS] as const).map(s => (
            <button key={s} onClick={() => setFiltro(s as typeof filtro)}
              className={`px-3 py-1.5 rounded-lg text-xs font-body font-medium border transition-all ${
                filtro === s
                  ? 'bg-brand-500/15 text-brand-400 border-brand-500/30'
                  : 'bg-surface-900 text-surface-400 border-surface-800 hover:border-surface-700'
              }`}>
              {s === 'TODOS' ? 'Todos' : LABEL_STATUS_AGENDAMENTO[s]}
            </button>
          ))}
        </div>
      </div>

      <Table columns={columns} data={filtrados} loading={isLoading} rowKey={a => a.id}
        emptyMessage="Nenhum agendamento encontrado." emptyIcon={<CalendarDays className="w-8 h-8" />} />
    </motion.div>
  )
}
