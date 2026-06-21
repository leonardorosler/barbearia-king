import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { ArrowLeft, CalendarDays, CheckCircle2, Eye, EyeOff, UserPlus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useBarbearia } from '@/contexts/BarbeariaContext'
import { useToast } from '@/components/ui/Toast'
import { Button, Input } from '@/components/ui'

const schema = z.object({
  nome: z
    .string()
    .min(2, 'Nome deve ter ao menos 2 caracteres')
    .max(80, 'Nome muito longo'),
  email: z.string().min(1, 'E-mail obrigatório').email('E-mail inválido'),
  telefone: z
    .string()
    .regex(/^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/, 'Telefone inválido')
    .optional()
    .or(z.literal('')),
  senha: z
    .string()
    .min(8, 'Mínimo de 8 caracteres')
    .regex(/[A-Z]/, 'Precisa de ao menos uma letra maiúscula')
    .regex(/[0-9]/, 'Precisa de ao menos um número'),
  confirmarSenha: z.string().min(1, 'Confirme sua senha'),
}).refine((d) => d.senha === d.confirmarSenha, {
  message: 'As senhas não coincidem',
  path: ['confirmarSenha'],
})

type FormData = z.infer<typeof schema>

function ForcaSenha({ senha }: { senha: string }) {
  const checks = [
    { ok: senha.length >= 8, label: '8+ caracteres' },
    { ok: /[A-Z]/.test(senha), label: 'Maiúscula' },
    { ok: /[0-9]/.test(senha), label: 'Número' },
    { ok: /[^A-Za-z0-9]/.test(senha), label: 'Símbolo' },
  ]
  const score = checks.filter((c) => c.ok).length

  const cor = ['bg-surface-700', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'][score]
  const label = ['', 'Fraca', 'Razoável', 'Boa', 'Forte'][score]

  if (!senha) return null

  return (
    <div className="mt-2 flex flex-col gap-2">
      <div className="flex gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? cor : 'bg-surface-800'}`}
          />
        ))}
        <span className="ml-1 shrink-0 self-center text-2xs font-body text-surface-500">{label}</span>
      </div>
    </div>
  )
}

const steps = [
  { step: '01', title: 'Crie sua conta', desc: 'Cadastro rápido e gratuito' },
  { step: '02', title: 'Escolha seu serviço', desc: 'Corte, barba, sobrancelha ou plano' },
  { step: '03', title: 'Confirme o horário', desc: 'Sem fila, sem improviso' },
]

