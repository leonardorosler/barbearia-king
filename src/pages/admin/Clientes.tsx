import { useMemo, useState, type ComponentType } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ArrowUpRight,
  CalendarDays,
  CreditCard,
  Crown,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react'
import { api } from '@/services/api'
import { BadgeAssinatura, Button, Card, CardBody, Input, Modal, SkeletonCard, Table, TableColumn } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'
import type { Assinatura, Cliente, Plano } from '@/types'

type FiltroCliente = 'todos' | 'assinantes' | 'recentes' | 'comTelefone' | 'relacionamento'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.35, delay: i * 0.05 } }),
}

function formatData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function diasDesde(iso: string) {
  const criado = new Date(iso).getTime()
  const hoje = Date.now()
  return Math.max(0, Math.floor((hoje - criado) / 86_400_000))
}

function formatTelefone(telefone?: string | null) {
  if (!telefone) return null

  const digits = telefone.replace(/\D/g, '')
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }

  return telefone
}

function telefoneCliente(cliente: Cliente) {
  return cliente.telefone ?? cliente.usuario.telefone ?? null
}

function iniciais(nome: string) {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(parte => parte.charAt(0).toUpperCase())
    .join('')
}

function segmentoCliente(cliente: Cliente) {
  const dias = diasDesde(cliente.criadoEm)

  if (dias <= 30) {
    return {
      label: 'Novo',
      helper: 'primeiros 30 dias',
      className: 'border-blue-500/20 bg-blue-500/10 text-blue-300',
    }
  }

  if (dias >= 180) {
    return {
      label: 'Leal',
      helper: 'relacionamento longo',
      className: 'border-brand-500/25 bg-brand-500/10 text-brand-300',
    }
  }

  return {
    label: 'Ativo',
    helper: 'base em maturacao',
    className: 'border-green-500/20 bg-green-500/10 text-green-300',
  }
}

function getPlanoDoCliente(clienteId: string, assinaturas: Assinatura[]) {
  const assinaturasDoCliente = assinaturas
    .filter(assinatura => assinatura.cliente.id === clienteId)
    .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())

  return assinaturasDoCliente.find(assinatura => assinatura.status === 'ATIVA') ?? assinaturasDoCliente[0] ?? null
}

interface MetricCardProps {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string | number
  helper: string
  tone: 'brand' | 'green' | 'blue' | 'amber'
}

const metricTone = {
  brand: 'border-brand-500/20 bg-brand-500/10 text-brand-300',
  green: 'border-green-500/20 bg-green-500/10 text-green-300',
  blue: 'border-blue-500/20 bg-blue-500/10 text-blue-300',
  amber: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
}

