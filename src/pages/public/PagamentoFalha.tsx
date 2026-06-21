import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { XCircle, Home, ArrowLeft, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

function getMensagem(status: string | null): { titulo: string; descricao: string; icone: 'erro' | 'aviso' } {
  if (status === 'cancelled') {
    return {
      titulo: 'Fluxo cancelado',
      descricao: 'O processo antigo de pagamento foi cancelado.',
      icone: 'aviso',
    }
  }

  return {
    titulo: 'Pagamento desativado',
    descricao: 'O sistema atual não usa checkout do cliente. O plano é atribuído pela equipe da barbearia.',
    icone: 'erro',
  }
}

export default function PagamentoFalha() {
  const [params] = useSearchParams()
  const { isAutenticado, papel } = useAuth()

  const status = params.get('status') ?? params.get('collection_status')
  const paymentId = params.get('payment_id') ?? params.get('collection_id')

  const { titulo, descricao, icone } = getMensagem(status)
  const isAviso = icone === 'aviso'

  const destinoVoltar = isAutenticado
    ? papel === 'CLIENTE'
      ? '/cliente/dashboard'
      : papel === 'ADMIN'
      ? '/admin/dashboard'
      : '/'
    : '/'

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          className={cn(
            'mx-auto w-24 h-24 rounded-full border-2 flex items-center justify-center mb-8',
            isAviso ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-red-500/10 border-red-500/30',
          )}
        >
          <motion.div
            initial={{ scale: 0, rotate: 45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25, delay: 0.3 }}
          >
            {isAviso
              ? <AlertTriangle className="w-10 h-10 text-yellow-400" />
              : <XCircle className="w-10 h-10 text-red-400" />
            }
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h1 className="text-3xl font-display font-black text-surface-50 mb-2">
            {titulo}
          </h1>
          <p className="text-surface-400 font-body leading-relaxed">
            {descricao}
          </p>
        </motion.div>

        {(status || paymentId) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
            className={cn(
              'mt-8 p-5 rounded-xl border text-left',
              isAviso ? 'border-yellow-500/20 bg-yellow-500/5' : 'border-red-500/20 bg-red-500/5',
            )}
          >
            <div className="flex flex-col gap-2.5">
              {[
                status && { label: 'Status', value: status },
                paymentId && { label: 'ID de referência', value: paymentId },
              ].filter(Boolean).map((item: any) => (
                <div key={item.label} className="flex items-center justify-between text-sm font-body">
                  <span className="text-surface-500">{item.label}</span>
                  <span className="font-mono text-xs text-surface-400 text-right max-w-[60%] truncate">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {!isAviso && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.65 }}
            className="mt-6 p-4 rounded-xl border border-surface-800 bg-surface-900 text-left"
          >
            <p className="text-xs font-body font-semibold text-surface-400 uppercase tracking-wider mb-2">
              O que fazer agora?
            </p>
            <ul className="flex flex-col gap-1.5">
              {[
                'O plano é definido pelo admin da barbearia',
                'Continue usando o app para agendar horários',
                'Fale com a equipe para ajustar sua assinatura',
              ].map(dica => (
                <li key={dica} className="flex items-start gap-2 text-xs font-body text-surface-500">
                  <span className="text-brand-500 mt-0.5">•</span>
                  {dica}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.75 }}
          className="mt-8 flex flex-col gap-3"
        >
          <Link to={destinoVoltar}>
            <Button variant={isAviso ? 'primary' : 'outline'} size="lg" fullWidth
              leftIcon={isAviso ? undefined : <ArrowLeft className="w-4 h-4" />}>
              {isAutenticado ? 'Voltar ao dashboard' : 'Voltar ao início'}
            </Button>
          </Link>
          {isAutenticado && (
            <Link to="/">
              <Button variant="ghost" size="md" fullWidth leftIcon={<Home className="w-4 h-4" />}>
                Página inicial
              </Button>
            </Link>
          )}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-6 text-xs font-body text-surface-600"
        >
          Se você estava tentando revisar um pagamento antigo, fale com a equipe da barbearia.
        </motion.p>
      </motion.div>
    </div>
  )
}
