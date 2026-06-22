// ─────────────────────────────────────────────────────────────────────────────
// Monky Barber — Tipos TypeScript
// Baseados na API_REFERENCIA.md
// ─────────────────────────────────────────────────────────────────────────────

// ─── Enums ───────────────────────────────────────────────────────────────────

export type Papel = 'ADMIN' | 'BARBEIRO' | 'CLIENTE'

export type StatusAgendamento =
  | 'PENDENTE'
  | 'CONFIRMADO'
  | 'CONCLUIDO'
  | 'CANCELADO'
  | 'NAO_COMPARECEU'

export type StatusAssinatura =
  | 'ATIVA'
  | 'CANCELADA'
  | 'EXPIRADA'
  | 'INADIMPLENTE'

export type StatusPagamento =
  | 'PENDENTE'
  | 'APROVADO'
  | 'RECUSADO'
  | 'CANCELADO'
  | 'REEMBOLSADO'

export type DiaSemana = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom'

// ─── Horário de Funcionamento ─────────────────────────────────────────────────

export interface HorarioDia {
  abre: string   // "08:00"
  fecha: string  // "18:00"
}

export type HorarioFuncionamento = Record<DiaSemana, HorarioDia | null>

// ─── Barbearia ────────────────────────────────────────────────────────────────

export interface Barbearia {
  id: string
  nome: string
  slug: string
  logo: string | null
  banner: string | null
  telefone: string | null
  instagram: string | null
  facebook: string | null
  endereco: string | null
  horarioFuncionamento: HorarioFuncionamento | null
  criadoEm: string
  atualizadoEm: string
}

export interface CriarBarbeariaInput {
  nome: string
  slug: string
  telefone?: string
  instagram?: string
  facebook?: string
  endereco?: string
}

export interface AtualizarBarbeariaInput {
  nome?: string
  telefone?: string
  instagram?: string
  facebook?: string
  endereco?: string
  logo?: string
  banner?: string
  horarioFuncionamento?: HorarioFuncionamento
}

// ─── Usuário ──────────────────────────────────────────────────────────────────

export interface Usuario {
  id: string
  nome: string
  email: string
  telefone: string | null
  papel: Papel
  ativo?: boolean
  criadoEm: string
  atualizadoEm: string
}

export interface UsuarioResumido {
  id: string
  nome: string
  email: string
  papel: Papel
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  usuario: UsuarioResumido
}

export interface LoginInput {
  email: string
  senha: string
}

export interface CadastroInput {
  nome: string
  email: string
  senha: string
  telefone?: string
}

export interface EsqueceuSenhaInput {
  email: string
}

export interface RedefinirSenhaInput {
  token: string
  novaSenha: string
}

export interface RefreshTokenInput {
  refreshToken: string
}

export interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
}

// ─── Barbeiro ─────────────────────────────────────────────────────────────────

export interface Barbeiro {
  id: string
  barbeariaId: string
  usuarioId: string
  foto: string | null
  bio: string | null
  especialidades?: string[]
  ativo?: boolean
  usuario: Usuario
  criadoEm: string
  atualizadoEm: string
}

export interface BarbeiroResumido {
  id: string
  foto: string | null
  usuario: Pick<Usuario, 'id' | 'nome'>
}

export interface CriarBarbeiroInput {
  nome: string
  email: string
  senha: string
  foto?: string
  bio?: string
}

export interface AtualizarBarbeiroInput {
  nome?: string
  foto?: string
  bio?: string
  ativo?: boolean
}

// ─── Disponibilidade do Barbeiro ──────────────────────────────────────────────

export interface DisponibilidadeDia {
  diaSemana: number  // 0 = domingo, 6 = sábado
  horaInicio: string // "08:00"
  horaFim: string    // "18:00"
}

export interface Disponibilidade {
  id: string
  barbeiroId: string
  diaSemana: number
  horaInicio: string
  horaFim: string
}

