import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { UmbrellaOff, Plus, Trash2, Lock } from 'lucide-react'
import { api } from '@/services/api'
import { Button, Modal, Input, Card, CardBody } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/contexts/AuthContext'
import type { Barbeiro, Folga, Bloqueio } from '@/types'

function formatData(iso: string) {
  const data = /^\d{4}-\d{2}-\d{2}$/.test(iso)
    ? new Date(`${iso}T12:00:00`)
    : new Date(iso)

  if (Number.isNaN(data.getTime())) return 'Data inválida'

  return data.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}
function formatDT(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const schemaFolga = z.object({
  data:   z.string().min(1, 'Data obrigatória'),
  motivo: z.string().optional(),
})
const schemaBloqueio = z.object({
  inicio: z.string().min(1, 'Início obrigatório'),
  fim:    z.string().min(1, 'Fim obrigatório'),
  motivo: z.string().optional(),
})

type FormFolga    = z.infer<typeof schemaFolga>
type FormBloqueio = z.infer<typeof schemaBloqueio>

export default function BarbeiroFolgas() {
  const { usuario } = useAuth()
  const qc = useQueryClient()
  const { success, error } = useToast()
  const [modalFolga, setModalFolga]       = useState(false)
  const [modalBloqueio, setModalBloqueio] = useState(false)

  const { data: barbeiros, isLoading: lb } = useQuery({
    queryKey: ['barbeiro-folgas-barbeiros', usuario?.id],
    enabled: !!usuario,
    queryFn:  () => api.get<Barbeiro[]>('/barbeiros').then(r => r.data),
  })

  const barbeiroId = barbeiros?.find(b =>
    b.usuario.id === usuario?.id || b.usuario.email === usuario?.email
  )?.id

  const { data: folgas,   isLoading: lfF } = useQuery({
    queryKey: ['barbeiro-folgas', barbeiroId],
    enabled: !!barbeiroId,
    queryFn:  () => api.get<Folga[]>(`/folgas/${barbeiroId}`).then(r => r.data),
  })
  const { data: bloqueios, isLoading: lfB } = useQuery({
    queryKey: ['barbeiro-bloqueios', barbeiroId],
    enabled: !!barbeiroId,
    queryFn:  () => api.get<Bloqueio[]>(`/bloqueios/${barbeiroId}`).then(r => r.data),
  })

  const { register: rF, handleSubmit: hsF, reset: resetF, formState: { errors: eF, isSubmitting: sF } } =
    useForm<FormFolga>({ resolver: zodResolver(schemaFolga) })

  const { register: rB, handleSubmit: hsB, reset: resetB, formState: { errors: eB, isSubmitting: sB } } =
    useForm<FormBloqueio>({ resolver: zodResolver(schemaBloqueio) })

  const { mutate: criarFolga } = useMutation({
    mutationFn: (d: FormFolga) => {
      if (!barbeiroId) throw new Error('Barbeiro não identificado.')
      return api.post(`/folgas/${barbeiroId}`, d)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['barbeiro-folgas', barbeiroId] })
      success('Folga registrada.')
      setModalFolga(false)
    },
    onError:   (err) => {
      const mensagem = (err as { response?: { data?: { mensagem?: string } } }).response?.data?.mensagem
        ?? 'Não foi possível registrar a folga.'
      error('Erro', mensagem)
    },
  })

  const { mutate: deletarFolga } = useMutation({
    mutationFn: (id: string) => {
      if (!barbeiroId) throw new Error('Barbeiro não identificado.')
      return api.delete(`/folgas/${barbeiroId}/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['barbeiro-folgas', barbeiroId] })
      success('Folga removida.')
    },
    onError:   (err) => {
      const mensagem = (err as { response?: { data?: { mensagem?: string } } }).response?.data?.mensagem
        ?? 'Não foi possível remover.'
      error('Erro', mensagem)
    },
  })

  const { mutate: criarBloqueio } = useMutation({
    mutationFn: (d: FormBloqueio) => {
      if (!barbeiroId) throw new Error('Barbeiro não identificado.')
      return api.post(`/bloqueios/${barbeiroId}`, d)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['barbeiro-bloqueios', barbeiroId] })
      success('Bloqueio criado.')
      setModalBloqueio(false)
    },
    onError:   (err) => {
      const mensagem = (err as { response?: { data?: { mensagem?: string } } }).response?.data?.mensagem
        ?? 'Não foi possível criar o bloqueio.'
      error('Erro', mensagem)
    },
  })

  const { mutate: deletarBloqueio } = useMutation({
    mutationFn: (id: string) => {
      if (!barbeiroId) throw new Error('Barbeiro não identificado.')
      return api.delete(`/bloqueios/${barbeiroId}/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['barbeiro-bloqueios', barbeiroId] })
      success('Bloqueio removido.')
    },
    onError:   (err) => {
      const mensagem = (err as { response?: { data?: { mensagem?: string } } }).response?.data?.mensagem
        ?? 'Não foi possível remover.'
      error('Erro', mensagem)
    },
  })

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-surface-50 flex items-center gap-2">
          <UmbrellaOff className="w-5 h-5 text-brand-400" /> Folgas e Bloqueios
        </h1>
        <p className="text-surface-400 font-body text-sm mt-0.5">
          Gerencie dias de folga e horários bloqueados.
        </p>
      </div>

      {/* Folgas */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-body font-semibold text-surface-100 flex items-center gap-2">
            <UmbrellaOff className="w-4 h-4 text-brand-400" /> Folgas (dia inteiro)
          </h2>
          <Button variant="outline" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => { resetF({ data: '', motivo: '' }); setModalFolga(true) }}
            disabled={!barbeiroId}>
            Adicionar
          </Button>
        </div>

        <Card>
          <CardBody>
            {lb || lfF ? (
              <p className="text-surface-500 text-sm text-center py-4">Carregando...</p>
            ) : !barbeiroId ? (
              <p className="text-surface-500 text-sm text-center py-4">
                Não encontramos o cadastro de barbeiro desta conta.
              </p>
            ) : (folgas ?? []).length === 0 ? (
              <p className="text-surface-500 text-sm text-center py-4">Nenhuma folga registrada.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {(folgas ?? [])
                  .sort((a, b) => a.data.localeCompare(b.data))
                  .map(f => (
                    <div key={f.id} className="flex items-center justify-between py-2 border-b border-surface-800 last:border-0">
                      <div>
                        <p className="text-sm font-body font-medium text-surface-100">{formatData(f.data)}</p>
                        {f.motivo && <p className="text-xs text-surface-500 mt-0.5">{f.motivo}</p>}
                      </div>
                      <button onClick={() => deletarFolga(f.id)}
                        className="p-1.5 rounded-lg text-surface-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Bloqueios */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-body font-semibold text-surface-100 flex items-center gap-2">
            <Lock className="w-4 h-4 text-brand-400" /> Bloqueios de horário
          </h2>
          <Button variant="outline" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => { resetB({ inicio: '', fim: '', motivo: '' }); setModalBloqueio(true) }}
            disabled={!barbeiroId}>
            Adicionar
          </Button>
        </div>

        <Card>
          <CardBody>
            {lb || lfB ? (
              <p className="text-surface-500 text-sm text-center py-4">Carregando...</p>
            ) : !barbeiroId ? (
              <p className="text-surface-500 text-sm text-center py-4">
                Não encontramos o cadastro de barbeiro desta conta.
              </p>
            ) : (bloqueios ?? []).length === 0 ? (
              <p className="text-surface-500 text-sm text-center py-4">Nenhum bloqueio registrado.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {(bloqueios ?? [])
                  .sort((a, b) => a.inicio.localeCompare(b.inicio))
                  .map(b => (
                    <div key={b.id} className="flex items-center justify-between py-2 border-b border-surface-800 last:border-0">
                      <div>
                        <p className="text-sm font-body font-medium text-surface-100">
                          {formatDT(b.inicio)} → {formatDT(b.fim)}
                        </p>
                        {b.motivo && <p className="text-xs text-surface-500 mt-0.5">{b.motivo}</p>}
                      </div>
                      <button onClick={() => deletarBloqueio(b.id)}
                        className="p-1.5 rounded-lg text-surface-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Modal Folga */}
      <Modal isOpen={modalFolga} onClose={() => setModalFolga(false)} title="Registrar folga" size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="md" onClick={() => setModalFolga(false)}>Cancelar</Button>
            <Button variant="primary" size="md" loading={sF} form="form-folga" type="submit" disabled={!barbeiroId}>Salvar</Button>
          </div>
        }
      >
        <form id="form-folga" onSubmit={hsF(d => criarFolga(d))} className="flex flex-col gap-4">
          <Input label="Data" type="date" error={eF.data?.message}
            min={new Date().toISOString().split('T')[0]}
            className="[color-scheme:dark]" {...rF('data')} />
          <Input label="Motivo" hint="Opcional" {...rF('motivo')} />
        </form>
      </Modal>

      {/* Modal Bloqueio */}
      <Modal isOpen={modalBloqueio} onClose={() => setModalBloqueio(false)} title="Bloquear horário" size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="md" onClick={() => setModalBloqueio(false)}>Cancelar</Button>
            <Button variant="primary" size="md" loading={sB} form="form-bloqueio" type="submit" disabled={!barbeiroId}>Salvar</Button>
          </div>
        }
      >
        <form id="form-bloqueio" onSubmit={hsB(d => criarBloqueio(d))} className="flex flex-col gap-4">
          <Input label="Início" type="datetime-local" error={eB.inicio?.message}
            className="[color-scheme:dark]" {...rB('inicio')} />
          <Input label="Fim" type="datetime-local" error={eB.fim?.message}
            className="[color-scheme:dark]" {...rB('fim')} />
          <Input label="Motivo" hint="Opcional" {...rB('motivo')} />
        </form>
      </Modal>
    </motion.div>
  )
}
