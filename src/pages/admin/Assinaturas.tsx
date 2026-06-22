import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  ClipboardList,
  Clock3,
  CreditCard,
  Mail,
  Search,
  ShieldAlert,
  Users,
  XCircle,
} from 'lucide-react'
import { api } from '@/services/api'
import { BadgeAssinatura, Button, Card, CardBody, SkeletonCard } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'
import type { Assinatura, StatusAssinatura } from '@/types'
import { LABEL_STATUS_ASSINATURA } from '@/types'

const STATUS_OPTIONS: StatusAssinatura[] = ['ATIVA', 'INADIMPLENTE', 'EXPIRADA', 'CANCELADA']
const FILTROS = ['TODAS', 'COBRAR', ...STATUS_OPTIONS] as const

type FiltroAssinatura = typeof FILTROS[number]

const statusCopy: Record<StatusAssinatura, { label: string; helper: string; className: string }> = {
  ATIVA: {
    label: 'Pago',
    helper: 'Cliente liberado para usar o plano.',
    className: 'border-green-500/20 bg-green-500/10 text-green-400',
  },
  INADIMPLENTE: {
    label: 'Preciso cobrar',
    helper: 'Pagamento pendente ou cliente em atraso.',
    className: 'border-yellow-500/20 bg-yellow-500/10 text-yellow-400',
  },
  EXPIRADA: {
    label: 'Expirado',
    helper: 'Plano fora do periodo combinado.',
    className: 'border-surface-700 bg-surface-800 text-surface-400',
  },
  CANCELADA: {
    label: 'Cancelado',
    helper: 'Cliente nao deve usar beneficios.',
    className: 'border-red-500/20 bg-red-500/10 text-red-400',
  },
}

function formatMoeda(valor: string | number) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

function getDiasComoAssinante(iso: string) {
  const inicio = new Date(iso).getTime()
  return Math.max(0, Math.floor((Date.now() - inicio) / 86400000))
}

