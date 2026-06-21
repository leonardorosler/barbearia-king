import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { api } from '@/services/api'
import { useToast } from '@/components/ui/Toast'
import { Button, Input } from '@/components/ui'

const schema = z.object({
  novaSenha: z
    .string()
    .min(8, 'Mínimo de 8 caracteres')
    .regex(/[A-Z]/, 'Precisa de ao menos uma letra maiúscula')
    .regex(/[0-9]/, 'Precisa de ao menos um número'),
  confirmar: z.string().min(1, 'Confirme a senha'),
}).refine((d) => d.novaSenha === d.confirmar, {
  message: 'As senhas não coincidem',
  path: ['confirmar'],
})

type FormData = z.infer<typeof schema>

export default function RedefinirSenha() {
  const [searchParams]  = useSearchParams()
  const { error }       = useToast()
  const [ok, setOk]     = useState(false)
  const [showNova, setShowNova]         = useState(false)
  const [showConfirmar, setShowConfirmar] = useState(false)

  const token = searchParams.get('token') ?? ''

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    if (!token) {
      error('Token inválido', 'Use o link enviado para o seu e-mail.')
      return
    }
    try {
      await api.post('/auth/redefinir-senha', { token, novaSenha: data.novaSenha })
      setOk(true)
    } catch {
      error('Link expirado', 'Solicite um novo link de redefinição.')
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        {ok ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            </div>
            <h1 className="text-2xl font-display font-bold text-surface-50 mb-2">Senha redefinida!</h1>
            <p className="text-surface-400 font-body text-sm mb-8">
              Sua nova senha foi salva com sucesso. Faça login para continuar.
            </p>
            <Link to="/login">
              <Button variant="primary" size="md" fullWidth>Ir para o login</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-6">
                <KeyRound className="w-5 h-5 text-brand-400" />
              </div>
              <h1 className="text-2xl font-display font-bold text-surface-50 mb-1">Nova senha</h1>
              <p className="text-surface-400 font-body text-sm">Escolha uma senha forte para sua conta.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
              <Input
                label="Nova senha"
                type={showNova ? 'text' : 'password'}
                placeholder="••••••••"
                error={errors.novaSenha?.message}
                rightIcon={
                  <button type="button" onClick={() => setShowNova(v => !v)} tabIndex={-1}
                    className="text-surface-500 hover:text-surface-300 transition-colors">
                    {showNova ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                {...register('novaSenha')}
              />
              <Input
                label="Confirmar senha"
                type={showConfirmar ? 'text' : 'password'}
                placeholder="••••••••"
                error={errors.confirmar?.message}
                rightIcon={
                  <button type="button" onClick={() => setShowConfirmar(v => !v)} tabIndex={-1}
                    className="text-surface-500 hover:text-surface-300 transition-colors">
                    {showConfirmar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                {...register('confirmar')}
              />
              <Button type="submit" variant="primary" size="lg" fullWidth loading={isSubmitting} className="mt-2">
                Salvar nova senha
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/login" className="text-sm font-body text-surface-500 hover:text-brand-400 transition-colors inline-flex items-center gap-1.5">
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao login
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}