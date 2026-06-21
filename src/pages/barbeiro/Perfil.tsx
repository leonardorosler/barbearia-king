import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { User, Save, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/services/api'
import { useToast } from '@/components/ui/Toast'
import { Button, Input, Card, CardBody, CardHeader, CardFooter } from '@/components/ui'
import type { Barbeiro } from '@/types'

const schema = z.object({
  foto:           z.string().url('URL inválida').optional().or(z.literal('')),
  bio:            z.string().max(500, 'Bio muito longa.').optional(),
})
type FormData = z.infer<typeof schema>

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.08 } }),
}

export default function BarbeiroPerfil() {
  const { usuario, logout } = useAuth()
  const qc                  = useQueryClient()
  const { success, error }  = useToast()

  const { data: barbeiro } = useQuery({
    queryKey: ['barbeiro-perfil'],
    queryFn:  () => api.get<Barbeiro>('/barbeiros/me').then(r => r.data),
  })

  const {
    register, handleSubmit, reset, watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (barbeiro) {
      reset({
        foto:           barbeiro.foto ?? '',
        bio:            barbeiro.bio ?? '',
      })
    }
  }, [barbeiro, reset])

  const { mutate: salvar } = useMutation({
    mutationFn: (d: FormData) => api.patch('/barbeiros/me', {
      foto: d.foto || undefined,
      bio: d.bio?.trim() || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['barbeiro-perfil'] })
      success('Perfil atualizado!')
    },
    onError: () => error('Erro', 'Não foi possível salvar.'),
  })

  const inicial = usuario?.nome?.charAt(0).toUpperCase() ?? '?'
  const fotoAtual = watch('foto')

  return (
    <motion.div initial="hidden" animate="visible" className="max-w-lg mx-auto flex flex-col gap-6">

      <motion.div variants={fadeUp} custom={0}>
        <h1 className="text-2xl font-display font-bold text-surface-50 flex items-center gap-2">
          <User className="w-5 h-5 text-brand-400" /> Meu Perfil
        </h1>
        <p className="text-surface-400 font-body text-sm mt-0.5">
          Gerencie sua foto, bio e conta.
        </p>
      </motion.div>

      {/* Avatar + info */}
      <motion.div variants={fadeUp} custom={1} className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-brand-500/15 border-2 border-brand-500/30 shrink-0">
          {fotoAtual ? (
            <img src={fotoAtual} alt={usuario?.nome} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-2xl font-display font-bold text-brand-400">{inicial}</span>
            </div>
          )}
        </div>
        <div>
          <p className="font-display font-semibold text-surface-100">{usuario?.nome}</p>
          <p className="text-sm font-body text-surface-500">{usuario?.email}</p>
          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-2xs font-body font-semibold bg-brand-500/10 border border-brand-500/20 text-brand-400 uppercase tracking-wider">
            Barbeiro
          </span>
        </div>
      </motion.div>

      {/* Formulário */}
      <motion.div variants={fadeUp} custom={2}>
        <Card>
          <CardHeader>
            <p className="text-sm font-body font-semibold text-surface-100">Dados profissionais</p>
            <p className="text-xs font-body text-surface-500 mt-0.5">
              Estas informações aparecem para os clientes.
            </p>
          </CardHeader>

          <CardBody>
            <form id="perfil-form" onSubmit={handleSubmit(d => salvar(d))} className="flex flex-col gap-5">
              {/* Foto */}
              <Input
                label="URL da foto"
                type="url"
                placeholder="https://..."
                hint="Link direto para uma imagem (JPG, PNG)"
                error={errors.foto?.message}
                {...register('foto')}
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium font-body text-surface-200">
                  Bio profissional
                </label>
                <textarea
                  rows={5}
                  placeholder="Conte um pouco sobre sua experiência e estilo de atendimento."
                  className="w-full px-3 py-2 rounded-md border bg-surface-900 border-surface-700 text-surface-100 font-body text-sm placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-none"
                  {...register('bio')}
                />
                {errors.bio?.message ? (
                  <p className="text-xs text-red-400 font-body">{errors.bio.message}</p>
                ) : (
                  <p className="text-xs font-body text-surface-500">
                    Descreva seu atendimento. Máximo de 500 caracteres.
                  </p>
                )}
              </div>

              {/* E-mail desabilitado */}
              <Input
                label="E-mail"
                type="email"
                value={usuario?.email ?? ''}
                disabled
                hint="O e-mail não pode ser alterado."
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

      {/* Sessão */}
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
