import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, Scissors } from 'lucide-react'
import { publicApi } from '@/services/api'
import { useBarbearia } from '@/contexts/BarbeariaContext'
import { useToast } from '@/components/ui/Toast'
import { Button, Input } from '@/components/ui'

const schema = z.object({
  email: z.string().min(1, 'E-mail obrigatório').email('E-mail inválido'),
})
type FormData = z.infer<typeof schema>

export default function EsqueceuSenha() {
  const { barbearia }   = useBarbearia()
  const { success, error } = useToast()
  const [enviado, setEnviado] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      await publicApi.post('/auth/esqueceu-senha', data)
      setEnviado(true)
      success('E-mail enviado!', 'Verifique sua caixa de entrada.')
    } catch {
      error('Erro', 'Não foi possível enviar o e-mail. Tente novamente.')
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
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center">
            <Scissors className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-surface-50">{barbearia.nome}</span>
        </div>

        {enviado ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
              <Mail className="w-6 h-6 text-green-400" />
            </div>
            <h1 className="text-2xl font-display font-bold text-surface-50 mb-2">E-mail enviado</h1>
            <p className="text-surface-400 font-body text-sm leading-relaxed mb-8">
              Enviamos as instruções para redefinir sua senha. Verifique também a caixa de spam.
            </p>
            <Link to="/login">
              <Button variant="outline" size="md" fullWidth leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Voltar ao login
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-display font-bold text-surface-50 mb-1">Esqueceu a senha?</h1>
              <p className="text-surface-400 font-body text-sm">
                Informe seu e-mail e enviaremos um link para redefinir.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
              <Input
                label="E-mail"
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                error={errors.email?.message}
                leftIcon={<Mail className="w-4 h-4" />}
                {...register('email')}
              />
              <Button type="submit" variant="primary" size="lg" fullWidth loading={isSubmitting} className="mt-2">
                Enviar instruções
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