export interface DefinirDisponibilidadeInput {
  disponibilidades: DisponibilidadeDia[]
}

// ─── Folga / Bloqueio ─────────────────────────────────────────────────────────

export interface Folga {
  id: string
  barbeiroId: string
  data: string       // "2025-06-10"
  motivo: string | null
  criadoEm: string
}

export interface CriarFolgaInput {
  data: string
  motivo?: string
}

export interface Bloqueio {
  id: string
  barbeiroId: string
  inicio: string     // ISO datetime sem Z
  fim: string
  motivo: string | null
}

export interface CriarBloqueioInput {
  inicio: string
  fim: string
  motivo?: string
}

// ─── Serviço ──────────────────────────────────────────────────────────────────

export interface Servico {
  id: string
  barbeariaId: string
  nome: string
  descricao: string | null
  preco: string      // string decimal — usar Number() antes de operar
  duracao: number    // minutos
  ativo: boolean
  criadoEm: string
  atualizadoEm: string
}

export interface ServicoResumido {
  id: string
  nome: string
  preco: string
  duracao: number
}

export interface CriarServicoInput {
  nome: string
  preco: number
  duracao: number
  descricao?: string
}

export interface AtualizarServicoInput {
  nome?: string
  preco?: number
  duracao?: number
  descricao?: string
  ativo?: boolean
}

// ─── Cliente ──────────────────────────────────────────────────────────────────

export interface Cliente {
  id: string
  barbeariaId: string
  usuarioId: string
  telefone?: string | null
  usuario: Usuario
  criadoEm: string
  atualizadoEm: string
}

export interface ClienteResumido {
  id: string
  usuario: Pick<Usuario, 'id' | 'nome' | 'email'>
}

export interface AtualizarClienteInput {
  nome?: string
  telefone?: string
}

// ─── Horários Disponíveis ─────────────────────────────────────────────────────

export interface HorarioDisponivel {
  inicio: string   // ISO datetime sem Z
  fim: string
}

export interface HorariosDisponiveisParams {
  barbeiroId: string
  servicoId: string
  data: string     // "YYYY-MM-DD"
}

// ─── Agendamento ─────────────────────────────────────────────────────────────

export interface Agendamento {
  id: string
  barbeariaId: string
  clienteId: string
  barbeiroId: string
  servicoId: string
  inicio: string
  fim: string
  status: StatusAgendamento
  barbeiro: BarbeiroResumido
  servico: ServicoResumido
  cliente: ClienteResumido
  criadoEm: string
  atualizadoEm: string
}

export interface CriarAgendamentoInput {
  barbeiroId: string
  servicoId: string
  inicio: string   // ISO datetime sem Z
}

export interface AtualizarStatusAgendamentoInput {
  status: StatusAgendamento
}

export interface FiltrosAgendamento {
  data?: string
  status?: StatusAgendamento
}

// ─── Plano ────────────────────────────────────────────────────────────────────

export interface PlanoServico {
  quantidade: number
  servico: Pick<Servico, 'id' | 'nome' | 'duracao'>
}

export interface Plano {
  id: string
  barbeariaId: string
  nome: string
  descricao: string | null
  preco: string      // string decimal
  ativo: boolean
  planosServicos: PlanoServico[]
  criadoEm: string
  atualizadoEm: string
}

export interface CriarPlanoInput {
  nome: string
  preco: number
  servicos: Array<{ servicoId: string; quantidade: number }>
  descricao?: string
}

export interface AtualizarPlanoInput {
  nome?: string
  preco?: number
  ativo?: boolean
  descricao?: string
  servicos?: Array<{ servicoId: string; quantidade: number }>
}

// ─── Assinatura ───────────────────────────────────────────────────────────────

export interface Assinatura {
  id: string
  barbeariaId: string
  clienteId: string
  planoId: string
  status: StatusAssinatura
  plano: Plano
  cliente: ClienteResumido
  criadoEm: string
  atualizadoEm: string
}