export default function Cadastro() {
  const { cadastro } = useAuth()
  const { barbearia } = useBarbearia()
  const { error, success } = useToast()
  const navigate = useNavigate()
  const [showSenha, setShowSenha] = useState(false)
  const [showConfirmar, setShowConfirmar] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const senhaAtual = watch('senha', '')

  const onSubmit = async (data: FormData) => {
    try {
      await cadastro({
        nome: data.nome,
        email: data.email,
        senha: data.senha,
        telefone: data.telefone || undefined,
      })
      success('Conta criada!', 'Bem-vindo à ' + barbearia.nome)
      navigate('/cliente/dashboard', { replace: true })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { mensagem?: string } } })
        ?.response?.data?.mensagem ?? 'Erro ao criar conta. Tente novamente.'
      error('Falha no cadastro', msg)
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
        <div className="absolute inset-0 bg-surface-950/84" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(190,123,42,0.3),transparent_30%),linear-gradient(90deg,rgba(10,10,10,0.98),rgba(10,10,10,0.76)_50%,rgba(10,10,10,0.92))]" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_480px] lg:px-10">
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
            <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-white/95 p-2 shadow-2xl shadow-black/30">
              <img src="/logoking.png" alt="" className="h-full w-full object-contain" />
            </span>
            <div>
              <p className="font-body text-xs font-bold uppercase tracking-[0.24em] text-brand-400">
                Nova experiência
              </p>
              <p className="mt-1 font-display text-xl font-black text-surface-50">
                {barbearia.nome}
              </p>
            </div>
          </div>

          <h1 className="max-w-2xl font-display text-5xl font-black leading-[0.95] text-surface-50 xl:text-6xl">
            Agende melhor. Chegue no horário. Saia no detalhe.
          </h1>
          <p className="mt-6 max-w-xl font-body text-base leading-8 text-surface-300">
            Crie sua conta para escolher serviços, acompanhar sua rotina e deixar o atendimento pronto antes de sentar na cadeira.
          </p>

          <div className="mt-10 grid max-w-xl gap-4">
            {steps.map((item) => (
              <div key={item.step} className="flex items-start gap-4 border-l border-white/10 bg-white/[0.03] px-4 py-3">
                <span className="mt-0.5 w-8 shrink-0 font-display text-sm font-black text-brand-400">
                  {item.step}
                </span>
                <div>
                  <p className="font-body text-sm font-bold text-surface-100">{item.title}</p>
                  <p className="mt-1 font-body text-xs text-surface-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto w-full max-w-[470px]"
        >
          <div className="border border-white/10 bg-surface-950/88 p-5 shadow-2xl shadow-black/35 backdrop-blur-md sm:p-7">
            <div className="mb-7 flex items-center justify-between gap-4">
              <Link to="/" className="flex min-w-0 items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white p-1.5">
                  <img src="/logoking.png" alt="" className="h-full w-full object-contain" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-display text-base font-black text-surface-50">
                    {barbearia.nome}
                  </span>
                  <span className="block text-xs font-body font-semibold uppercase tracking-[0.18em] text-brand-400">
                    Cadastro
                  </span>
                </span>
              </Link>
              <span className="hidden items-center gap-2 rounded-md border border-brand-500/20 bg-brand-500/10 px-3 py-2 text-xs font-body font-bold text-brand-300 sm:flex">
                <CalendarDays className="h-4 w-4" />
                Online
              </span>
            </div>

            <div className="mb-7">
              <h2 className="font-display text-3xl font-black text-surface-50">
                Criar conta
              </h2>
              <p className="mt-2 font-body text-sm leading-6 text-surface-400">
                Já tem conta?{' '}
                <Link to="/login" className="font-semibold text-brand-400 transition-colors hover:text-brand-300">
                  Entrar
                </Link>
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
              <Input
                label="Nome completo"
                type="text"
                autoComplete="name"
                placeholder="João Silva"
                required
                error={errors.nome?.message}
                {...register('nome')}
              />

              <Input
                label="E-mail"
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                required
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label="Telefone"
                type="tel"
                autoComplete="tel"
                placeholder="(11) 99999-9999"
                hint="Opcional, usado para confirmações"
                error={errors.telefone?.message}
                {...register('telefone')}
              />

              <div>
                <Input
                  label="Senha"
                  type={showSenha ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="********"
                  required
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
                <ForcaSenha senha={senhaAtual} />
              </div>

              <Input
                label="Confirmar senha"
                type={showConfirmar ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="********"
                required
                error={errors.confirmarSenha?.message}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmar((v) => !v)}
                    className="text-surface-500 transition-colors hover:text-surface-200"
                    tabIndex={-1}
                    aria-label={showConfirmar ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showConfirmar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                {...register('confirmarSenha')}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={isSubmitting}
                leftIcon={<UserPlus className="h-4 w-4" />}
                className="mt-2"
              >
                Criar conta grátis
              </Button>
            </form>

            <div className="mt-6 flex items-start gap-2 border-t border-white/10 pt-5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
              <p className="font-body text-xs leading-5 text-surface-500">
                Ao criar sua conta, você concorda com os <span className="text-surface-400">Termos de Uso</span> e a{' '}
                <span className="text-surface-400">Política de Privacidade</span>.
              </p>
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  )
}