function getProximaCobranca(iso: string) {
  const inicio = new Date(iso)
  const hoje = new Date()
  const candidato = new Date(hoje.getFullYear(), hoje.getMonth(), inicio.getDate())

  if (candidato < hoje) {
    candidato.setMonth(candidato.getMonth() + 1)
  }

  return candidato.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function getInitials(nome: string) {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('')
}

export default function AdminAssinaturas() {
  const qc = useQueryClient()
  const { success, error } = useToast()
  const [filtro, setFiltro] = useState<FiltroAssinatura>('TODAS')
  const [busca, setBusca] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-assinaturas'],
    queryFn:  () => api.get<Assinatura[]>('/assinaturas').then(r => r.data),
  })

  const { mutate: atualizarStatus, isPending } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: StatusAssinatura }) =>
      api.patch(`/assinaturas/${id}/status`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-assinaturas'] }); success('Status atualizado.') },
    onError:   () => error('Erro', 'Nao foi possivel atualizar o status.'),
  })

  const assinaturas = data ?? []
  const termo = busca.trim().toLowerCase()

  const resumo = useMemo(() => {
    const ativas = assinaturas.filter(a => a.status === 'ATIVA')
    const cobrar = assinaturas.filter(a => a.status === 'INADIMPLENTE')
    const bloqueadas = assinaturas.filter(a => ['INADIMPLENTE', 'EXPIRADA'].includes(a.status))
    const receitaAtiva = ativas.reduce((total, a) => total + Number(a.plano.preco), 0)
    const valorEmRisco = cobrar.reduce((total, a) => total + Number(a.plano.preco), 0)

    return {
      ativas: ativas.length,
      cobrar: cobrar.length,
      bloqueadas: bloqueadas.length,
      receitaAtiva,
      valorEmRisco,
    }
  }, [assinaturas])

  const lista = assinaturas.filter(a => {
    const bateFiltro =
      filtro === 'TODAS' ||
      (filtro === 'COBRAR' && a.status === 'INADIMPLENTE') ||
      a.status === filtro

    const bateBusca =
      !termo ||
      a.cliente.usuario.nome.toLowerCase().includes(termo) ||
      a.cliente.usuario.email.toLowerCase().includes(termo) ||
      a.plano.nome.toLowerCase().includes(termo)

    return bateFiltro && bateBusca
  })

  const filaCobranca = assinaturas
    .filter(a => a.status === 'INADIMPLENTE')
    .sort((a, b) => new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime())
    .slice(0, 4)

  function mudarStatus(assinatura: Assinatura, status: StatusAssinatura) {
    if (assinatura.status === status) return
    atualizarStatus({ id: assinatura.id, status })
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="mb-2 inline-flex items-center gap-2 rounded-md border border-brand-500/20 bg-brand-500/10 px-2.5 py-1 text-xs font-body font-semibold uppercase tracking-wider text-brand-300">
            <ClipboardList className="h-3.5 w-3.5" />
            Gestao de assinantes
          </p>
          <h1 className="text-2xl font-display font-bold text-surface-50 sm:text-3xl">Assinaturas</h1>
          <p className="mt-1 max-w-2xl text-sm font-body text-surface-400">
            Controle quem esta pago, quem precisa ser cobrado e quais clientes devem ter o plano bloqueado.
          </p>
        </div>

        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-500" />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar cliente, email ou plano"
            className="h-10 w-full rounded-lg border border-surface-800 bg-surface-900 pl-10 pr-3 text-sm font-body text-surface-100 placeholder:text-surface-600 focus:border-brand-500/50 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={2} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={Banknote} label="Receita ativa" value={formatMoeda(resumo.receitaAtiva)} helper={`${resumo.ativas} assinante(s) pagando`} tone="brand" />
          <MetricCard icon={AlertTriangle} label="A cobrar" value={formatMoeda(resumo.valorEmRisco)} helper={`${resumo.cobrar} cliente(s) inadimplente(s)`} tone="amber" />
          <MetricCard icon={Users} label="Assinantes ativos" value={resumo.ativas} helper={`${assinaturas.length} no total`} tone="green" />
          <MetricCard icon={ShieldAlert} label="Planos bloqueaveis" value={resumo.bloqueadas} helper="Inadimplentes ou expirados" tone="red" />
        </div>
      )}

      {filaCobranca.length > 0 && (
        <Card className="min-w-0 overflow-hidden border-yellow-500/20 bg-yellow-500/[0.04]">
          <CardBody className="p-4 sm:p-5">
            <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-body font-semibold text-yellow-300">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  Fila de cobranca
                </p>
                <p className="mt-1 text-sm font-body text-surface-400">
                  Priorize esses assinantes para recuperar receita e evitar uso indevido do plano.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setFiltro('COBRAR')}>
                Ver inadimplentes
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {filaCobranca.map(assinatura => (
                <div key={assinatura.id} className="min-w-0 rounded-lg border border-yellow-500/20 bg-surface-950/60 p-3">
                  <p className="truncate text-sm font-body font-semibold text-surface-100">{assinatura.cliente.usuario.nome}</p>
                  <p className="mt-0.5 truncate text-xs font-body text-surface-500">{formatMoeda(assinatura.plano.preco)} em aberto</p>
                  <div className="mt-3 flex gap-2">
                    <a
                      href={`mailto:${assinatura.cliente.usuario.email}?subject=Cobranca%20da%20assinatura%20${encodeURIComponent(assinatura.plano.nome)}`}
                      className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded border border-surface-700 bg-surface-900 px-2 text-xs font-body font-medium text-surface-200 transition hover:bg-surface-800"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      Cobrar
                    </a>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => mudarStatus(assinatura, 'ATIVA')}
                      className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded bg-green-600 px-2 text-xs font-body font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Pago
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      <div className="flex min-w-0 gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
        {FILTROS.map(item => (
          <button
            key={item}
            type="button"
            onClick={() => setFiltro(item)}
            className={cn(
              'shrink-0 rounded-lg border px-3 py-1.5 text-xs font-body font-medium transition-all',
              filtro === item
                ? 'border-brand-500/30 bg-brand-500/15 text-brand-400'
                : 'border-surface-800 bg-surface-900 text-surface-400 hover:border-surface-700',
            )}
          >
            {item === 'TODAS' ? 'Todas' : item === 'COBRAR' ? 'Preciso cobrar' : LABEL_STATUS_ASSINATURA[item]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} hasAvatar lines={3} />)}
        </div>
      ) : lista.length === 0 ? (
        <div className="rounded-xl border border-dashed border-surface-800 bg-surface-900 px-4 py-12 text-center">
          <ClipboardList className="mx-auto mb-3 h-9 w-9 text-surface-700" />
          <p className="text-sm font-body text-surface-400">Nenhuma assinatura encontrada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {lista.map(assinatura => (
            <SubscriberCard
              key={assinatura.id}
              assinatura={assinatura}
              disabled={isPending}
              onStatusChange={status => mudarStatus(assinatura, status)}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}

interface MetricCardProps {
  icon: typeof Banknote
  label: string
  value: string | number
  helper: string
  tone: 'brand' | 'green' | 'amber' | 'red'
}

const metricTone = {
  brand: 'border-brand-500/20 bg-brand-500/10 text-brand-400',
  green: 'border-green-500/20 bg-green-500/10 text-green-400',
  amber: 'border-yellow-500/20 bg-yellow-500/10 text-yellow-400',
  red: 'border-red-500/20 bg-red-500/10 text-red-400',
}

function MetricCard({ icon: Icon, label, value, helper, tone }: MetricCardProps) {
  return (
    <div className="min-w-0 rounded-xl border border-surface-800 bg-surface-900 p-4 shadow-card">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-body font-semibold uppercase tracking-wider text-surface-500">{label}</p>
          <p className="mt-2 truncate text-2xl font-display font-black text-surface-50">{value}</p>
          <p className="mt-1 truncate text-xs font-body text-surface-500">{helper}</p>
        </div>
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border', metricTone[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

interface SubscriberCardProps {
  assinatura: Assinatura
  disabled: boolean
  onStatusChange: (status: StatusAssinatura) => void
}

function SubscriberCard({ assinatura, disabled, onStatusChange }: SubscriberCardProps) {
  const status = statusCopy[assinatura.status]
  const nome = assinatura.cliente.usuario.nome
  const email = assinatura.cliente.usuario.email

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-surface-800 bg-surface-900 shadow-card">
      <div className="flex min-w-0 flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
        <div className="flex min-w-0 gap-3">
          <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-full border font-display text-sm font-bold', status.className)}>
            {getInitials(nome)}
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
              <p className="truncate text-base font-body font-semibold text-surface-100">{nome}</p>
              <BadgeAssinatura status={assinatura.status} className="w-fit" />
            </div>
            <p className="mt-1 truncate text-sm font-body text-surface-500">{email}</p>
            <p className="mt-2 text-xs font-body text-surface-400">{status.helper}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:w-48">
          <InfoPill icon={CreditCard} label="Plano" value={assinatura.plano.nome} />
          <InfoPill icon={Banknote} label="Mensal" value={formatMoeda(assinatura.plano.preco)} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 border-y border-surface-800 bg-surface-950/40 p-4 sm:grid-cols-3 sm:px-5">
        <InfoPill icon={Clock3} label="Desde" value={formatData(assinatura.criadoEm)} />
        <InfoPill icon={Users} label="Relacionamento" value={`${getDiasComoAssinante(assinatura.criadoEm)} dias`} />
        <InfoPill icon={CreditCard} label="Prox. cobranca" value={getProximaCobranca(assinatura.criadoEm)} />
      </div>

      <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4 sm:p-5">
        <Button
          variant={assinatura.status === 'ATIVA' ? 'primary' : 'secondary'}
          size="sm"
          disabled={disabled || assinatura.status === 'ATIVA'}
          leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
          onClick={() => onStatusChange('ATIVA')}
          fullWidth
        >
          Pago
        </Button>
        <Button
          variant={assinatura.status === 'INADIMPLENTE' ? 'outline' : 'secondary'}
          size="sm"
          disabled={disabled || assinatura.status === 'INADIMPLENTE'}
          leftIcon={<AlertTriangle className="h-3.5 w-3.5" />}
          onClick={() => onStatusChange('INADIMPLENTE')}
          fullWidth
        >
          Cobrar
        </Button>
        <Button
          variant={assinatura.status === 'EXPIRADA' ? 'outline' : 'ghost'}
          size="sm"
          disabled={disabled || assinatura.status === 'EXPIRADA'}
          leftIcon={<Clock3 className="h-3.5 w-3.5" />}
          onClick={() => onStatusChange('EXPIRADA')}
          fullWidth
        >
          Expirar
        </Button>
        <Button
          variant="danger"
          size="sm"
          disabled={disabled || assinatura.status === 'CANCELADA'}
          leftIcon={<XCircle className="h-3.5 w-3.5" />}
          onClick={() => onStatusChange('CANCELADA')}
          fullWidth
        >
          Cancelar
        </Button>
      </div>
    </div>
  )
}

interface InfoPillProps {
  icon: typeof CreditCard
  label: string
  value: string
}

function InfoPill({ icon: Icon, label, value }: InfoPillProps) {
  return (
    <div className="min-w-0 rounded-lg border border-surface-800 bg-surface-900/70 px-3 py-2">
      <p className="flex items-center gap-1.5 text-[11px] font-body text-surface-500">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{label}</span>
      </p>
      <p className="mt-1 truncate text-sm font-body font-semibold text-surface-200">{value}</p>
    </div>
  )
}
