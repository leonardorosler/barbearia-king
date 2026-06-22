import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { AlertCircle, CalendarDays, CreditCard, Check } from 'lucide-react'
import { api } from '@/services/api'
import { Button, Card, CardBody, CardHeader, CardFooter, BadgeAssinatura, SkeletonCard } from '@/components/ui'
import type { Assinatura, PlanoUtilizacao } from '@/types'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.09 } }),
}

function formatData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

export default function ClienteAssinatura() {
  const { data: assinatura, isLoading } = useQuery({
    queryKey: ['cliente-assinatura'],
    queryFn: () => api.get<Assinatura[]>('/assinaturas/minhas').then(r => r.data[0] ?? null).catch(() => null),
  })

  const { data: utilizacao } = useQuery({
    queryKey: ['cliente-plano-utilizacao'],
    queryFn: () => api.get<PlanoUtilizacao | null>('/assinaturas/minha/utilizacao').then(r => r.data).catch(() => null),
  })

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <SkeletonCard lines={4} />
      </div>
    )
  }

  return (
    <motion.div initial="hidden" animate="visible" className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <motion.div variants={fadeUp} custom={0}>
        <h1 className="text-2xl font-display font-bold text-surface-50 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-brand-400" /> Meu Plano
        </h1>
        <p className="text-surface-400 font-body text-sm mt-0.5">
          Seu plano e gerenciado pela equipe da barbearia.
        </p>
      </motion.div>

      {assinatura ? (
        <motion.div variants={fadeUp} custom={1}>
          <Card highlighted={assinatura.status === 'ATIVA'}>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-body text-surface-500 uppercase tracking-wider mb-1">
                    Plano atual
                  </p>
                  <h2 className="text-xl font-display font-bold text-surface-50">
                    {assinatura.plano.nome}
                  </h2>
                </div>
                <BadgeAssinatura status={assinatura.status} dot />
              </div>

              <p className="text-3xl font-display font-black text-gradient-brand mt-3">
                R$ {Number(assinatura.plano.preco).toFixed(2).replace('.', ',')}
                <span className="text-sm font-body text-surface-500 font-normal ml-1">/mes</span>
              </p>

              <div className="mt-4 inline-flex max-w-full items-center gap-2 rounded-full border border-surface-800 bg-surface-900 px-3 py-1 text-xs font-body text-surface-400">
                <CalendarDays className="w-3.5 h-3.5 text-brand-400" />
                Atribuído pela equipe em {formatData(assinatura.criadoEm)}
              </div>
            </CardHeader>

            <CardBody>
              {assinatura.plano.descricao && (
                <p className="text-surface-400 font-body text-sm mb-4">
                  {assinatura.plano.descricao}
                </p>
              )}

              {assinatura.plano.planosServicos.length > 0 && (
                <div>
                  <p className="text-xs font-body font-semibold text-surface-500 uppercase tracking-wider mb-3">
                    Servicos inclusos
                  </p>
                  <ul className="flex flex-col gap-2">
                    {assinatura.plano.planosServicos.map(ps => {
                      const saldo = utilizacao?.servicos.find(item => item.servicoId === ps.servico.id)

                      return (
                        <li key={ps.servico.id} className="flex flex-col gap-2 rounded-lg border border-surface-800 bg-surface-900 p-3 text-sm font-body text-surface-300">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <Check className="w-4 h-4 text-brand-400 shrink-0" />
                            <span className="min-w-0 font-medium text-surface-100">{ps.servico.nome}</span>
                            <span className="text-surface-600">({ps.servico.duracao}min)</span>
                          </div>
                          <div className="flex flex-wrap gap-2 pl-6 text-xs text-surface-500">
                            <span>{saldo?.disponiveis ?? ps.quantidade} disponiveis</span>
                            <span>{saldo?.usados ?? 0} usados</span>
                            <span>{saldo?.reservados ?? 0} reservados</span>
                            <span>limite {ps.quantidade}/mes</span>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </CardBody>

            <CardFooter>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link to="/cliente/agendamentos" className="w-full sm:w-auto">
                  <Button variant="primary" size="md" fullWidth leftIcon={<CalendarDays className="w-4 h-4" />}>
                    Ver agendamentos
                  </Button>
                </Link>
              </div>

              <div className="flex items-start gap-2 mt-4 p-3 rounded-lg bg-surface-900 border border-surface-800">
                <AlertCircle className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                <p className="text-xs font-body text-surface-400">
                  Se precisar trocar de plano, fale com o admin da barbearia. Aqui voce acompanha apenas o plano atual.
                </p>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      ) : (
        <motion.div variants={fadeUp} custom={1}>
          <Card>
            <CardBody className="py-8">
              <div className="flex flex-col items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-surface-800 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-surface-500" />
                </div>
                <div>
                  <p className="text-lg font-display font-bold text-surface-50">Nenhum plano atribuído</p>
                  <p className="text-sm font-body text-surface-400 mt-1">
                    O plano da sua conta será definido pela equipe da barbearia.
                    Enquanto isso, voce pode continuar usando o app para agendar horários.
                  </p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  <Link to="/cliente/novo-agendamento" className="w-full sm:w-auto">
                    <Button variant="primary" size="md" fullWidth leftIcon={<CalendarDays className="w-4 h-4" />}>
                      Agendar horário
                    </Button>
                  </Link>
                  <Link to="/cliente/dashboard" className="w-full sm:w-auto">
                    <Button variant="outline" size="md" fullWidth>
                      Voltar ao dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}
