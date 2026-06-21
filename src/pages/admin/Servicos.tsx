import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Plus, Pencil, PackageCheck } from 'lucide-react'
import { api } from '@/services/api'
import { Button, Table, Modal, Input, Badge, TableColumn } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import type { Servico } from '@/types'

const schema = z.object({
  nome:      z.string().min(2, 'Nome obrigatório'),
  preco:     z.coerce.number().positive('Preço deve ser positivo'),
  duracao:   z.coerce.number().int().positive('Duração deve ser positiva'),
  descricao: z.string().optional(),
  ativo:     z.boolean().optional(),
})
type FormData = z.infer<typeof schema>

export default function AdminServicos() {
  const qc = useQueryClient()
  const { success, error } = useToast()
  const [modal, setModal] = useState<{ open: boolean; servico: Servico | null }>({ open: false, servico: null })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-servicos'],
    queryFn:  () => api.get<Servico[]>('/servicos').then(r => r.data),
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) as Resolver<FormData> })

  const abrir = (servico?: Servico) => {
    reset(servico
      ? { nome: servico.nome, preco: Number(servico.preco), duracao: servico.duracao, descricao: servico.descricao ?? '', ativo: servico.ativo }
      : { nome: '', preco: 0, duracao: 30, descricao: '', ativo: true })
    setModal({ open: true, servico: servico ?? null })
  }

  const { mutate: salvar } = useMutation({
    mutationFn: (data: FormData) => modal.servico
      ? api.patch(`/servicos/${modal.servico.id}`, data)
      : api.post('/servicos', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-servicos'] })
      success(modal.servico ? 'Serviço atualizado.' : 'Serviço criado.')
      setModal({ open: false, servico: null })
    },
    onError: () => error('Erro', 'Não foi possível salvar o serviço.'),
  })

  const columns: TableColumn<Servico>[] = [
    { key: 'nome',    header: 'Serviço',
      render: s => <div><p className="font-medium text-surface-100">{s.nome}</p>
        {s.descricao && <p className="text-xs text-surface-500 mt-0.5 line-clamp-1">{s.descricao}</p>}</div> },
    { key: 'preco',   header: 'Preço', align: 'center',
      render: s => <span className="text-brand-400 font-medium">R$ {Number(s.preco).toFixed(2).replace('.', ',')}</span> },
    { key: 'duracao', header: 'Duração', align: 'center',
      render: s => <span className="text-surface-300">{s.duracao} min</span> },
    { key: 'ativo',   header: 'Status', align: 'center',
      render: s => <Badge variant={s.ativo ? 'success' : 'muted'} dot>{s.ativo ? 'Ativo' : 'Inativo'}</Badge> },
    { key: 'acoes', header: '', align: 'right',
      render: s => (
        <Button variant="ghost" size="sm" leftIcon={<Pencil className="w-3.5 h-3.5" />} onClick={() => abrir(s)}>
          Editar
        </Button>
      ),
    },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-surface-50 flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-brand-400" /> Serviços
          </h1>
          <p className="text-surface-400 font-body text-sm mt-0.5">{data?.length ?? 0} serviços cadastrados</p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => abrir()}>
          Novo serviço
        </Button>
      </div>

      <Table columns={columns} data={data ?? []} loading={isLoading} rowKey={s => s.id}
        emptyMessage="Nenhum serviço cadastrado." emptyIcon={<PackageCheck className="w-8 h-8" />} />

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, servico: null })}
        title={modal.servico ? 'Editar serviço' : 'Novo serviço'} size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="md" onClick={() => setModal({ open: false, servico: null })}>Cancelar</Button>
            <Button variant="primary" size="md" loading={isSubmitting} form="form-servico" type="submit">Salvar</Button>
          </div>
        }
      >
        <form id="form-servico" onSubmit={handleSubmit(d => salvar(d))} className="flex flex-col gap-4">
          <Input label="Nome" error={errors.nome?.message} {...register('nome')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Preço (R$)" type="number" step="0.01" error={errors.preco?.message} {...register('preco')} />
            <Input label="Duração (min)" type="number" error={errors.duracao?.message} {...register('duracao')} />
          </div>
          <Input label="Descrição" hint="Opcional" {...register('descricao')} />
          {modal.servico && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-brand-500 w-4 h-4" {...register('ativo')} />
              <span className="text-sm font-body text-surface-300">Serviço ativo</span>
            </label>
          )}
        </form>
      </Modal>
    </motion.div>
  )
}