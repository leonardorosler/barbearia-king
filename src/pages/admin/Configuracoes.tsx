import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Settings, Save } from 'lucide-react'
import { useBarbearia } from '@/contexts/BarbeariaContext'
import { api } from '@/services/api'
import { useToast } from '@/components/ui/Toast'
import { Button, Input, Card, CardBody, CardHeader, CardFooter } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { DiaSemana, HorarioFuncionamento } from '@/types'

const DIAS: { key: DiaSemana; label: string }[] = [
  { key: 'seg', label: 'Segunda' },
  { key: 'ter', label: 'Terca' },
  { key: 'qua', label: 'Quarta' },
  { key: 'qui', label: 'Quinta' },
  { key: 'sex', label: 'Sexta' },
  { key: 'sab', label: 'Sabado' },
  { key: 'dom', label: 'Domingo' },
]

const schema = z.object({
  nome: z.string().min(2, 'Nome obrigatorio'),
  telefone: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  endereco: z.string().optional(),
})

type FormData = z.infer<typeof schema>
type HorarioForm = Record<DiaSemana, { ativo: boolean; abre: string; fecha: string }>

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.08 } }),
}

function buildHorariosForm(horarioFuncionamento: HorarioFuncionamento | null): HorarioForm {
  return DIAS.reduce((acc, { key }) => {
    const horario = horarioFuncionamento?.[key]
    acc[key] = {
      ativo: !!horario,
      abre: horario?.abre ?? '08:00',
      fecha: horario?.fecha ?? '18:00',
    }
    return acc
  }, {} as HorarioForm)
}

function buildHorarioFuncionamento(horarios: HorarioForm): HorarioFuncionamento {
  return DIAS.reduce((acc, { key }) => {
    const horario = horarios[key]
    acc[key] = horario.ativo ? { abre: horario.abre, fecha: horario.fecha } : null
    return acc
  }, {} as HorarioFuncionamento)
}

