import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Users, Search, CreditCard } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/services/api'
import { Button, Modal, Table, Input, TableColumn } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import type { Cliente, Plano } from '@/types'

function formatData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

export default function AdminClientes() {
  const qc = useQueryClient()
  const [busca, setBusca] = useState('')
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [planoId, setPlanoId] = useState('')
  const { success, error } = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-clientes'],
    queryFn:  () => api.get<Cliente[]>('/clientes').then(r => r.data),
  })

  const { data: planos } = useQuery({
    queryKey: ['admin-planos-ativos'],
    queryFn:  () => api.get<Plano[]>('/planos').then(r => r.data.filter(p => p.ativo)),
  })

  const lista = (data ?? []).filter(c =>
    !busca ||
    c.usuario.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.usuario.email.toLowerCase().includes(busca.toLowerCase()),
  )

  const { mutate: atribuirPlano, isPending: atribuindo } = useMutation({
    mutationFn: () => {
      if (!clienteSelecionado || !planoId) {
        throw new Error('Selecione um cliente e um plano.')
      }

      return api.post('/assinaturas/atribuir', {
        clienteId: clienteSelecionado.id,
        planoId,
      })
    },
    onSuccess: () => {
      success('Plano atribuído', 'A assinatura do cliente foi atualizada.')
      qc.invalidateQueries({ queryKey: ['admin-clientes'] })
      qc.invalidateQueries({ queryKey: ['admin-assinaturas'] })
      setClienteSelecionado(null)
      setPlanoId('')
    },
    onError: () => {
      error('Erro', 'Não foi possível atribuir o plano.')
    },
  })

  const columns: TableColumn<Cliente>[] = [
    { key: 'nome', header: 'Cliente',
      render: c => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-brand-400">{c.usuario.nome.charAt(0)}</span>
          </div>
          <div>
            <p className="font-medium text-surface-100">{c.usuario.nome}</p>
            <p className="text-xs text-surface-500">{c.usuario.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'telefone', header: 'Telefone',
      render: c => <span className="text-surface-300">{c.usuario.telefone ?? '—'}</span>,
    },
    { key: 'criadoEm', header: 'Cliente desde', align: 'center',
      render: c => <span className="text-surface-400 text-sm">{formatData(c.criadoEm)}</span>,
    },
    { key: 'acoes', header: '', align: 'right',
      render: c => (
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<CreditCard className="w-3.5 h-3.5" />}
          onClick={() => {
            setClienteSelecionado(c)
            setPlanoId((planos?.[0]?.id) ?? '')
          }}
        >
          Atribuir plano
        </Button>
      ),
    },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-surface-50 flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-400" /> Clientes
          </h1>
          <p className="text-surface-400 font-body text-sm mt-0.5">
            {data?.length ?? 0} clientes cadastrados. Os planos são controlados na área de assinaturas.
          </p>
        </div>
        <div className="w-full sm:w-64">
          <Input placeholder="Buscar por nome ou e-mail..." leftIcon={<Search className="w-4 h-4" />}
            value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
      </div>

      <Table columns={columns} data={lista} loading={isLoading} rowKey={c => c.id}
        emptyMessage="Nenhum cliente encontrado." emptyIcon={<Users className="w-8 h-8" />} />

      <Modal
        isOpen={clienteSelecionado !== null}
        onClose={() => {
          setClienteSelecionado(null)
          setPlanoId('')
        }}
        title="Atribuir plano"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="md" onClick={() => {
              setClienteSelecionado(null)
              setPlanoId('')
            }}>
              Cancelar
            </Button>
            <Button variant="primary" size="md" loading={atribuindo}
              onClick={() => atribuirPlano()}>
              Salvar
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-medium text-surface-100">{clienteSelecionado?.usuario.nome}</p>
            <p className="text-xs text-surface-500">{clienteSelecionado?.usuario.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-200 mb-2">
              Plano
            </label>
            <select
              value={planoId}
              onChange={(e) => setPlanoId(e.target.value)}
              className="w-full h-10 px-3 rounded-md border bg-surface-900 border-surface-700 text-surface-100 font-body text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="">Selecione um plano</option>
              {(planos ?? []).map(plano => (
                <option key={plano.id} value={plano.id}>
                  {plano.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
