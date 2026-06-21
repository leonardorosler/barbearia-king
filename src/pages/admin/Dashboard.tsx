import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  CalendarDays, Users, CreditCard, TrendingUp,
  Scissors, Crown, BarChart3,
} from 'lucide-react'
import { api } from '@/services/api'
import { Card, CardBody, CardHeader, SkeletonCard, BadgeAgendamento } from '@/components/ui'
import { cn } from '@/lib/utils'
import { compareIsoDateTime, formatIsoTime, toDateInputValue } from '@/lib/date'
import type { Dashboard, Agendamento } from '@/types'

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.07 } }),
}

function formatMoeda(valor: string | number) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function formatHora(iso: string) {
  return formatIsoTime(iso)
}
// function formatData(iso: string) {
//   return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
// }

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  sub?: string
  highlight?: boolean
  index: number
}

function StatCard({ label, value, icon: Icon, sub, highlight, index }: StatCardProps) {
  return (
    <motion.div variants={fadeUp} custom={index}
      className={cn(
        'relative overflow-hidden rounded-xl border p-5',
        highlight
          ? 'bg-brand-gradient border-brand-400/30'
          : 'bg-surface-900 border-surface-800',
      )}
    >
      {highlight && <div className="absolute inset-0 bg-hero-pattern opacity-10" />}
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className={cn('text-xs font-body font-semibold uppercase tracking-wider mb-2',
            highlight ? 'text-white/70' : 'text-surface-500')}>
            {label}
          </p>
          <p className={cn('text-3xl font-display font-black',
            highlight ? 'text-white' : 'text-surface-50')}>
            {value}
          </p>
          {sub && (
            <p className={cn('text-xs font-body mt-1',
              highlight ? 'text-white/60' : 'text-surface-500')}>
              {sub}
            </p>
          )}
        </div>
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center',
          highlight ? 'bg-white/20' : 'bg-brand-500/10 border border-brand-500/20')}>
          <Icon className={cn('w-5 h-5', highlight ? 'text-white' : 'text-brand-400')} />
        </div>
      </div>
    </motion.div>
  )
}

export default function AdminDashboard() {
  const { data: dash, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn:  () => api.get<Dashboard>('/dashboard').then(r => r.data),
  })

  const { data: agendamentos } = useQuery({
    queryKey: ['admin-agendamentos-hoje'],
    queryFn:  () => api.get<Agendamento[]>('/agendamentos', { params: { data: toDateInputValue() } }).then(r => r.data),
  })

  const proximos = (agendamentos ?? [])
    .filter(a => ['PENDENTE', 'CONFIRMADO'].includes(a.status))
    .sort((a, b) => compareIsoDateTime(a.inicio, b.inicio))
    .slice(0, 5)

  return (
    <motion.div initial="hidden" animate="visible" className="max-w-6xl mx-auto flex flex-col gap-6">
      <motion.div variants={fadeUp} custom={0}>
        <h1 className="text-2xl font-display font-bold text-surface-50">Dashboard</h1>
        <p className="text-surface-400 font-body text-sm mt-0.5">
          Visão geral de {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
        </p>
      </motion.div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={2} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard index={1} highlight label="Receita do mês" value={formatMoeda(dash?.receitaMes ?? 0)} icon={TrendingUp} />
          <StatCard index={2} label="Agendamentos hoje" value={dash?.agendamentosHoje ?? 0} icon={CalendarDays} sub={`${dash?.agendamentosMes ?? 0} no mês`} />
          <StatCard index={3} label="Clientes ativos" value={dash?.clientesAtivos ?? 0} icon={Users} />
          <StatCard index={4} label="Assinaturas ativas" value={dash?.assinaturasAtivas ?? 0} icon={CreditCard} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agendamentos de hoje */}
        <motion.div variants={fadeUp} custom={5} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <p className="text-sm font-body font-semibold text-surface-100 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-brand-400" /> Agendamentos de hoje
              </p>
            </CardHeader>
            <CardBody>
              {proximos.length === 0 ? (
                <p className="text-surface-500 font-body text-sm text-center py-6">
                  Nenhum agendamento para hoje.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {proximos.map(ag => (
                    <div key={ag.id} className="flex items-center gap-3 py-2 border-b border-surface-800 last:border-0">
                      <div className="w-9 h-9 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-display font-bold text-brand-400">{formatHora(ag.inicio)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-body font-medium text-surface-100 truncate">{ag.cliente.usuario.nome}</p>
                        <p className="text-xs text-surface-500">{ag.servico.nome} · {ag.barbeiro.usuario.nome}</p>
                      </div>
                      <BadgeAgendamento status={ag.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </motion.div>

        {/* Rankings */}
        <motion.div variants={fadeUp} custom={6} className="flex flex-col gap-4">
          {/* Top barbeiros */}
          <Card>
            <CardHeader>
              <p className="text-sm font-body font-semibold text-surface-100 flex items-center gap-2">
                <Crown className="w-4 h-4 text-brand-400" /> Top Barbeiros
              </p>
            </CardHeader>
            <CardBody>
              {isLoading ? <SkeletonCard lines={3} /> : (
                <div className="flex flex-col gap-2">
                  {(dash?.barbeirosRanking ?? []).slice(0, 4).map((item, i) => (
                    <div key={item.barbeiro.id} className="flex items-center gap-2">
                      <span className="text-xs font-display font-bold text-surface-600 w-4">{i + 1}</span>
                      <div className="w-6 h-6 rounded-full bg-surface-800 flex items-center justify-center shrink-0">
                        {item.barbeiro.foto
                          ? <img src={item.barbeiro.foto} className="w-full h-full rounded-full object-cover" />
                          : <Scissors className="w-3 h-3 text-surface-500" />
                        }
                      </div>
                      <p className="text-xs font-body text-surface-300 flex-1 truncate">{item.barbeiro.usuario.nome}</p>
                      <span className="text-xs font-body font-semibold text-brand-400">{item.total}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Top serviços */}
          <Card>
            <CardHeader>
              <p className="text-sm font-body font-semibold text-surface-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-brand-400" /> Top Serviços
              </p>
            </CardHeader>
            <CardBody>
              {isLoading ? <SkeletonCard lines={3} /> : (
                <div className="flex flex-col gap-2">
                  {(dash?.servicosRanking ?? []).slice(0, 4).map((item, i) => (
                    <div key={item.servico.id} className="flex items-center gap-2">
                      <span className="text-xs font-display font-bold text-surface-600 w-4">{i + 1}</span>
                      <p className="text-xs font-body text-surface-300 flex-1 truncate">{item.servico.nome}</p>
                      <span className="text-xs font-body font-semibold text-brand-400">{item.total}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
