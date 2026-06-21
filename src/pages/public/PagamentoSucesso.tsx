import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, CalendarDays, Home, ArrowRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

export default function PagamentoSucesso() {
  const [params] = useSearchParams()
  const { isAutenticado, papel } = useAuth()

  const externalReference = params.get('external_reference')

  const destino = papel === 'CLIENTE'
    ? '/cliente/assinatura'
    : papel === 'ADMIN'
    ? '/admin/dashboard'
    : '/'

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md text-center"
      >
        <div className="relative mx-auto w-24 h-24 mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.4, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
            className="absolute inset-0 rounded-full bg-green-500/20"
          />
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
            className="absolute inset-0 rounded-full bg-green-500/15"
          />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
            className="relative w-24 h-24 rounded-full bg-green-500/15 border-2 border-green-500/40 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25, delay: 0.3 }}
            >
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h1 className="text-3xl font-display font-black text-surface-50 mb-2">
            Fluxo desativado
          </h1>
          <p className="text-surface-400 font-body leading-relaxed mb-2">
            O sistema agora trabalha com planos atribuídos pela equipe, sem pagamento direto pelo cliente.
          </p>
          {externalReference && (
            <p className="text-xs font-body text-surface-600">
              Referência: <span className="font-mono text-surface-500">{externalReference}</span>
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="mt-8 p-5 rounded-xl border border-green-500/20 bg-green-500/5"
        >
          <div className="flex flex-col gap-3">
            {[
              { label: 'Status', value: 'Desativado', ok: true },
              { label: 'Plano', value: 'Gerenciado pela equipe', ok: true },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between text-sm font-body">
                <span className="text-surface-500">{item.label}</span>
                <span className={cn('font-medium', item.ok ? 'text-green-400' : 'text-surface-300')}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-8 flex flex-col gap-3"
        >
          {isAutenticado ? (
            <>
              <Link to={destino}>
                <Button variant="primary" size="lg" fullWidth
                  leftIcon={<CalendarDays className="w-4 h-4" />}
                  rightIcon={<ArrowRight className="w-4 h-4" />}>
                  {papel === 'CLIENTE' ? 'Ver meu plano' : 'Ir para o dashboard'}
                </Button>
              </Link>
              <Link to="/">
                <Button variant="ghost" size="md" fullWidth leftIcon={<Home className="w-4 h-4" />}>
                  Voltar ao início
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="primary" size="lg" fullWidth rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Entrar na conta
                </Button>
              </Link>
              <Link to="/">
                <Button variant="ghost" size="md" fullWidth leftIcon={<Home className="w-4 h-4" />}>
                  Voltar ao início
                </Button>
              </Link>
            </>
          )}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-6 text-xs font-body text-surface-600"
        >
          Se você precisava revisar um pagamento antigo, fale com a equipe da barbearia.
        </motion.p>
      </motion.div>
    </div>
  )
}
