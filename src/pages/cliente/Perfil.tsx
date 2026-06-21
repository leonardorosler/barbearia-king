import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { User, Save, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/services/api'
import { useToast } from '@/components/ui/Toast'
import { Button, Input, Card, CardBody, CardHeader, CardFooter } from '@/components/ui'
import type { Cliente } from '@/types'

const schema = z.object({
  nome:     z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  telefone: z
    .string()
    .regex(/^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/, 'Telefone inválido')
    .optional()
    .or(z.literal('')),
})

type FormData = z.infer<typeof schema>

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.08 } }),
}

export default function ClientePerfil() {
  const { usuario, logout } = useAuth()
  const qc = useQueryClient()
  const { success, error }  = useToast()

  const { data: perfil } = useQuery({
    queryKey: ['cliente-perfil'],
    queryFn: () => api.get<Cliente>('/clientes/perfil').then(r => r.data),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  // Preenche o form com dados do usuário atual
  useEffect(() => {
    if (usuario) {
      reset({
        nome: perfil?.usuario.nome ?? usuario.nome ?? '',
        telefone: perfil?.telefone ?? perfil?.usuario.telefone ?? '',
      })
    }
  }, [perfil, usuario, reset])

  const { mutate: salvar } = useMutation({
    mutationFn: (data: FormData) => api.patch('/clientes/perfil', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cliente-perfil'] })
      success('Perfil atualizado!')
    },
    onError:   () => error('Erro', 'Não foi possível salvar. Tente novamente.'),
  })

  const onSubmit = (data: FormData) => salvar(data)

  const inicial = usuario?.nome?.charAt(0).toUpperCase() ?? '?'

  return (
    <motion.div initial="hidden" animate="visible" className="max-w-lg mx-auto flex flex-col gap-6">

      <motion.div variants={fadeUp} custom={0}>
        <h1 className="text-2xl font-display font-bold text-surface-50 flex items-center gap-2">
          <User className="w-5 h-5 text-brand-400" /> Meu Perfil
        </h1>
        <p className="text-surface-400 font-body text-sm mt-0.5">
          Gerencie suas informações pessoais.
        </p>
      </motion.div>

      {/* Avatar */}
      <motion.div variants={fadeUp} custom={1} className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-brand-500/15 border-2 border-brand-500/30 flex items-center justify-center">
          <span className="text-2xl font-display font-bold text-brand-400">{inicial}</span>
        </div>
        <div>
          <p className="font-display font-semibold text-surface-100">{usuario?.nome}</p>
          <p className="text-sm font-body text-surface-500">{usuario?.email}</p>
          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-2xs font-body font-semibold bg-brand-500/10 border border-brand-500/20 text-brand-400 uppercase tracking-wider">
            {usuario?.papel === 'CLIENTE' ? 'Cliente' : usuario?.papel}
          </span>
        </div>
      </motion.div>

      {/* Formulário */}
      <motion.div variants={fadeUp} custom={2}>
        <Card>
          <CardHeader>
            <p className="text-sm font-body font-semibold text-surface-100">Informações pessoais</p>
            <p className="text-xs font-body text-surface-500 mt-0.5">
              Atualize seus dados de contato.
            </p>
          </CardHeader>

          <CardBody>
            <form id="perfil-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <Input
                label="Nome completo"
                type="text"
                autoComplete="name"
                error={errors.nome?.message}
                {...register('nome')}
              />
              <Input
                label="E-mail"
                type="email"
                value={usuario?.email ?? ''}
                disabled
                hint="O e-mail não pode ser alterado."
              />
              <Input
                label="Telefone"
                type="tel"
                autoComplete="tel"
                placeholder="(11) 99999-9999"
                hint="Opcional"
                error={errors.telefone?.message}
                {...register('telefone')}
              />
            </form>
          </CardBody>

          <CardFooter>
            <Button
              type="submit"
              form="perfil-form"
              variant="primary"
              size="md"
              loading={isSubmitting}
              disabled={!isDirty}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Salvar alterações
            </Button>
          </CardFooter>
        </Card>
      </motion.div>

      {/* Zona de perigo */}
      <motion.div variants={fadeUp} custom={3}>
        <Card>
          <CardHeader>
            <p className="text-sm font-body font-semibold text-surface-100">Sessão</p>
          </CardHeader>
          <CardBody>
            <p className="text-xs font-body text-surface-500 mb-4">
              Ao sair, você será redirecionado para a página inicial.
            </p>
            <Button
              variant="danger"
              size="md"
              leftIcon={<LogOut className="w-4 h-4" />}
              onClick={logout}
            >
              Sair da conta
            </Button>
          </CardBody>
        </Card>
      </motion.div>
    </motion.div>
  )
}