export default function AdminConfiguracoes() {
  const { barbearia } = useBarbearia()
  const qc = useQueryClient()
  const { success, error } = useToast()
  const [horarios, setHorarios] = useState<HorarioForm>(() => buildHorariosForm(barbearia.horarioFuncionamento))

  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } =
    useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    reset({
      nome: barbearia.nome ?? '',
      telefone: barbearia.telefone ?? '',
      instagram: barbearia.instagram ?? '',
      facebook: barbearia.facebook ?? '',
      endereco: barbearia.endereco ?? '',
    })
    setHorarios(buildHorariosForm(barbearia.horarioFuncionamento))
  }, [barbearia, reset])

  const { mutate: salvarDados } = useMutation({
    mutationFn: (data: FormData) => api.patch('/barbearia', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['barbearia'] })
      success('Configuracoes salvas!')
    },
    onError: () => error('Erro', 'Nao foi possivel salvar as configuracoes.'),
  })

  const { mutate: salvarHorarios, isPending: salvandoHorarios } = useMutation({
    mutationFn: () => api.patch('/barbearia', {
      horarioFuncionamento: buildHorarioFuncionamento(horarios),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['barbearia'] })
      success('Horarios salvos!')
    },
    onError: () => error('Erro', 'Nao foi possivel salvar os horarios.'),
  })

  const toggleDia = (dia: DiaSemana) => {
    setHorarios((atual) => ({
      ...atual,
      [dia]: { ...atual[dia], ativo: !atual[dia].ativo },
    }))
  }

  const alterarHorario = (dia: DiaSemana, campo: 'abre' | 'fecha', valor: string) => {
    setHorarios((atual) => ({
      ...atual,
      [dia]: { ...atual[dia], [campo]: valor },
    }))
  }

  return (
    <motion.div initial="hidden" animate="visible" className="max-w-2xl mx-auto flex flex-col gap-6">
      <motion.div variants={fadeUp} custom={0}>
        <h1 className="text-2xl font-display font-bold text-surface-50 flex items-center gap-2">
          <Settings className="w-5 h-5 text-brand-400" /> Configuracoes
        </h1>
        <p className="text-surface-400 font-body text-sm mt-0.5">
          Dados e horarios da barbearia.
        </p>
      </motion.div>

      <motion.div variants={fadeUp} custom={1}>
        <Card>
          <CardHeader>
            <p className="text-sm font-body font-semibold text-surface-100">Dados da barbearia</p>
          </CardHeader>
          <CardBody>
            <form id="form-config" onSubmit={handleSubmit(d => salvarDados(d))} className="flex flex-col gap-4">
              <Input label="Nome" error={errors.nome?.message} {...register('nome')} />
              <Input label="Telefone" hint="Exibido no site" {...register('telefone')} />
              <Input label="Endereco" {...register('endereco')} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Instagram" placeholder="@usuario" {...register('instagram')} />
                <Input label="Facebook" placeholder="usuario ou pagina" {...register('facebook')} />
              </div>
            </form>
          </CardBody>
          <CardFooter>
            <Button type="submit" form="form-config" variant="primary" size="md"
              loading={isSubmitting} disabled={!isDirty}
              leftIcon={<Save className="w-4 h-4" />}>
              Salvar alteracoes
            </Button>
          </CardFooter>
        </Card>
      </motion.div>

      <motion.div variants={fadeUp} custom={2}>
        <Card>
          <CardHeader>
            <p className="text-sm font-body font-semibold text-surface-100">Horario de funcionamento</p>
            <p className="text-xs font-body text-surface-500 mt-0.5">
              Ative os dias de atendimento e defina abertura e fechamento.
            </p>
          </CardHeader>
          <CardBody>
            <div className="flex flex-col gap-3">
              {DIAS.map(({ key, label }) => {
                const horario = horarios[key]
                return (
                  <div key={key} className={cn(
                    'flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center',
                    horario.ativo ? 'border-brand-500/25 bg-brand-500/5' : 'border-surface-800 bg-surface-800/40',
                  )}>
                    <span className={cn(
                      'w-24 text-sm font-body shrink-0',
                      horario.ativo ? 'text-surface-200' : 'text-surface-600',
                    )}>
                      {label}
                    </span>

                    <button
                      type="button"
                      onClick={() => toggleDia(key)}
                      className={cn(
                        'relative h-5 w-10 rounded-full transition-all duration-200',
                        horario.ativo ? 'bg-brand-500' : 'bg-surface-700',
                      )}
                    >
                      <span className={cn(
                        'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-200',
                        horario.ativo ? 'left-5' : 'left-0.5',
                      )} />
                    </button>

                    {horario.ativo ? (
                      <div className="flex flex-1 items-center gap-2">
                        <input
                          type="time"
                          value={horario.abre}
                          onChange={e => alterarHorario(key, 'abre', e.target.value)}
                          className="h-9 rounded-md border border-surface-700 bg-surface-900 px-2 text-sm text-surface-100 [color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                        />
                        <span className="text-sm text-surface-500">ate</span>
                        <input
                          type="time"
                          value={horario.fecha}
                          onChange={e => alterarHorario(key, 'fecha', e.target.value)}
                          className="h-9 rounded-md border border-surface-700 bg-surface-900 px-2 text-sm text-surface-100 [color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                        />
                      </div>
                    ) : (
                      <span className="text-xs font-body text-surface-600 italic">Fechado</span>
                    )}
                  </div>
                )
              })}
            </div>
          </CardBody>
          <CardFooter>
            <Button variant="primary" size="md"
              loading={salvandoHorarios}
              leftIcon={<Save className="w-4 h-4" />}
              onClick={() => salvarHorarios()}>
              Salvar horarios
            </Button>
          </CardFooter>
        </Card>
      </motion.div>

      <motion.div variants={fadeUp} custom={3}>
        <Card>
          <CardHeader>
            <p className="text-sm font-body font-semibold text-surface-100">Identificacao</p>
          </CardHeader>
          <CardBody>
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs font-body text-surface-500 mb-1">ID da barbearia</p>
                <p className="text-sm font-mono text-surface-400 bg-surface-800 px-3 py-2 rounded-lg">{barbearia.id}</p>
              </div>
              <div>
                <p className="text-xs font-body text-surface-500 mb-1">Slug (URL)</p>
                <p className="text-sm font-mono text-brand-400 bg-surface-800 px-3 py-2 rounded-lg">{barbearia.slug}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </motion.div>
    </motion.div>
  )
}
