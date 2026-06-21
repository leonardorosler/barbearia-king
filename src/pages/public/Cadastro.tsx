import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Scissors, UserPlus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useBarbearia } from '@/contexts/BarbeariaContext'
import { useToast } from '@/components/ui/Toast'
import { Button, Input } from '@/components/ui'

// ─────────────────────────────────────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Indicador de força da senha
// ─────────────────────────────────────────────────────────────────────────────

function ForcaSenha({ senha }: { senha: string }) {
  const checks = [
    { ok: senha.length >= 8,    label: '8+ caracteres' },
    { ok: /[A-Z]/.test(senha),  label: 'Maiúscula'     },
    { ok: /[0-9]/.test(senha),  label: 'Número'        },
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
        <span className="text-2xs font-body text-surface-500 ml-1 shrink-0 self-center">{label}</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function Cadastro() {
  const { cadastro }    = useAuth()
  const { barbearia }   = useBarbearia()
  const { error, success } = useToast()
  const navigate        = useNavigate()
  const [showSenha, setShowSenha]           = useState(false)
  const [showConfirmar, setShowConfirmar]   = useState(false)

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
        nome:     data.nome,
        email:    data.email,
        senha:    data.senha,
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
    <div className="min-h-[calc(100vh-4rem)] flex">

      {/* ── Painel esquerdo — decorativo ─────────────────────────────────── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-surface-950">
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
              Comece a cuidar<br />
              <span className="text-gradient-brand">do seu estilo.</span>
            </h2>
            <p className="text-surface-400 font-body leading-relaxed">
              Crie sua conta em segundos e tenha acesso a agendamentos
              e histórico completo.
            </p>

            <div className="mt-12 flex flex-col gap-5">
              {[
                { step: '01', title: 'Crie sua conta',      desc: 'Rápido e gratuito'                   },
                { step: '02', title: 'Escolha o serviço',   desc: 'Veja todos os serviços disponíveis'  },
                { step: '03', title: 'Agende seu horário',  desc: 'Escolha o barbeiro e confirme'       },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4">
                  <span className="text-xs font-display font-bold text-brand-500/60 mt-0.5 w-6 shrink-0">
                    {item.step}
                  </span>
                  <div>
                    <p className="text-sm font-body font-semibold text-surface-200">{item.title}</p>
                    <p className="text-xs font-body text-surface-500 mt-0.5">{item.desc}</p>
                  </div>
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
              Criar conta
            </h1>
            <p className="text-surface-400 font-body text-sm">
              Já tem conta?{' '}
              <Link to="/login" className="text-brand-400 hover:text-brand-300 transition-colors font-medium">
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
              hint="Opcional — usado para confirmações"
              error={errors.telefone?.message}
              {...register('telefone')}
            />

            <div>
              <Input
                label="Senha"
                type={showSenha ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                required
                error={errors.senha?.message}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowSenha((v) => !v)}
                    className="text-surface-500 hover:text-surface-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
              placeholder="••••••••"
              required
              error={errors.confirmarSenha?.message}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirmar((v) => !v)}
                  className="text-surface-500 hover:text-surface-300 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
              leftIcon={<UserPlus className="w-4 h-4" />}
              className="mt-2"
            >
              Criar conta grátis
            </Button>
          </form>

          <p className="text-center text-xs font-body text-surface-600 mt-8">
            Ao criar sua conta, você concorda com os{' '}
            <span className="text-surface-500">Termos de Uso</span> e a{' '}
            <span className="text-surface-500">Política de Privacidade</span>.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