function MetricCard({ icon: Icon, label, value, helper, tone }: MetricCardProps) {
  return (
    <div className="min-w-0 rounded-lg border border-surface-800 bg-surface-900/90 p-3 shadow-card transition-all duration-200 hover:border-brand-500/25">
      <div className="flex min-w-0 items-center gap-3">
        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border', metricTone[tone])}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-body font-semibold uppercase tracking-wider text-surface-500">{label}</p>
          <div className="mt-1 flex min-w-0 items-baseline gap-2">
            <p className="shrink-0 text-xl font-display font-black leading-none text-surface-50">{value}</p>
            <p className="min-w-0 truncate text-xs font-body text-surface-500">{helper}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminClientes() {
  const qc = useQueryClient()
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<FiltroCliente>('todos')
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [planoId, setPlanoId] = useState('')
  const { success, error } = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-clientes'],
    queryFn: () => api.get<Cliente[]>('/clientes').then(r => r.data),
  })

  const { data: planos, isLoading: loadingPlanos } = useQuery({
    queryKey: ['admin-planos-ativos'],
    queryFn: () => api.get<Plano[]>('/planos').then(r => r.data.filter(p => p.ativo)),
  })

  const { data: assinaturas, isLoading: loadingAssinaturas } = useQuery({
    queryKey: ['admin-assinaturas'],
    queryFn: () => api.get<Assinatura[]>('/assinaturas').then(r => r.data),
  })

  const clientes = data ?? []
  const listaAssinaturas = assinaturas ?? []
  const planoPorCliente = useMemo(() => {
    return new Map(clientes.map(cliente => [cliente.id, getPlanoDoCliente(cliente.id, listaAssinaturas)]))
  }, [clientes, listaAssinaturas])

  const totalClientes = clientes.length
  const clientesRecentes = clientes.filter(c => diasDesde(c.criadoEm) <= 30).length
  const clientesComTelefone = clientes.filter(c => telefoneCliente(c)).length
  const clientesRelacionamento = clientes.filter(c => diasDesde(c.criadoEm) >= 180).length
  const clientesAssinantes = clientes.filter(c => planoPorCliente.get(c.id)?.status === 'ATIVA').length
  const taxaContato = totalClientes ? Math.round((clientesComTelefone / totalClientes) * 100) : 0

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    return clientes.filter(cliente => {
      const telefone = telefoneCliente(cliente) ?? ''
      const correspondeBusca =
        !termo ||
        cliente.usuario.nome.toLowerCase().includes(termo) ||
        cliente.usuario.email.toLowerCase().includes(termo) ||
        telefone.toLowerCase().includes(termo)

      if (!correspondeBusca) return false
      if (filtro === 'assinantes') return planoPorCliente.get(cliente.id)?.status === 'ATIVA'
      if (filtro === 'recentes') return diasDesde(cliente.criadoEm) <= 30
      if (filtro === 'comTelefone') return Boolean(telefoneCliente(cliente))
      if (filtro === 'relacionamento') return diasDesde(cliente.criadoEm) >= 180

      return true
    })
  }, [busca, clientes, filtro, planoPorCliente])

  const filtros: Array<{ id: FiltroCliente; label: string; value: number }> = [
    { id: 'todos', label: 'Todos', value: totalClientes },
    { id: 'assinantes', label: 'Assinantes', value: clientesAssinantes },
    { id: 'recentes', label: 'Novos', value: clientesRecentes },
    { id: 'comTelefone', label: 'Com telefone', value: clientesComTelefone },
    { id: 'relacionamento', label: 'Leais', value: clientesRelacionamento },
  ]

  const planoSelecionado = planos?.find(plano => plano.id === planoId)

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
      success('Plano atribuido', 'A assinatura do cliente foi atualizada.')
      qc.invalidateQueries({ queryKey: ['admin-clientes'] })
      qc.invalidateQueries({ queryKey: ['admin-assinaturas'] })
      setClienteSelecionado(null)
      setPlanoId('')
    },
    onError: () => {
      error('Erro', 'Nao foi possivel atribuir o plano.')
    },
  })

  const abrirAtribuicaoPlano = (cliente: Cliente) => {
    const assinaturaAtual = planoPorCliente.get(cliente.id)

    setClienteSelecionado(cliente)
    setPlanoId(assinaturaAtual?.plano.id ?? (planos?.[0]?.id) ?? '')
  }

  const columns: TableColumn<Cliente>[] = [
    {
      key: 'nome',
      header: 'Cliente',
      className: 'md:w-[28%]',
      render: c => {
        const segmento = segmentoCliente(c)

        return (
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brand-500/25 bg-brand-500/10 shadow-brand-sm">
              <span className="text-xs font-display font-bold text-brand-300">{iniciais(c.usuario.nome)}</span>
            </div>
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <p className="min-w-0 truncate font-body font-semibold text-surface-100">{c.usuario.nome}</p>
                <span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-body font-semibold', segmento.className)}>
                  {segmento.label}
                </span>
              </div>
              <p className="mt-0.5 truncate text-xs text-surface-500">{c.usuario.email}</p>
            </div>
          </div>
        )
      },
    },
    {
      key: 'contato',
      header: 'Contato',
      className: 'md:w-[24%]',
      render: c => {
        const telefone = formatTelefone(telefoneCliente(c))

        return (
          <div className="min-w-0">
            <p className="flex min-w-0 items-center gap-2 text-sm text-surface-300">
              <Phone className="h-3.5 w-3.5 shrink-0 text-surface-500" />
              <span className="truncate">{telefone ?? 'Telefone nao informado'}</span>
            </p>
            <p className="mt-1 flex min-w-0 items-center gap-2 text-xs text-surface-500">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{c.usuario.email}</span>
            </p>
          </div>
        )
      },
    },
    {
      key: 'plano',
      header: 'Plano atual',
      className: 'md:w-[24%]',
      render: c => {
        const assinatura = planoPorCliente.get(c.id)

        if (!assinatura) {
          return (
            <div className="min-w-0">
              <p className="text-sm font-body font-medium text-surface-400">Sem plano</p>
              <p className="mt-1 text-xs text-surface-600">Cliente avulso</p>
            </div>
          )
        }

        return (
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <p className="min-w-0 truncate text-sm font-body font-semibold text-surface-100">{assinatura.plano.nome}</p>
              <BadgeAssinatura status={assinatura.status} />
            </div>
            <p className="mt-1 text-xs text-surface-500">Desde {formatData(assinatura.criadoEm)}</p>
          </div>
        )
      },
    },
    {
      key: 'criadoEm',
      header: 'Cliente desde',
      align: 'center',
      className: 'md:w-[14%]',
      render: c => (
        <div className="text-center">
          <p className="text-sm font-body text-surface-300">{formatData(c.criadoEm)}</p>
          <p className="text-[11px] text-surface-500">{diasDesde(c.criadoEm)} dias na base</p>
        </div>
      ),
    },
    {
      key: 'acoes',
      header: '',
      align: 'right',
      className: 'md:w-[10%]',
      render: c => (
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<CreditCard className="h-3.5 w-3.5" />}
          onClick={() => abrirAtribuicaoPlano(c)}
        >
          Atribuir plano
        </Button>
      ),
    },
  ]

  return (
    <motion.div initial="hidden" animate="visible" className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 lg:gap-5">
      <motion.div
        variants={fadeUp}
        custom={0}
        className="relative min-w-0 overflow-hidden rounded-xl border border-surface-800 bg-surface-900 p-4 shadow-card"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-400/60 to-transparent" />
        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,520px)] xl:items-end">
          <div className="min-w-0">
            <p className="mb-2 inline-flex items-center gap-2 rounded-md border border-brand-500/20 bg-brand-500/10 px-2.5 py-1 text-xs font-body font-semibold uppercase tracking-wider text-brand-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              CRM da barbearia
            </p>
            <h1 className="flex min-w-0 items-center gap-2 text-2xl font-display font-bold text-surface-50">
              <Users className="h-6 w-6 shrink-0 text-brand-400" />
              Clientes
            </h1>
            <p className="mt-1 max-w-2xl text-sm font-body leading-relaxed text-surface-400">
              Organize relacionamento, identifique clientes de alto potencial e transforme a base em receita recorrente.
            </p>
          </div>

          <div className="flex w-full min-w-0 flex-col gap-3">
            <Input
              placeholder="Buscar por nome, e-mail ou telefone..."
              leftIcon={<Search className="h-4 w-4" />}
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
            <div className="flex min-w-0 gap-2 overflow-x-auto rounded-lg border border-surface-800 bg-surface-950/60 p-2">
              {filtros.map(item => (
                <button
                  key={item.id}
                  onClick={() => setFiltro(item.id)}
                  className={cn(
                    'min-w-[84px] rounded-md px-2 py-2 text-center transition-all duration-200',
                    filtro === item.id
                      ? 'bg-brand-500/15 text-brand-300 shadow-brand-sm'
                      : 'text-surface-500 hover:bg-surface-900 hover:text-surface-200',
                  )}
                >
                  <span className="block text-sm font-display font-black leading-none">{item.value}</span>
                  <span className="mt-1 block text-[11px] font-body leading-tight">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} custom={1} className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard icon={Users} label="Base total" value={totalClientes} helper="clientes cadastrados no sistema" tone="brand" />
        <MetricCard icon={CreditCard} label="Assinantes ativos" value={clientesAssinantes} helper="clientes com plano ativo" tone="green" />
        <MetricCard icon={UserPlus} label="Novos clientes" value={clientesRecentes} helper="entraram nos ultimos 30 dias" tone="blue" />
        <MetricCard icon={Phone} label="Contato direto" value={`${taxaContato}%`} helper={`${clientesComTelefone} cliente(s) com telefone`} tone="green" />
        <MetricCard icon={Crown} label="Clientes leais" value={clientesRelacionamento} helper="base madura para planos e campanhas" tone="amber" />
      </motion.div>

      <motion.div variants={fadeUp} custom={2} className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <Table
            columns={columns}
            data={lista}
            loading={isLoading || loadingAssinaturas}
            rowKey={c => c.id}
            skeletonRows={6}
            emptyMessage={busca || filtro !== 'todos' ? 'Nenhum cliente encontrado com estes filtros.' : 'Nenhum cliente encontrado.'}
            emptyIcon={<Users className="h-8 w-8" />}
            className="bg-surface-900/95"
          />
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Card className="overflow-hidden">
            <CardBody className="p-3">
              <div className="flex items-start gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand-500/20 bg-brand-500/10 text-brand-300">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-body font-semibold text-surface-100">Oportunidade comercial</p>
                  <p className="mt-1 text-xs font-body leading-relaxed text-surface-500">
                    Clientes com relacionamento longo sao bons candidatos para planos recorrentes, combos e campanhas de retorno.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="overflow-hidden">
            <CardBody className="p-3">
              <div className="flex items-start gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-green-500/20 bg-green-500/10 text-green-300">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-body font-semibold text-surface-100">Proximo passo</p>
                  <p className="mt-1 text-xs font-body leading-relaxed text-surface-500">
                    Use o botao de plano para converter clientes ativos em receita previsivel sem sair desta tela.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </motion.div>

      <Modal
        isOpen={clienteSelecionado !== null}
        onClose={() => {
          setClienteSelecionado(null)
          setPlanoId('')
        }}
        title="Atribuir plano"
        size="md"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="ghost"
              size="md"
              onClick={() => {
                setClienteSelecionado(null)
                setPlanoId('')
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="md"
              loading={atribuindo}
              disabled={!planoId || loadingPlanos}
              onClick={() => atribuirPlano()}
            >
              Salvar plano
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          <div className="rounded-lg border border-surface-800 bg-surface-950/50 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-brand-500/25 bg-brand-500/10">
                <span className="text-sm font-display font-bold text-brand-300">
                  {clienteSelecionado ? iniciais(clienteSelecionado.usuario.nome) : '?'}
                </span>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-body font-semibold text-surface-100">{clienteSelecionado?.usuario.nome}</p>
                <p className="truncate text-xs font-body text-surface-500">{clienteSelecionado?.usuario.email}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-surface-200">
              Plano
            </label>
            <select
              value={planoId}
              onChange={(e) => setPlanoId(e.target.value)}
              className="h-10 w-full rounded-md border border-surface-700 bg-surface-900 px-3 font-body text-sm text-surface-100 transition-all duration-150 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">Selecione um plano</option>
              {(planos ?? []).map(plano => (
                <option key={plano.id} value={plano.id}>
                  {plano.nome}
                </option>
              ))}
            </select>
          </div>

          {loadingPlanos ? (
            <SkeletonCard lines={2} />
          ) : planoSelecionado ? (
            <div className="rounded-lg border border-brand-500/20 bg-brand-500/10 p-4">
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />
                <div className="min-w-0">
                  <p className="text-sm font-body font-semibold text-brand-200">{planoSelecionado.nome}</p>
                  <p className="mt-1 text-xs font-body leading-relaxed text-brand-100/70">
                    O cliente passa a fazer parte da esteira de recorrencia da barbearia.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-surface-800 p-4 text-center">
              <p className="text-sm font-body text-surface-500">Selecione um plano ativo para continuar.</p>
            </div>
          )}
        </div>
      </Modal>
    </motion.div>
  )
}
