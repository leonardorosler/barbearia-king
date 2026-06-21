import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Plus, Pencil, Scissors } from 'lucide-react'
import { api } from '@/services/api'
import { Button, Table, Modal, Input, Badge, TableColumn } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import type { Barbeiro } from '@/types'

const schemaCriar = z.object({
  nome: z.string().min(2, 'Nome obrigatorio'),
  email: z.string().email('E-mail invalido'),
  senha: z.string().min(6, 'Minimo 6 caracteres'),
  foto: z.string().url('URL invalida').optional().or(z.literal('')),
  bio: z.string().max(500, 'Bio muito longa.').optional(),
})

const schemaEditar = z.object({
  nome: z.string().min(2, 'Nome obrigatorio'),
  foto: z.string().url('URL invalida').optional().or(z.literal('')),
  bio: z.string().max(500, 'Bio muito longa.').optional(),
  ativo: z.boolean().optional(),
})

type FormCriar = z.infer<typeof schemaCriar>
type FormEditar = z.infer<typeof schemaEditar>

function barbeiroEstaAtivo(barbeiro: Barbeiro) {
  return barbeiro.usuario.ativo ?? barbeiro.ativo ?? true
}

export default function AdminBarbeiros() {
  const qc = useQueryClient()
  const { success, error } = useToast()
  const [modal, setModal] = useState<{ open: boolean; barbeiro: Barbeiro | null }>({ open: false, barbeiro: null })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-barbeiros'],
    queryFn: () => api.get<Barbeiro[]>('/barbeiros').then(r => r.data),
  })

  const { register: regC, handleSubmit: hsC, reset: resetC, formState: { errors: errC, isSubmitting: subC } } =
    useForm<FormCriar>({ resolver: zodResolver(schemaCriar) })

  const { register: regE, handleSubmit: hsE, reset: resetE, formState: { errors: errE, isSubmitting: subE } } =
    useForm<FormEditar>({ resolver: zodResolver(schemaEditar) })

  const abrir = (barbeiro?: Barbeiro) => {
    if (barbeiro) {
      resetE({
        nome: barbeiro.usuario.nome,
        foto: barbeiro.foto ?? '',
        bio: barbeiro.bio ?? '',
        ativo: barbeiroEstaAtivo(barbeiro),
      })
    } else {
      resetC({ nome: '', email: '', senha: '', foto: '', bio: '' })
    }
    setModal({ open: true, barbeiro: barbeiro ?? null })
  }

  const { mutate: criar } = useMutation({
    mutationFn: (d: FormCriar) => api.post('/barbeiros', {
      nome: d.nome,
      email: d.email,
      senha: d.senha,
      foto: d.foto || undefined,
      bio: d.bio?.trim() || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-barbeiros'] })
      success('Barbeiro criado.')
      setModal({ open: false, barbeiro: null })
    },
    onError: () => error('Erro', 'Nao foi possivel criar o barbeiro.'),
  })

  const { mutate: editar } = useMutation({
    mutationFn: (d: FormEditar) => api.patch(`/barbeiros/${modal.barbeiro!.id}`, {
      nome: d.nome,
      foto: d.foto || undefined,
      bio: d.bio?.trim() || undefined,
      ativo: d.ativo,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-barbeiros'] })
      success('Barbeiro atualizado.')
      setModal({ open: false, barbeiro: null })
    },
    onError: () => error('Erro', 'Nao foi possivel atualizar.'),
  })

  const columns: TableColumn<Barbeiro>[] = [
    {
      key: 'nome',
      header: 'Barbeiro',
      render: (b: Barbeiro) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-surface-800 overflow-hidden shrink-0">
            {b.foto ? (
              <img src={b.foto} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-xs font-bold text-brand-400">{b.usuario.nome.charAt(0)}</span>
              </div>
            )}
          </div>
          <div>
            <p className="font-medium text-surface-100">{b.usuario.nome}</p>
            <p className="text-xs text-surface-500">{b.usuario.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'bio',
      header: 'Bio',
      render: (b: Barbeiro) => b.bio
        ? <span className="text-surface-300 text-sm line-clamp-1">{b.bio}</span>
        : <span className="text-surface-600 text-sm">-</span>,
    },
    {
      key: 'ativo',
      header: 'Status',
      align: 'center',
      render: (b: Barbeiro) => {
        const ativo = barbeiroEstaAtivo(b)
        return <Badge variant={ativo ? 'success' : 'muted'} dot>{ativo ? 'Ativo' : 'Inativo'}</Badge>
      },
    },
    {
      key: 'acoes',
      header: '',
      align: 'right',
      render: (b: Barbeiro) => (
        <Button variant="ghost" size="sm" leftIcon={<Pencil className="w-3.5 h-3.5" />} onClick={() => abrir(b)}>
          Editar
        </Button>
      ),
    },
  ]

  const isEditing = !!modal.barbeiro

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-surface-50 flex items-center gap-2">
            <Scissors className="w-5 h-5 text-brand-400" /> Barbeiros
          </h1>
          <p className="text-surface-400 font-body text-sm mt-0.5">{data?.length ?? 0} barbeiros cadastrados</p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => abrir()}>
          Novo barbeiro
        </Button>
      </div>

      <Table columns={columns} data={data ?? []} loading={isLoading} rowKey={b => b.id}
        emptyMessage="Nenhum barbeiro cadastrado." emptyIcon={<Scissors className="w-8 h-8" />} />

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, barbeiro: null })}
        title={isEditing ? 'Editar barbeiro' : 'Novo barbeiro'} size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="md" onClick={() => setModal({ open: false, barbeiro: null })}>Cancelar</Button>
            <Button variant="primary" size="md" loading={isEditing ? subE : subC} form="form-barbeiro" type="submit">Salvar</Button>
          </div>
        }
      >
        {isEditing ? (
          <form id="form-barbeiro" onSubmit={hsE(d => editar(d))} className="flex flex-col gap-4">
            <Input label="Nome completo" error={errE.nome?.message} {...regE('nome')} />
            <Input label="URL da foto" hint="Opcional" error={errE.foto?.message} {...regE('foto')} />
            <Input label="Bio" hint="Opcional" error={errE.bio?.message} {...regE('bio')} />
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-brand-500 w-4 h-4" {...regE('ativo')} />
              <span className="text-sm font-body text-surface-300">Barbeiro ativo</span>
            </label>
          </form>
        ) : (
          <form id="form-barbeiro" onSubmit={hsC(d => criar(d))} className="flex flex-col gap-4">
            <Input label="Nome completo" error={errC.nome?.message} {...regC('nome')} />
            <Input label="E-mail" type="email" error={errC.email?.message} {...regC('email')} />
            <Input label="Senha" type="password" error={errC.senha?.message} {...regC('senha')} />
            <Input label="URL da foto" hint="Opcional" error={errC.foto?.message} {...regC('foto')} />
            <Input label="Bio" hint="Opcional" error={errC.bio?.message} {...regC('bio')} />
          </form>
        )}
      </Modal>
    </motion.div>
  )
}
