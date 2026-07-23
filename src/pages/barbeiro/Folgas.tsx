import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  CalendarClock,
  CalendarOff,
  Clock,
  Lock,
  Plus,
  ShieldOff,
  Trash2,
  UmbrellaOff,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { api } from '@/services/api'
import { Button, Modal, Input, Card, CardBody, CardHeader, SkeletonCard } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import type { Barbeiro, Folga, Bloqueio } from '@/types'

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.08 } }),
}

function parseDateOnly(iso: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso)
    ? new Date(`${iso}T12:00:00`)
    : new Date(iso)
}

function formatData(iso: string) {
  const data = parseDateOnly(iso)
  if (Number.isNaN(data.getTime())) return 'Data inválida'

  return data.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

function formatDataLonga(iso: string) {
  const data = parseDateOnly(iso)
  if (Number.isNaN(data.getTime())) return 'Data inválida'

  return data.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  })
}

function formatDT(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function dateKey(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const schemaFolga = z.object({
  data:   z.string().min(1, 'Data obrigatória'),
  motivo: z.string().optional(),
})

const schemaBloqueio = z.object({
  inicio: z.string().min(1, 'Início obrigatório'),
  fim:    z.string().min(1, 'Fim obrigatório'),
  motivo: z.string().optional(),
}).refine((d) => d.inicio < d.fim, {
  message: 'Fim deve ser depois do início.',
  path: ['fim'],
})

type FormFolga    = z.infer<typeof schemaFolga>
type FormBloqueio = z.infer<typeof schemaBloqueio>

interface SummaryCardProps {
  label: string
  value: string | number
  helper: string
  icon: LucideIcon
  tone: string
}

function SummaryCard({ label, value, helper, icon: Icon, tone }: SummaryCardProps) {
  return (
    <div className="min-w-0 rounded-xl border border-surface-800 bg-surface-900 p-4 shadow-card">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-body font-semibold uppercase tracking-wider text-surface-500">{label}</p>
          <p className="mt-2 text-3xl font-display font-black leading-none text-surface-50">{value}</p>
          <p className="mt-2 text-xs font-body leading-relaxed text-surface-500">{helper}</p>
        </div>
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border', tone)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

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

  const { data: folgas, isLoading: lfF } = useQuery({
    queryKey: ['barbeiro-folgas', barbeiroId],
    enabled: !!barbeiroId,
    queryFn:  () => api.get<Folga[]>(`/folgas/${barbeiroId}`).then(r => r.data),
  })

  const { data: bloqueios, isLoading: lfB } = useQuery({
    queryKey: ['barbeiro-bloqueios', barbeiroId],
    enabled: !!barbeiroId,
    queryFn:  () => api.get<Bloqueio[]>(`/bloqueios/${barbeiroId}`).then(r => r.data),
  })

  const { register: rF, handleSubmit: hsF, reset: resetF, formState: { errors: eF } } =
    useForm<FormFolga>({ resolver: zodResolver(schemaFolga) })

  const { register: rB, handleSubmit: hsB, reset: resetB, formState: { errors: eB } } =
    useForm<FormBloqueio>({ resolver: zodResolver(schemaBloqueio) })

  const { mutate: criarFolga, isPending: criandoFolga } = useMutation({
    mutationFn: (d: FormFolga) => {
      if (!barbeiroId) throw new Error('Barbeiro não identificado.')
      return api.post(`/folgas/${barbeiroId}`, d)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['barbeiro-folgas', barbeiroId] })
      success('Folga registrada.')
      resetF({ data: '', motivo: '' })
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

  const { mutate: criarBloqueio, isPending: criandoBloqueio } = useMutation({
    mutationFn: (d: FormBloqueio) => {
      if (!barbeiroId) throw new Error('Barbeiro não identificado.')
      return api.post(`/bloqueios/${barbeiroId}`, d)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['barbeiro-bloqueios', barbeiroId] })
      success('Bloqueio criado.')
      resetB({ inicio: '', fim: '', motivo: '' })
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

  const hoje = dateKey(new Date())
  const folgasOrdenadas = [...(folgas ?? [])].sort((a, b) => a.data.localeCompare(b.data))
  const bloqueiosOrdenados = [...(bloqueios ?? [])].sort((a, b) => a.inicio.localeCompare(b.inicio))
  const proximasFolgas = folgasOrdenadas.filter(f => f.data.slice(0, 10) >= hoje)
  const proximaFolga = proximasFolgas[0]
  const bloqueioAtual = bloqueiosOrdenados.find(b => {
    const agora = new Date()
    return new Date(b.inicio) <= agora && new Date(b.fim) >= agora
  })

  return (
    <motion.div initial="hidden" animate="visible" className="mx-auto flex w-full max-w-[1400px] flex-col gap-5 lg:gap-6">
      <motion.div
        variants={fadeUp}
        custom={0}
        className="relative min-w-0 overflow-hidden rounded-xl border border-surface-800 bg-surface-900 p-4 shadow-card lg:p-5"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-400/60 to-transparent" />
        <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <p className="mb-2 inline-flex items-center gap-2 rounded-md border border-brand-500/20 bg-brand-500/10 px-2.5 py-1 text-xs font-body font-semibold uppercase tracking-wider text-brand-300">
              <ShieldOff className="h-3.5 w-3.5" />
              Controle de ausência
            </p>
            <h1 className="text-2xl font-display font-bold text-surface-50 sm:text-3xl">
              Folgas e Bloqueios
            </h1>
            <p className="mt-1 max-w-2xl text-sm font-body leading-relaxed text-surface-400">
              Gerencie dias sem atendimento e bloqueios pontuais para manter a agenda do cliente sempre correta.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => { resetF({ data: '', motivo: '' }); setModalFolga(true) }}
              disabled={!barbeiroId}
            >
              Folga
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Lock className="h-3.5 w-3.5" />}
              onClick={() => { resetB({ inicio: '', fim: '', motivo: '' }); setModalBloqueio(true) }}
              disabled={!barbeiroId}
            >
              Bloqueio
            </Button>
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} custom={1} className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Folgas"
          value={(folgas ?? []).length}
          helper="Dias inteiros sem atendimento"
          icon={UmbrellaOff}
          tone="border-brand-500/25 bg-brand-500/10 text-brand-300"
        />
        <SummaryCard
          label="Bloqueios"
          value={(bloqueios ?? []).length}
          helper="Períodos específicos indisponíveis"
          icon={Lock}
          tone="border-blue-500/20 bg-blue-500/10 text-blue-400"
        />
        <SummaryCard
          label="Próxima folga"
          value={proximaFolga ? formatData(proximaFolga.data) : '-'}
          helper={proximaFolga ? formatDataLonga(proximaFolga.data) : 'Nenhuma folga futura'}
          icon={CalendarOff}
          tone="border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
        />
        <SummaryCard
          label="Agora"
          value={bloqueioAtual ? 'Bloqueado' : 'Livre'}
          helper={bloqueioAtual ? `${formatHora(bloqueioAtual.inicio)} até ${formatHora(bloqueioAtual.fim)}` : 'Sem bloqueio em andamento'}
          icon={Clock}
          tone={bloqueioAtual ? 'border-red-500/20 bg-red-500/10 text-red-400' : 'border-green-500/20 bg-green-500/10 text-green-400'}
        />
      </motion.div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <motion.div variants={fadeUp} custom={2} className="min-w-0">
          <Card className="min-w-0 overflow-hidden">
            <CardHeader className="flex flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-body font-semibold text-surface-100">
                  <UmbrellaOff className="h-4 w-4 shrink-0 text-brand-400" />
                  <span>Folgas de dia inteiro</span>
                </p>
                <p className="mt-0.5 text-xs font-body text-surface-500">Use para dias em que não haverá atendimento.</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Plus className="h-3.5 w-3.5" />}
                onClick={() => { resetF({ data: '', motivo: '' }); setModalFolga(true) }}
                disabled={!barbeiroId}
              >
                Adicionar
              </Button>
            </CardHeader>

            <CardBody className="p-4 sm:p-5">
              {lb || lfF ? (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} lines={1} />)}
                </div>
              ) : !barbeiroId ? (
                <EmptyState
                  icon={AlertCircle}
                  title="Cadastro de barbeiro não encontrado."
                  description="Não encontramos o cadastro de barbeiro desta conta."
                  tone="warning"
                />
              ) : folgasOrdenadas.length === 0 ? (
                <EmptyState
                  icon={UmbrellaOff}
                  title="Nenhuma folga registrada."
                  description="Adicione uma folga para bloquear um dia inteiro na agenda."
                />
              ) : (
                <div className="flex min-w-0 flex-col gap-3">
                  {folgasOrdenadas.map(f => (
                    <div key={f.id} className="group flex min-w-0 items-center gap-3 rounded-xl border border-surface-800 bg-surface-950/40 p-3 transition-all hover:border-brand-500/25 hover:bg-surface-900 sm:p-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-brand-500/20 bg-brand-500/10">
                        <CalendarOff className="h-5 w-5 text-brand-300" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-body font-semibold text-surface-100">{formatDataLonga(f.data)}</p>
                        <p className="mt-0.5 truncate text-xs font-body text-surface-500">{f.motivo || 'Sem motivo informado'}</p>
                      </div>
                      <button
                        onClick={() => deletarFolga(f.id)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-surface-800 text-surface-500 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                        aria-label="Remover folga"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} custom={3} className="min-w-0">
          <Card className="min-w-0 overflow-hidden">
            <CardHeader className="flex flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-body font-semibold text-surface-100">
                  <Lock className="h-4 w-4 shrink-0 text-brand-400" />
                  <span>Bloqueios de horário</span>
                </p>
                <p className="mt-0.5 text-xs font-body text-surface-500">Use para reuniões, compromissos e indisponibilidades pontuais.</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Plus className="h-3.5 w-3.5" />}
                onClick={() => { resetB({ inicio: '', fim: '', motivo: '' }); setModalBloqueio(true) }}
                disabled={!barbeiroId}
              >
                Adicionar
              </Button>
            </CardHeader>

            <CardBody className="p-4 sm:p-5">
              {lb || lfB ? (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} lines={1} />)}
                </div>
              ) : !barbeiroId ? (
                <EmptyState
                  icon={AlertCircle}
                  title="Cadastro de barbeiro não encontrado."
                  description="Não encontramos o cadastro de barbeiro desta conta."
                  tone="warning"
                />
              ) : bloqueiosOrdenados.length === 0 ? (
                <EmptyState
                  icon={Lock}
                  title="Nenhum bloqueio registrado."
                  description="Adicione um bloqueio para ocultar horários específicos da agenda."
                />
              ) : (
                <div className="flex min-w-0 flex-col gap-3">
                  {bloqueiosOrdenados.map(b => (
                    <div key={b.id} className="group flex min-w-0 items-center gap-3 rounded-xl border border-surface-800 bg-surface-950/40 p-3 transition-all hover:border-brand-500/25 hover:bg-surface-900 sm:p-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10">
                        <CalendarClock className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-body font-semibold text-surface-100">
                          {formatDT(b.inicio)} até {formatDT(b.fim)}
                        </p>
                        <p className="mt-0.5 truncate text-xs font-body text-surface-500">{b.motivo || 'Sem motivo informado'}</p>
                      </div>
                      <button
                        onClick={() => deletarBloqueio(b.id)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-surface-800 text-surface-500 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                        aria-label="Remover bloqueio"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </motion.div>
      </div>

      <Modal isOpen={modalFolga} onClose={() => setModalFolga(false)} title="Registrar folga" size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="md" onClick={() => setModalFolga(false)}>Cancelar</Button>
            <Button variant="primary" size="md" loading={criandoFolga} form="form-folga" type="submit" disabled={!barbeiroId}>Salvar</Button>
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

      <Modal isOpen={modalBloqueio} onClose={() => setModalBloqueio(false)} title="Bloquear horário" size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="md" onClick={() => setModalBloqueio(false)}>Cancelar</Button>
            <Button variant="primary" size="md" loading={criandoBloqueio} form="form-bloqueio" type="submit" disabled={!barbeiroId}>Salvar</Button>
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

function EmptyState({
  icon: Icon,
  title,
  description,
  tone = 'muted',
}: {
  icon: LucideIcon
  title: string
  description: string
  tone?: 'muted' | 'warning'
}) {
  return (
    <div className={cn(
      'rounded-xl border border-dashed px-4 py-12 text-center',
      tone === 'warning' ? 'border-amber-500/20 bg-amber-500/5' : 'border-surface-800 bg-surface-950/40',
    )}>
      <Icon className={cn('mx-auto mb-3 h-10 w-10', tone === 'warning' ? 'text-amber-300' : 'text-surface-700')} />
      <p className={cn('text-sm font-body font-semibold', tone === 'warning' ? 'text-amber-100' : 'text-surface-300')}>
        {title}
      </p>
      <p className={cn('mx-auto mt-1 max-w-sm text-xs font-body leading-relaxed', tone === 'warning' ? 'text-amber-200/80' : 'text-surface-500')}>
        {description}
      </p>
    </div>
  )
}
