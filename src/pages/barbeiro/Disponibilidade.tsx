import { useState, useEffect } from 'react'
import type { AxiosError } from 'axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Clock, Save } from 'lucide-react'
import { api } from '@/services/api'
import { Button, Card, CardBody, CardHeader, CardFooter } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import type { Barbeiro } from '@/types'

const DIAS = [
  { idx: 1, label: 'Segunda-feira' },
  { idx: 2, label: 'Terça-feira'   },
  { idx: 3, label: 'Quarta-feira'  },
  { idx: 4, label: 'Quinta-feira'  },
  { idx: 5, label: 'Sexta-feira'   },
  { idx: 6, label: 'Sábado'        },
  { idx: 0, label: 'Domingo'       },
]

interface HorarioDia {
  ativo:  boolean
  inicio: string
  fim:    string
}

type Grade = Record<number, HorarioDia>

interface DisponibilidadeApi {
  diaSemana: number
  horaInicio: string
  horaFim: string
}

function buildDefaultGrade(): Grade {
  const grade: Grade = {}
  DIAS.forEach(d => {
    grade[d.idx] = { ativo: false, inicio: '08:00', fim: '18:00' }
  })
  return grade
}

function buildGrade(disp: DisponibilidadeApi[]): Grade {
  const grade = buildDefaultGrade()
  DIAS.forEach(d => {
    const item = disp.find(x => x.diaSemana === d.idx)
    if (item) {
      grade[d.idx] = { ativo: true, inicio: item.horaInicio, fim: item.horaFim }
    }
  })
  return grade
}

export default function BarbeiroDisponibilidade() {
  const { usuario } = useAuth()
  const qc = useQueryClient()
  const { success, error } = useToast()
  const [grade, setGrade] = useState<Grade>(() => buildDefaultGrade())

  const { data: barbeiros, isLoading: isLoadingBarbeiro } = useQuery({
    queryKey: ['barbeiro-disponibilidade-barbeiros', usuario?.id],
    enabled: !!usuario,
    queryFn:  () => api.get<Barbeiro[]>('/barbeiros').then(r => r.data),
  })

  const barbeiroId = barbeiros?.find(b =>
    b.usuario.id === usuario?.id || b.usuario.email === usuario?.email
  )?.id

  const { data, isLoading } = useQuery({
    queryKey: ['barbeiro-disponibilidade', barbeiroId],
    enabled: !!barbeiroId,
    queryFn:  () => api.get<DisponibilidadeApi[]>(`/disponibilidade/${barbeiroId}`).then(r => r.data),
  })

  useEffect(() => {
    if (data) setGrade(buildGrade(data))
  }, [data])

  const { mutate: salvar, isPending } = useMutation({
    mutationFn: () => {
      if (!barbeiroId) {
        throw new Error('Barbeiro não identificado.')
      }

      const disponibilidades = Object.entries(grade)
        .filter(([, v]) => v.ativo)
        .map(([dia, v]) => ({ diaSemana: Number(dia), horaInicio: v.inicio, horaFim: v.fim }))
      return api.put(`/disponibilidade/${barbeiroId}`, { disponibilidades })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['barbeiro-disponibilidade', barbeiroId] })
      success('Disponibilidade salva!')
    },
    onError:   (err) => {
      const apiError = err as AxiosError<{ mensagem?: string }>
      const mensagem = apiError.response?.data?.mensagem ?? 'Não foi possível salvar.'
      error('Erro', mensagem)
    },
  })

  const toggle = (idx: number) =>
    setGrade(g => {
      const atual = g[idx] ?? { ativo: false, inicio: '08:00', fim: '18:00' }
      return { ...g, [idx]: { ...atual, ativo: !atual.ativo } }
    })

  const setHorario = (idx: number, campo: 'inicio' | 'fim', val: string) =>
    setGrade(g => {
      const atual = g[idx] ?? { ativo: false, inicio: '08:00', fim: '18:00' }
      return { ...g, [idx]: { ...atual, [campo]: val } }
    })

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto flex w-full max-w-2xl min-w-0 flex-col gap-6">
      <div className="min-w-0">
        <h1 className="flex items-center gap-2 text-2xl font-display font-bold text-surface-50">
          <Clock className="w-5 h-5 text-brand-400" /> Disponibilidade
        </h1>
        <p className="mt-0.5 text-sm font-body text-surface-400">
          Configure os dias e horários em que você atende.
        </p>
      </div>

      <Card className="w-full min-w-0 overflow-hidden">
        <CardHeader className="px-4 sm:px-5">
          <p className="text-sm font-body font-semibold text-surface-100">Horários de atendimento</p>
          <p className="text-xs font-body text-surface-500 mt-0.5">
            Ative os dias que você trabalha e defina o início e fim do atendimento.
          </p>
        </CardHeader>

        <CardBody className="p-4 sm:p-5">
          {isLoading || isLoadingBarbeiro ? (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-surface-800 animate-shimmer" />
              ))}
            </div>
          ) : !barbeiroId ? (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200">
              Não encontramos o seu cadastro de barbeiro nesta barbearia.
            </div>
          ) : (
            <div className="flex min-w-0 flex-col gap-3">
              {DIAS.map(({ idx, label }) => {
                const dia = grade[idx]
                return (
                  <div key={idx} className={cn(
                    'flex min-w-0 flex-col gap-3 rounded-lg border p-3 transition-all duration-150 sm:flex-row sm:items-center',
                    dia?.ativo
                      ? 'bg-brand-500/5 border-brand-500/25'
                      : 'bg-surface-800/50 border-surface-800',
                  )}>
                    <div className="flex min-w-0 items-center gap-3 sm:w-44 sm:shrink-0">
                      {/* Toggle */}
                      <button
                        onClick={() => toggle(idx)}
                        className={cn(
                          'relative h-5 w-10 shrink-0 rounded-full transition-all duration-200',
                          dia?.ativo ? 'bg-brand-500' : 'bg-surface-700',
                        )}
                      >
                        <span className={cn(
                          'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-200',
                          dia?.ativo ? 'left-5' : 'left-0.5',
                        )} />
                      </button>

                      {/* Label */}
                      <span className={cn(
                        'min-w-0 flex-1 truncate text-sm font-body',
                        dia?.ativo ? 'text-surface-100 font-medium' : 'text-surface-500',
                      )}>
                        {label}
                      </span>
                    </div>

                    {/* Horários */}
                    {dia?.ativo ? (
                      <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                        <input
                          type="time"
                          value={dia.inicio}
                          onChange={e => setHorario(idx, 'inicio', e.target.value)}
                          className="h-9 min-w-0 w-full rounded-md border border-surface-700 bg-surface-900 px-2 text-sm font-body text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 [color-scheme:dark]"
                        />
                        <span className="text-surface-600 text-sm">até</span>
                        <input
                          type="time"
                          value={dia.fim}
                          onChange={e => setHorario(idx, 'fim', e.target.value)}
                          className="h-9 min-w-0 w-full rounded-md border border-surface-700 bg-surface-900 px-2 text-sm font-body text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 [color-scheme:dark]"
                        />
                      </div>
                    ) : (
                      <span className="text-xs font-body text-surface-600 italic">Não atendo</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardBody>

        <CardFooter className="px-4 sm:px-5">
          <Button variant="primary" size="md" loading={isPending}
            className="w-full sm:w-auto"
            leftIcon={<Save className="w-4 h-4" />}
            onClick={() => salvar()}
            disabled={!barbeiroId}>
            Salvar disponibilidade
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
