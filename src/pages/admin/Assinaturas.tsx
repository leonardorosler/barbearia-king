import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ClipboardList } from 'lucide-react'
import { api } from '@/services/api'
import { Table, BadgeAssinatura, TableColumn } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import type { Assinatura, StatusAssinatura } from '@/types'
import { LABEL_STATUS_ASSINATURA } from '@/types'

const STATUS_OPTIONS: StatusAssinatura[] = ['ATIVA', 'CANCELADA', 'INADIMPLENTE', 'EXPIRADA']

function formatData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

export default function AdminAssinaturas() {
  const qc = useQueryClient()
  const { success, error } = useToast()
  const [filtro, setFiltro] = useState<StatusAssinatura | 'TODAS'>('TODAS')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-assinaturas'],
    queryFn:  () => api.get<Assinatura[]>('/assinaturas').then(r => r.data),
  })

  const { mutate: atualizarStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: StatusAssinatura }) =>
      api.patch(`/assinaturas/${id}/status`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-assinaturas'] }); success('Status atualizado.') },
    onError:   () => error('Erro', 'Não foi possível atualizar o status.'),
  })

  const lista = (data ?? []).filter(a => filtro === 'TODAS' || a.status === filtro)

  const columns: TableColumn<Assinatura>[] = [
    { key: 'cliente', header: 'Cliente',
      render: a => <div>
        <p className="font-medium text-surface-100">{a.cliente.usuario.nome}</p>
        <p className="text-xs text-surface-500">{a.cliente.usuario.email}</p>
      </div>,
    },
    { key: 'plano', header: 'Plano',
      render: a => <span className="text-surface-300">{a.plano.nome}</span>,
    },
    { key: 'preco', header: 'Valor/mês', align: 'center',
      render: a => <span className="text-brand-400 font-medium">R$ {Number(a.plano.preco).toFixed(2).replace('.', ',')}</span>,
    },
    { key: 'status', header: 'Status', align: 'center',
      render: a => <BadgeAssinatura status={a.status} />,
    },
    { key: 'criadoEm', header: 'Desde', align: 'center',
      render: a => <span className="text-surface-400 text-sm">{formatData(a.criadoEm)}</span>,
    },
    { key: 'acoes', header: 'Alterar status', align: 'right',
      render: a => (
        <select
          value={a.status}
          onChange={e => atualizarStatus({ id: a.id, status: e.target.value as StatusAssinatura })}
          className="h-8 px-2 rounded-md border bg-surface-900 border-surface-700 text-surface-300 font-body text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        >
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{LABEL_STATUS_ASSINATURA[s]}</option>)}
        </select>
      ),
    },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-surface-50 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-brand-400" /> Assinaturas
        </h1>
        <p className="text-surface-400 font-body text-sm mt-0.5">
          {data?.length ?? 0} assinaturas no total. O plano do cliente é definido pela equipe.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['TODAS', ...STATUS_OPTIONS] as const).map(s => (
          <button key={s} onClick={() => setFiltro(s as typeof filtro)}
            className={`px-3 py-1.5 rounded-lg text-xs font-body font-medium border transition-all ${
              filtro === s
                ? 'bg-brand-500/15 text-brand-400 border-brand-500/30'
                : 'bg-surface-900 text-surface-400 border-surface-800 hover:border-surface-700'
            }`}>
            {s === 'TODAS' ? 'Todas' : LABEL_STATUS_ASSINATURA[s]}
          </button>
        ))}
      </div>

      <Table columns={columns} data={lista} loading={isLoading} rowKey={a => a.id}
        emptyMessage="Nenhuma assinatura encontrada." emptyIcon={<ClipboardList className="w-8 h-8" />} />
    </motion.div>
  )
}
