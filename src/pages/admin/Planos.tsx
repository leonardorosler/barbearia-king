import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Plus, Pencil, CreditCard, Trash2 } from 'lucide-react'
import { api } from '@/services/api'
import { Button, Table, Modal, Input, Badge, TableColumn } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import type { Plano, Servico } from '@/types'

const schema = z.object({
  nome:      z.string().min(2, 'Nome obrigatório'),
  preco:     z.coerce.number().positive('Preço deve ser positivo'),
  descricao: z.string().optional(),
  ativo:     z.boolean().optional(),
  servicos:  z.array(z.object({
    servicoId:  z.string().min(1, 'Selecione um serviço'),
    quantidade: z.coerce.number().int().min(1, 'Mínimo 1'),
  })).min(1, 'Adicione ao menos um serviço'),
})
type FormData = z.infer<typeof schema>

export default function AdminPlanos() {
  const qc = useQueryClient()
  const { success, error } = useToast()
  const [modal, setModal] = useState<{ open: boolean; plano: Plano | null }>({ open: false, plano: null })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-planos'],
    queryFn:  () => api.get<Plano[]>('/planos').then(r => r.data),
  })

  const { data: servicos } = useQuery({
    queryKey: ['servicos-select'],
    queryFn:  () => api.get<Servico[]>('/servicos').then(r => r.data.filter(s => s.ativo)),
  })

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) as Resolver<FormData>, defaultValues: { servicos: [{ servicoId: '', quantidade: 1 }] } })

  const { fields, append, remove } = useFieldArray({ control, name: 'servicos' })

  const abrir = (plano?: Plano) => {
    reset(plano ? {
      nome: plano.nome, preco: Number(plano.preco),
      descricao: plano.descricao ?? '', ativo: plano.ativo,
      servicos: plano.planosServicos.map(ps => ({ servicoId: ps.servico.id, quantidade: ps.quantidade })),
    } : { nome: '', preco: 0, descricao: '', ativo: true, servicos: [{ servicoId: '', quantidade: 1 }] })
    setModal({ open: true, plano: plano ?? null })
  }

  const { mutate: salvar } = useMutation({
    mutationFn: (d: FormData) => modal.plano
      ? api.patch(`/planos/${modal.plano.id}`, d)
      : api.post('/planos', d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-planos'] })
      success(modal.plano ? 'Plano atualizado.' : 'Plano criado.')
      setModal({ open: false, plano: null })
    },
    onError: () => error('Erro', 'Não foi possível salvar o plano.'),
  })

  const columns: TableColumn<Plano>[] = [
    { key: 'nome', header: 'Plano',
      render: p => <div>
        <p className="font-medium text-surface-100">{p.nome}</p>
        <p className="text-xs text-surface-500">{p.planosServicos.length} serviço(s)</p>
      </div>,
    },
    { key: 'preco', header: 'Preço/mês', align: 'center',
      render: p => <span className="text-brand-400 font-medium">R$ {Number(p.preco).toFixed(2).replace('.', ',')}</span>,
    },
    { key: 'ativo', header: 'Status', align: 'center',
      render: p => <Badge variant={p.ativo ? 'success' : 'muted'} dot>{p.ativo ? 'Ativo' : 'Inativo'}</Badge>,
    },
    { key: 'acoes', header: '', align: 'right',
      render: p => <Button variant="ghost" size="sm" leftIcon={<Pencil className="w-3.5 h-3.5" />} onClick={() => abrir(p)}>Editar</Button>,
    },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-surface-50 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-brand-400" /> Planos
          </h1>
          <p className="text-surface-400 font-body text-sm mt-0.5">{data?.length ?? 0} planos cadastrados</p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => abrir()}>Novo plano</Button>
      </div>

      <Table columns={columns} data={data ?? []} loading={isLoading} rowKey={p => p.id}
        emptyMessage="Nenhum plano cadastrado." emptyIcon={<CreditCard className="w-8 h-8" />} />

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, plano: null })}
        title={modal.plano ? 'Editar plano' : 'Novo plano'} size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="md" onClick={() => setModal({ open: false, plano: null })}>Cancelar</Button>
            <Button variant="primary" size="md" loading={isSubmitting} form="form-plano" type="submit">Salvar</Button>
          </div>
        }
      >
        <form id="form-plano" onSubmit={handleSubmit(d => salvar(d))} className="flex flex-col gap-4">
          <Input label="Nome do plano" error={errors.nome?.message} {...register('nome')} />
          <Input label="Preço mensal (R$)" type="number" step="0.01" error={errors.preco?.message} {...register('preco')} />
          <Input label="Descrição" hint="Opcional" {...register('descricao')} />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium font-body text-surface-200">Serviços inclusos</label>
              <Button type="button" variant="ghost" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => append({ servicoId: '', quantidade: 1 })}>
                Adicionar
              </Button>
            </div>
            {errors.servicos?.root && (
              <p className="text-xs text-red-400 mb-2">{errors.servicos.root.message}</p>
            )}
            <div className="flex flex-col gap-2">
              {fields.map((field, i) => (
                <div key={field.id} className="flex items-start gap-2">
                  <div className="flex-1">
                    <select
                      {...register(`servicos.${i}.servicoId`)}
                      className="w-full h-10 px-3 rounded-md border bg-surface-900 border-surface-700 text-surface-100 font-body text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    >
                      <option value="">Selecione...</option>
                      {(servicos ?? []).map(s => (
                        <option key={s.id} value={s.id}>{s.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <Input type="number" placeholder="Qtd" {...register(`servicos.${i}.quantidade`)} />
                  </div>
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(i)}
                      className="mt-1 p-2 text-surface-500 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {modal.plano && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-brand-500 w-4 h-4" {...register('ativo')} />
              <span className="text-sm font-body text-surface-300">Plano ativo</span>
            </label>
          )}
        </form>
      </Modal>
    </motion.div>
  )
}