import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CalendarDays, CalendarPlus, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '@/services/api'
import { Button, Table, BadgeAgendamento, Modal, TableColumn } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { compareIsoDateTime, formatIsoDateTime } from '@/lib/date'
import type { Agendamento, StatusAgendamento } from '@/types'

function formatDateTime(iso: string) {
  return formatIsoDateTime(iso)
}

const FILTROS: { label: string; value: StatusAgendamento | 'TODOS' }[] = [
  { label: 'Todos',           value: 'TODOS'          },
  { label: 'Pendentes',       value: 'PENDENTE'       },
  { label: 'Confirmados',     value: 'CONFIRMADO'     },
  { label: 'Concluídos',      value: 'CONCLUIDO'      },
  { label: 'Cancelados',      value: 'CANCELADO'      },
]

export default function ClienteAgendamentos() {
  const qc = useQueryClient()
  const { success, error } = useToast()
  const [filtro, setFiltro] = useState<StatusAgendamento | 'TODOS'>('TODOS')
  const [cancelando, setCancelando] = useState<Agendamento | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['cliente-agendamentos-lista'],
    queryFn:  () => api.get<Agendamento[]>('/agendamentos/meus').then(r => r.data),
  })

  const { mutate: cancelar, isPending } = useMutation({
    mutationFn: (id: string) =>
      api.patch(`/agendamentos/${id}/status`, { status: 'CANCELADO' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cliente-agendamentos-lista'] })
      qc.invalidateQueries({ queryKey: ['cliente-agendamentos'] })
      success('Agendamento cancelado.')
      setCancelando(null)
    },
    onError: () => error('Erro', 'Não foi possível cancelar. Tente novamente.'),
  })

  const lista = (data ?? []).filter(a => filtro === 'TODOS' || a.status === filtro)
    .sort((a, b) => compareIsoDateTime(b.inicio, a.inicio))

  const columns: TableColumn<Agendamento>[] = [
    {
      key: 'servico', header: 'Serviço',
      render: (a) => (
        <div className="min-w-0 max-w-full overflow-hidden">
          <p className="break-words font-medium text-surface-100">{a.servico.nome}</p>
          <p className="break-words text-xs text-surface-500">com {a.barbeiro.usuario.nome}</p>
        </div>
      ),
    },
    {
      key: 'inicio', header: 'Data e hora', mobileLabel: 'Quando',
      render: (a) => (
        <span className="text-surface-300 tabular-nums">{formatDateTime(a.inicio)}</span>
      ),
    },
    {
      key: 'preco', header: 'Valor', align: 'center', mobileLabel: 'Valor',
      render: (a) => (
        <span className="text-brand-400 font-medium">
          R$ {Number(a.servico.preco).toFixed(2).replace('.', ',')}
        </span>
      ),
    },
    {
      key: 'status', header: 'Status', align: 'center', mobileLabel: 'Status',
      render: (a) => <BadgeAgendamento status={a.status} className="max-w-full" />,
    },
    {
      key: 'acoes', header: '', align: 'right',
      render: (a) => ['PENDENTE', 'CONFIRMADO'].includes(a.status) ? (
        <Button
          variant="ghost" size="sm"
          leftIcon={<X className="w-3.5 h-3.5 text-red-400" />}
          onClick={() => setCancelando(a)}
          className="max-w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          Cancelar
        </Button>
      ) : null,
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex w-full max-w-5xl flex-col gap-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="flex min-w-0 items-center gap-2 text-2xl font-display font-bold text-surface-50">
            <CalendarDays className="h-5 w-5 shrink-0 text-brand-400" />
            <span className="min-w-0 break-words">Meus Agendamentos</span>
          </h1>
          <p className="text-surface-400 font-body text-sm mt-0.5">
            {data?.length ?? 0} agendamento{(data?.length ?? 0) !== 1 ? 's' : ''} no total
          </p>
        </div>
        <Link to="/cliente/novo-agendamento" className="w-full sm:w-auto">
          <Button variant="primary" size="sm" fullWidth leftIcon={<CalendarPlus className="w-4 h-4" />}>
            Novo
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="w-full min-w-0 overflow-x-auto">
        <div className="flex w-max max-w-none gap-2 sm:w-full sm:flex-wrap">
        {FILTROS.map(f => (
          <button
            key={f.value}
            onClick={() => setFiltro(f.value)}
            className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-body font-medium transition-all ${
              filtro === f.value
                ? 'bg-brand-500/15 text-brand-400 border-brand-500/30'
                : 'bg-surface-900 text-surface-400 border-surface-800 hover:border-surface-700'
            }`}
          >
            {f.label}
          </button>
        ))}
        </div>
      </div>

      <Table
        columns={columns}
        data={lista}
        loading={isLoading}
        emptyMessage="Nenhum agendamento encontrado."
        emptyIcon={<CalendarDays className="w-8 h-8" />}
        rowKey={a => a.id}
        className="max-w-full"
      />

      {/* Modal confirmar cancelamento */}
      <Modal
        isOpen={!!cancelando}
        onClose={() => setCancelando(null)}
        title="Cancelar agendamento"
        size="sm"
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="md" onClick={() => setCancelando(null)}>
              Voltar
            </Button>
            <Button
              variant="danger" size="md"
              loading={isPending}
              onClick={() => cancelando && cancelar(cancelando.id)}
            >
              Confirmar cancelamento
            </Button>
          </div>
        }
      >
        {cancelando && (
          <div className="flex flex-col gap-3">
            <p className="text-surface-300 font-body text-sm">
              Tem certeza que deseja cancelar este agendamento?
            </p>
            <div className="bg-surface-800 rounded-lg p-3 text-sm font-body">
              <p className="text-surface-100 font-medium">{cancelando.servico.nome}</p>
              <p className="text-surface-400 mt-0.5">
                {formatDateTime(cancelando.inicio)} · com {cancelando.barbeiro.usuario.nome}
              </p>
            </div>
            <p className="text-xs text-surface-500">Esta ação não pode ser desfeita.</p>
          </div>
        )}
      </Modal>
    </motion.div>
  )
}
