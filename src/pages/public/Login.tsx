import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Scissors, LogIn } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useBarbearia } from '@/contexts/BarbeariaContext'
import { useToast } from '@/components/ui/Toast'
import { Button, Input } from '@/components/ui'
import type { Papel } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────────────────────────────────────

const schema = z.object({
  email: z.string().min(1, 'E-mail obrigatório').email('E-mail inválido'),
  senha: z.string().min(1, 'Senha obrigatória'),
})

type FormData = z.infer<typeof schema>

// ─────────────────────────────────────────────────────────────────────────────
// Destino por papel após login
// ─────────────────────────────────────────────────────────────────────────────

const DESTINO: Record<Papel, string> = {
  CLIENTE:  '/cliente/dashboard',
  BARBEIRO: '/barbeiro/dashboard',
  ADMIN:    '/admin/dashboard',
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function Login() {
  const { login }       = useAuth()
  const { barbearia }   = useBarbearia()
  const { error, success } = useToast()
  const navigate        = useNavigate()
  const [showSenha, setShowSenha] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      const usuario = await login(data)
      success('Bem-vindo de volta!')
      navigate(DESTINO[usuario.papel], { replace: true })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { mensagem?: string } } })
        ?.response?.data?.mensagem ?? 'E-mail ou senha incorretos.'
      error('Falha no login', msg)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">

      {/* ── Painel esquerdo — decorativo ─────────────────────────────────── */}
      <div className="hidden pl-4 lg:flex flex-1 relative overflow-hidden bg-surface-950">
        <div className="absolute inset-0 bg-hero-pattern" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-transparent to-transparent" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-brand-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center px-16 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="w-12 h-12 rounded-xl bg-brand-gradient flex items-center justify-center mb-8">
              <Scissors className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-4xl font-display font-black text-surface-50 leading-tight mb-4">
              Estilo é um<br />
              <span className="text-gradient-brand">hábito.</span>
            </h2>
            <p className="text-surface-400 font-body leading-relaxed">
              Acesse sua conta para gerenciar seus agendamentos
              e acompanhar seu plano atribuído pela equipe.
            </p>

            <div className="mt-12 flex flex-col gap-4">
              {[
                'Agendamento em poucos cliques',
                'Histórico completo de atendimentos',
                'Plano atribuído pela equipe',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                  <span className="text-sm font-body text-surface-400">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Painel direito — formulário ───────────────────────────────────── */}
      <div className="flex-1 lg:max-w-[480px] flex items-center justify-center px-6 py-12 bg-surface-950 lg:bg-surface-950/60 lg:border-l lg:border-surface-800">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          {/* Logo mobile */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center">
              <Scissors className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-surface-50">{barbearia.nome}</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-display font-bold text-surface-50 mb-1">
              Entrar na conta
            </h1>
            <p className="text-surface-400 font-body text-sm">
              Não tem conta?{' '}
              <Link to="/cadastro" className="text-brand-400 hover:text-brand-300 transition-colors font-medium">
                Cadastre-se grátis
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <Input
              label="E-mail"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <div>
              <Input
                label="Senha"
                type={showSenha ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                error={errors.senha?.message}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowSenha((v) => !v)}
                    className="text-surface-500 hover:text-surface-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showSenha
                      ? <EyeOff className="w-4 h-4" />
                      : <Eye className="w-4 h-4" />
                    }
                  </button>
                }
                {...register('senha')}
              />
              <div className="mt-1.5 text-right">
                <Link
                  to="/esqueceu-senha"
                  className="text-xs font-body text-surface-500 hover:text-brand-400 transition-colors"
                >
                  Esqueceu a senha?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isSubmitting}
              leftIcon={<LogIn className="w-4 h-4" />}
              className="mt-2"
            >
              Entrar
            </Button>
          </form>

          <p className="text-center text-xs font-body text-surface-600 mt-8">
            Ao entrar, você concorda com os{' '}
            <span className="text-surface-500">Termos de Uso</span> e a{' '}
            <span className="text-surface-500">Política de Privacidade</span>.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
