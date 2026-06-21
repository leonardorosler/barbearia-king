import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarDays, CalendarPlus, CreditCard, Clock, ChevronRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/services/api'
import { Button, Card, BadgeAgendamento, BadgeAssinatura, SkeletonCard } from '@/components/ui'
import { cn } from '@/lib/utils'
import { compareIsoDateTime, formatIsoDateMonthShort, formatIsoTime } from '@/lib/date'
import type { Agendamento, Assinatura } from '@/types'

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.08 } }),
}

function formatData(iso: string) {
  return formatIsoDateMonthShort(iso)
}
function formatHora(iso: string) {
  return formatIsoTime(iso)
}

export default function ClienteDashboard() {
  const { usuario } = useAuth()

  const { data: agendamentos, isLoading: loadingAg } = useQuery({
    queryKey: ['cliente-agendamentos'],
    queryFn:  () => api.get<Agendamento[]>('/agendamentos/meus').then(r => r.data),
  })

  const { data: assinatura, isLoading: loadingAs } = useQuery({
    queryKey: ['cliente-assinatura'],
    queryFn:  () => api.get<Assinatura[]>('/assinaturas/minhas').then(r => r.data[0] ?? null).catch(() => null),
  })

  const proximos = (agendamentos ?? [])
    .filter(a => ['PENDENTE', 'CONFIRMADO'].includes(a.status))
    .sort((a, b) => compareIsoDateTime(a.inicio, b.inicio))
    .slice(0, 3)

  const primeiroNome = usuario?.nome?.split(' ')[0] ?? 'Cliente'

  return (
    <motion.div initial="hidden" animate="visible" className="max-w-4xl mx-auto flex flex-col gap-6">

      {/* Saudação */}
      <motion.div variants={fadeUp} custom={0}>
        <h1 className="text-2xl font-display font-bold text-surface-50">
          Olá, {primeiroNome} 👋
        </h1>
        <p className="text-surface-400 font-body text-sm mt-1">
          Aqui está um resumo da sua conta.
        </p>
      </motion.div>

      {/* Cards de ação rápida */}
      <motion.div variants={fadeUp} custom={1} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/cliente/novo-agendamento">
          <div className={cn(
            'group relative overflow-hidden rounded-xl p-5 border cursor-pointer',
            'bg-brand-gradient border-brand-400/30',
            'hover:shadow-brand-lg transition-all duration-300',
          )}>
            <div className="absolute inset-0 bg-hero-pattern opacity-10" />
            <CalendarPlus className="w-6 h-6 text-white mb-3 relative z-10" />
            <p className="font-display font-bold text-white text-lg relative z-10">Novo agendamento</p>
            <p className="text-white/70 font-body text-sm mt-0.5 relative z-10">Agende agora em segundos</p>
            <ChevronRight className="w-4 h-4 text-white/60 absolute right-4 top-1/2 -translate-y-1/2 group-hover:right-3 transition-all" />
          </div>
        </Link>

        <Link to="/cliente/assinatura">
          <div className={cn(
            'group relative overflow-hidden rounded-xl p-5 border cursor-pointer',
            'bg-surface-900 border-surface-800',
            'hover:border-surface-700 hover:shadow-card-hover transition-all duration-300',
          )}>
            <CreditCard className="w-6 h-6 text-brand-400 mb-3" />
            <p className="font-display font-bold text-surface-50 text-lg">Meu plano</p>
            {loadingAs ? (
              <p className="text-surface-500 font-body text-sm mt-0.5">Carregando...</p>
            ) : assinatura ? (
              <div className="mt-1.5">
                <BadgeAssinatura status={assinatura.status} dot />
              </div>
            ) : (
              <p className="text-surface-500 font-body text-sm mt-0.5">Nenhum plano atribuído</p>
            )}
            <ChevronRight className="w-4 h-4 text-surface-600 absolute right-4 top-1/2 -translate-y-1/2 group-hover:right-3 transition-all" />
          </div>
        </Link>
      </motion.div>

      {/* Próximos agendamentos */}
      <motion.div variants={fadeUp} custom={2}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-surface-100 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-brand-400" />
            Próximos agendamentos
          </h2>
          <Link to="/cliente/agendamentos">
            <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
              Ver todos
            </Button>
          </Link>
        </div>

        {loadingAg ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} hasAvatar lines={1} />)}
          </div>
        ) : proximos.length === 0 ? (
          <Card className="py-10 text-center">
            <CalendarDays className="w-8 h-8 text-surface-700 mx-auto mb-3" />
            <p className="text-surface-400 font-body text-sm">Nenhum agendamento próximo.</p>
            <Link to="/cliente/novo-agendamento" className="mt-3 inline-block">
              <Button variant="outline" size="sm">Agendar agora</Button>
            </Link>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {proximos.map((ag) => (
              <div key={ag.id} className={cn(
                'flex items-center gap-4 p-4 rounded-xl border',
                'bg-surface-900 border-surface-800',
              )}>
                {/* Data */}
                <div className="w-12 h-12 rounded-lg bg-brand-500/10 border border-brand-500/20 flex flex-col items-center justify-center shrink-0">
                  <span className="text-xs font-body text-brand-400 uppercase leading-none">
                    {formatData(ag.inicio).split(' ')[1]}
                  </span>
                  <span className="text-lg font-display font-bold text-brand-300 leading-none">
                    {formatData(ag.inicio).split(' ')[0]}
                  </span>
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-body font-semibold text-surface-100 truncate">{ag.servico.nome}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs font-body text-surface-500">
                      com {ag.barbeiro.usuario.nome}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-body text-surface-500">
                      <Clock className="w-3 h-3" /> {formatHora(ag.inicio)}
                    </span>
                  </div>
                </div>
                <BadgeAgendamento status={ag.status} />
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