export interface PlanoUtilizacaoServico {
  assinaturaId: string
  servicoId: string
  nome: string
  duracao: number
  limite: number
  usados: number
  reservados: number
  disponiveis: number
  cobertoPeloPlano: boolean
}

export interface PlanoUtilizacao {
  assinaturaId: string
  plano: Pick<Plano, 'id' | 'nome'>
  status: StatusAssinatura
  periodo: { inicio: string; fim: string }
  servicos: PlanoUtilizacaoServico[]
}
export interface CriarAssinaturaInput {
  planoId: string
}

export interface AtualizarStatusAssinaturaInput {
  status: StatusAssinatura
}

// ─── Pagamento ────────────────────────────────────────────────────────────────

export interface Pagamento {
  id: string
  barbeariaId: string
  agendamentoId: string | null
  assinaturaId: string | null
  valor: string      // string decimal
  status: StatusPagamento
  linkPagamento: string | null
  preferenciaId: string | null
  criadoEm: string
  atualizadoEm: string
}

export interface GerarLinkPagamentoResponse {
  linkPagamento: string
  preferenciaId: string
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface BarbeiroRanking {
  barbeiro: BarbeiroResumido
  total: number
}

export interface ServicoRanking {
  servico: Pick<Servico, 'id' | 'nome'>
  total: number
}

export interface Dashboard {
  agendamentosHoje: number
  agendamentosMes: number
  clientesAtivos: number
  assinaturasAtivas: number
  receitaMes: string   // string decimal — usar Number() antes de exibir
  barbeirosRanking: BarbeiroRanking[]
  servicosRanking: ServicoRanking[]
}

// ─── Erros da API ─────────────────────────────────────────────────────────────

export interface ErroValidacao {
  campo: string
  mensagem: string
}

export interface ErroAPI {
  mensagem: string
  erros?: ErroValidacao[]
}

// ─── Helpers de UI ───────────────────────────────────────────────────────────

/** Mapeamento de StatusAgendamento para label legível */
export const LABEL_STATUS_AGENDAMENTO: Record<StatusAgendamento, string> = {
  PENDENTE:       'Pendente',
  CONFIRMADO:     'Confirmado',
  CONCLUIDO:      'Concluído',
  CANCELADO:      'Cancelado',
  NAO_COMPARECEU: 'Não Compareceu',
}

/** Mapeamento de StatusAssinatura para label legível */
export const LABEL_STATUS_ASSINATURA: Record<StatusAssinatura, string> = {
  ATIVA:        'Ativa',
  CANCELADA:    'Cancelada',
  EXPIRADA:     'Expirada',
  INADIMPLENTE: 'Inadimplente',
}

/** Mapeamento de StatusPagamento para label legível */
export const LABEL_STATUS_PAGAMENTO: Record<StatusPagamento, string> = {
  PENDENTE:    'Pendente',
  APROVADO:    'Aprovado',
  RECUSADO:    'Recusado',
  CANCELADO:   'Cancelado',
  REEMBOLSADO: 'Reembolsado',
}

/** Dias da semana para display */
export const LABEL_DIA_SEMANA: Record<DiaSemana, string> = {
  seg: 'Segunda-feira',
  ter: 'Terça-feira',
  qua: 'Quarta-feira',
  qui: 'Quinta-feira',
  sex: 'Sexta-feira',
  sab: 'Sábado',
  dom: 'Domingo',
}

/** Dias da semana por índice numérico (0 = domingo) */
export const DIA_SEMANA_POR_INDICE: Record<number, string> = {
  0: 'Domingo',
  1: 'Segunda-feira',
  2: 'Terça-feira',
  3: 'Quarta-feira',
  4: 'Quinta-feira',
  5: 'Sexta-feira',
  6: 'Sábado',
}
