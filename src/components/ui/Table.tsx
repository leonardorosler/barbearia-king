import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { SkeletonTable } from './Skeleton'

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

export interface TableColumn<T> {
  key:       string
  header:    ReactNode
  /** Renderiza a célula dado o item. Padrão: `item[key]` */
  render?:   (item: T, index: number) => ReactNode
  /** Classe CSS extra para a coluna (th e td) */
  className?: string
  /** Alinhamento da célula */
  align?:    'left' | 'center' | 'right'
}

export interface TableProps<T> {
  columns:       TableColumn<T>[]
  data:          T[]
  loading?:      boolean
  emptyMessage?: string
  emptyIcon?:    ReactNode
  /** Prop usada como key. Padrão: índice */
  rowKey?:       (item: T, index: number) => string | number
  /** Callback ao clicar em uma linha */
  onRowClick?:   (item: T) => void
  className?:    string
  /** Número de linhas do skeleton durante loading */
  skeletonRows?: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Alinhamento
// ─────────────────────────────────────────────────────────────────────────────

const alignClass = {
  left:   'text-left',
  center: 'text-center',
  right:  'text-right',
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────────────────────────────

export function Table<T extends object>({
  columns,
  data,
  loading       = false,
  emptyMessage  = 'Nenhum resultado encontrado.',
  emptyIcon,
  rowKey,
  onRowClick,
  className,
  skeletonRows  = 5,
}: TableProps<T>) {
  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-xl border border-surface-800 bg-surface-900',
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-body">
          {/* Cabeçalho */}
          <thead>
            <tr className="border-b border-surface-800">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3',
                    'text-xs font-semibold text-surface-400 uppercase tracking-wider',
                    alignClass[col.align ?? 'left'],
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Corpo */}
          <tbody>
            {loading ? (
              // Skeleton — renderiza dentro do tbody para não quebrar a estrutura
              <tr>
                <td colSpan={columns.length} className="p-0">
                  <SkeletonTable
                    rows={skeletonRows}
                    columns={columns.length}
                  />
                </td>
              </tr>
            ) : data.length === 0 ? (
              // Empty state
              <tr>
                <td colSpan={columns.length}>
                  <div className="flex flex-col items-center justify-center gap-3 py-12 text-surface-500">
                    {emptyIcon && (
                      <span className="text-surface-600">{emptyIcon}</span>
                    )}
                    <p className="text-sm">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              // Dados
              data.map((item, index) => (
                <tr
                  key={rowKey ? rowKey(item, index) : index}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                  className={cn(
                    'border-b border-surface-800/50 last:border-b-0',
                    'transition-colors duration-100',
                    onRowClick && 'cursor-pointer hover:bg-surface-800/50',
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-3.5 text-surface-200',
                        alignClass[col.align ?? 'left'],
                        col.className,
                      )}
                    >
                      {col.render
                        ? col.render(item, index)
                        : String((item as Record<string, unknown>)[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
