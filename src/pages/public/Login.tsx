import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { ArrowLeft, CalendarCheck, Eye, EyeOff, LogIn, ShieldCheck, Sparkles } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useBarbearia } from '@/contexts/BarbeariaContext'
import { useToast } from '@/components/ui/Toast'
import { Button, Input } from '@/components/ui'
import type { Papel } from '@/types'

const schema = z.object({
  email: z.string().min(1, 'E-mail obrigatório').email('E-mail inválido'),
  senha: z.string().min(1, 'Senha obrigatória'),
})

type FormData = z.infer<typeof schema>

const DESTINO: Record<Papel, string> = {
  CLIENTE: '/cliente/dashboard',
  BARBEIRO: '/barbeiro/dashboard',
  ADMIN: '/admin/dashboard',
}

const benefits = [
  { icon: CalendarCheck, label: 'Agendamentos em poucos cliques' },
  { icon: ShieldCheck, label: 'Histórico e dados protegidos' },
  { icon: Sparkles, label: 'Planos e serviços sempre à mão' },
]

export default function Login() {
  const { login } = useAuth()
  const { barbearia } = useBarbearia()
  const { error, success } = useToast()
  const navigate = useNavigate()
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
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-surface-950 text-surface-50">
      <div className="absolute inset-0">
        <img
          src="/banner.png"
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-surface-950/82" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(190,123,42,0.28),transparent_32%),linear-gradient(90deg,rgba(10,10,10,0.98),rgba(10,10,10,0.72)_46%,rgba(10,10,10,0.9))]" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_440px] lg:px-10">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="hidden max-w-2xl lg:block"
        >
          <Link
            to="/"
            className="mb-10 inline-flex items-center gap-2 text-xs font-body font-bold uppercase tracking-[0.22em] text-surface-300 transition-colors hover:text-brand-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para home
          </Link>

          <div className="mb-8 flex items-center gap-4">
            <span className=" flex h-16 w-16 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-surface-950 p-2 shadow-2xl shadow-black/30">
              <img src="/logoking.png" alt="" className="h-full w-full object-contain bg-surface-950" />
            </span>
            <div>
              <p className="font-body text-xs font-bold uppercase tracking-[0.24em] text-brand-400">
                Área do cliente
              </p>
              <p className="mt-1 font-display text-xl font-black text-surface-50">
                {barbearia.nome}
              </p>
            </div>
          </div>

          <h1 className="max-w-2xl font-display text-5xl font-black leading-[0.95] text-surface-50 xl:text-6xl">
            Seu horário, seu plano e seu estilo em um só lugar.
          </h1>
          <p className="mt-6 max-w-xl font-body text-base leading-8 text-surface-300">
            Entre para acompanhar seus agendamentos, revisar serviços e manter sua rotina de cuidado sempre organizada.
          </p>

          <div className="mt-10 grid max-w-xl gap-3">
            {benefits.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="flex items-center gap-3 border-l border-brand-500/60 bg-white/[0.03] px-4 py-3">
                  <Icon className="h-4 w-4 text-brand-400" />
                  <span className="font-body text-sm font-semibold text-surface-200">{item.label}</span>
                </div>
              )
            })}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto w-full max-w-[430px]"
        >
          <div className="border border-white/10 bg-surface-950/88 p-5 shadow-2xl shadow-black/35 backdrop-blur-md sm:p-7">
            <div className="mb-8 flex items-center justify-between gap-4">
              <Link to="/" className="flex min-w-0 items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-950 p-1.5">
                  <img src="/logoking.png" alt="" className="h-full w-full object-contain" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-display text-base font-black text-surface-50">
                    {barbearia.nome}
                  </span>
                  <span className="block text-xs font-body font-semibold uppercase tracking-[0.18em] text-brand-400">
                    Login
                  </span>
                </span>
              </Link>
            </div>

            <div className="mb-7">
              <h2 className="font-display text-3xl font-black text-surface-50">
                Entrar na conta
              </h2>
              <p className="mt-2 font-body text-sm leading-6 text-surface-400">
                Ainda não tem conta?{' '}
                <Link to="/cadastro" className="font-semibold text-brand-400 transition-colors hover:text-brand-300">
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
                  placeholder="********"
                  error={errors.senha?.message}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowSenha((v) => !v)}
                      className="text-surface-500 transition-colors hover:text-surface-200"
                      tabIndex={-1}
                      aria-label={showSenha ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                  {...register('senha')}
                />
                <div className="mt-2 text-right">
                  <Link
                    to="/esqueceu-senha"
                    className="text-xs font-body font-medium text-surface-500 transition-colors hover:text-brand-400"
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
                leftIcon={<LogIn className="h-4 w-4" />}
                className="mt-2"
              >
                Entrar
              </Button>
            </form>

            <p className="mt-8 border-t border-white/10 pt-5 text-center font-body text-xs leading-5 text-surface-500">
              Ao entrar, você concorda com os <span className="text-surface-400">Termos de Uso</span> e a{' '}
              <span className="text-surface-400">Política de Privacidade</span>.
            </p>
          </div>
        </motion.section>
      </div>
    </main>
  )
}
