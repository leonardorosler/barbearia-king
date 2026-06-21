import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CalendarDays, Clock, CheckCircle2, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/services/api'
import { Button, Card, CardBody, CardHeader, BadgeAgendamento, SkeletonCard } from '@/components/ui'
import { cn } from '@/lib/utils'
import { compareIsoDateTime, formatIsoDate, formatIsoTime, isoDateKey, toDateInputValue } from '@/lib/date'
import type { Agendamento } from '@/types'

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.08 } }),
}

function formatHora(iso: string) {
  return formatIsoTime(iso)
}
function formatData(iso: string) {
  return formatIsoDate(iso)
}

export default function BarbeiroDashboard() {
  const { usuario } = useAuth()

  const hoje = toDateInputValue()

  const { data: agendamentos, isLoading } = useQuery({
    queryKey: ['barbeiro-agendamentos-hoje'],
    queryFn:  () => api.get<Agendamento[]>('/agendamentos/agenda', { params: { data: hoje } }).then(r => r.data),
  })

  const { data: semana } = useQuery({
    queryKey: ['barbeiro-agendamentos-semana'],
    queryFn:  () => api.get<Agendamento[]>('/agendamentos/agenda').then(r => r.data),
  })

  const lista     = agendamentos ?? []
  const pendentes = lista.filter(a => a.status === 'PENDENTE').length
  const confirmados = lista.filter(a => a.status === 'CONFIRMADO').length
  const concluidos  = lista.filter(a => a.status === 'CONCLUIDO').length

  const proximos = lista
    .filter(a => ['PENDENTE', 'CONFIRMADO'].includes(a.status))
    .sort((a, b) => compareIsoDateTime(a.inicio, b.inicio))

  const primeiroNome = usuario?.nome?.split(' ')[0] ?? 'Barbeiro'

  return (
    <motion.div initial="hidden" animate="visible" className="max-w-4xl mx-auto flex flex-col gap-6">

      <motion.div variants={fadeUp} custom={0}>
        <h1 className="text-2xl font-display font-bold text-surface-50">
          Olá, {primeiroNome} ✂️
        </h1>
        <p className="text-surface-400 font-body text-sm mt-1">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
        </p>
      </motion.div>

      {/* Stats do dia */}
      <motion.div variants={fadeUp} custom={1} className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pendentes',  value: pendentes,   icon: Clock,         color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
          { label: 'Confirmados',value: confirmados,  icon: CalendarDays,  color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20'     },
          { label: 'Concluídos', value: concluidos,   icon: CheckCircle2,  color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20'   },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-surface-900 border border-surface-800 rounded-xl p-4">
              <div className={cn('w-8 h-8 rounded-lg border flex items-center justify-center mb-3', stat.bg)}>
                <Icon className={cn('w-4 h-4', stat.color)} />
              </div>
              <p className="text-2xl font-display font-black text-surface-50">{stat.value}</p>
              <p className="text-xs font-body text-surface-500 mt-0.5">{stat.label}</p>
            </div>
          )
        })}
      </motion.div>

      {/* Agenda de hoje */}
      <motion.div variants={fadeUp} custom={2}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-surface-100 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-brand-400" /> Agenda de hoje
          </h2>
          <Link to="/barbeiro/agenda">
            <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
              Ver agenda completa
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} hasAvatar lines={1} />)}
          </div>
        ) : proximos.length === 0 ? (
          <Card className="py-10 text-center">
            <CheckCircle2 className="w-8 h-8 text-surface-700 mx-auto mb-3" />
            <p className="text-surface-400 font-body text-sm">Nenhum atendimento pendente hoje.</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {proximos.map(ag => (
              <div key={ag.id} className="flex items-center gap-4 p-4 rounded-xl border bg-surface-900 border-surface-800">
                <div className="w-14 shrink-0 text-center">
                  <p className="text-xs font-body text-surface-500">início</p>
                  <p className="text-sm font-display font-bold text-brand-400">{formatHora(ag.inicio)}</p>
                  <p className="text-xs font-body text-surface-600">{formatHora(ag.fim)}</p>
                </div>
                <div className="w-px h-10 bg-surface-800 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-body font-semibold text-surface-100 truncate">{ag.cliente.usuario.nome}</p>
                  <p className="text-xs text-surface-500 mt-0.5">{ag.servico.nome} · {ag.servico.duracao}min</p>
                </div>
                <BadgeAgendamento status={ag.status} />
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Próximos dias */}
      {(semana ?? []).filter(a => {
        const d = isoDateKey(a.inicio)
        return d > hoje && ['PENDENTE','CONFIRMADO'].includes(a.status)
      }).length > 0 && (
        <motion.div variants={fadeUp} custom={3}>
          <Card>
            <CardHeader>
              <p className="text-sm font-body font-semibold text-surface-100">Próximos agendamentos</p>
            </CardHeader>
            <CardBody>
              <div className="flex flex-col gap-3">
                {(semana ?? [])
                  .filter(a => {
                    const d = isoDateKey(a.inicio)
                    return d > hoje && ['PENDENTE','CONFIRMADO'].includes(a.status)
                  })
                  .sort((a,b) => compareIsoDateTime(a.inicio, b.inicio))
                  .slice(0, 5)
                  .map(ag => (
                    <div key={ag.id} className="flex items-center gap-3 py-2 border-b border-surface-800 last:border-0">
                      <div className="text-center w-10 shrink-0">
                        <p className="text-2xs font-body text-surface-500 uppercase">{formatData(ag.inicio).split('/')[1]}</p>
                        <p className="text-sm font-display font-bold text-surface-200">{formatData(ag.inicio).split('/')[0]}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-body font-medium text-surface-100 truncate">{ag.cliente.usuario.nome}</p>
                        <p className="text-xs text-surface-500">{ag.servico.nome} · {formatHora(ag.inicio)}</p>
                      </div>
                      <BadgeAgendamento status={ag.status} />
                    </div>
                  ))}
              </div>
            </CardBody>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}
