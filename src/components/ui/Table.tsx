import { KeyboardEvent, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { SkeletonTable } from './Skeleton'

export interface TableColumn<T> {
  key: string
  header: ReactNode
  render?: (item: T, index: number) => ReactNode
  className?: string
  align?: 'left' | 'center' | 'right'
  mobileLabel?: ReactNode
  hideOnMobile?: boolean
}

export interface TableProps<T> {
  columns: TableColumn<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  emptyIcon?: ReactNode
  rowKey?: (item: T, index: number) => string | number
  onRowClick?: (item: T) => void
  className?: string
  skeletonRows?: number
}

const alignClass = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

export function Table<T extends object>({
  columns,
  data,
  loading = false,
  emptyMessage = 'Nenhum resultado encontrado.',
  emptyIcon,
  rowKey,
  onRowClick,
  className,
  skeletonRows = 5,
}: TableProps<T>) {
  const getCellContent = (item: T, index: number, col: TableColumn<T>) =>
    col.render
      ? col.render(item, index)
      : String((item as Record<string, unknown>)[col.key] ?? '-')

  const visibleMobileColumns = columns.filter(col => !col.hideOnMobile)

  const emptyState = (
    <div className="flex min-h-40 flex-col items-center justify-center gap-3 px-4 py-10 text-center text-surface-500">
      {emptyIcon && (
        <span className="text-surface-600">{emptyIcon}</span>
      )}
      <p className="text-sm">{emptyMessage}</p>
    </div>
  )

  return (
    <div
      className={cn(
        'w-full min-w-0 overflow-hidden rounded-xl border border-surface-800 bg-surface-900 shadow-card',
        className,
      )}
    >
      <div className="min-w-0 overflow-hidden md:hidden">
        {loading ? (
          <div className="flex flex-col gap-3 p-3">
            {Array.from({ length: Math.min(skeletonRows, 3) }).map((_, index) => (
              <div key={index} className="w-full min-w-0 overflow-hidden rounded-lg border border-surface-800 bg-surface-950/50 p-4">
                <div className="h-4 w-2/3 animate-pulse rounded bg-surface-800" />
                <div className="mt-3 h-3 w-1/2 animate-pulse rounded bg-surface-800/80" />
                <div className="mt-4 h-9 w-full animate-pulse rounded bg-surface-800/60" />
              </div>
            ))}
          </div>
        ) : data.length === 0 ? (
          emptyState
        ) : (
          <div className="flex min-w-0 flex-col gap-3 p-3">
            {data.map((item, index) => {
              const clickableProps = onRowClick
                ? {
                    role: 'button',
                    tabIndex: 0,
                    onClick: () => onRowClick(item),
                    onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        onRowClick(item)
                      }
                    },
                  }
                : {}

              return (
                <div
                  key={rowKey ? rowKey(item, index) : index}
                  className={cn(
                    'flex w-full min-w-0 max-w-full flex-col gap-3 overflow-hidden rounded-lg border border-surface-800 bg-surface-950/45 p-4 transition-colors duration-150',
                    onRowClick && 'cursor-pointer hover:bg-surface-800/50 focus:outline-none focus:ring-2 focus:ring-brand-500/50',
                  )}
                  {...clickableProps}
                >
                  {visibleMobileColumns.map((col, colIndex) => {
                    const label = col.mobileLabel ?? col.header
                    const showLabel = Boolean(label)

                    return (
                      <div
                        key={col.key}
                        className={cn(
                          colIndex === 0
                            ? 'flex min-w-0 flex-col gap-1'
                            : 'flex min-w-0 flex-col gap-1.5',
                          col.key === 'acoes' && 'pt-1',
                        )}
                      >
                        {showLabel && colIndex !== 0 && (
                          <span className="text-xs font-semibold uppercase tracking-wider text-surface-500">
                            {label}
                          </span>
                        )}
                        <div
                          className={cn(
                            'min-w-0 max-w-full overflow-hidden break-words text-sm text-surface-200',
                            colIndex === 0 && 'text-base',
                            colIndex !== 0 && 'text-left',
                            col.key === 'acoes' && 'w-full [&>button]:w-full',
                            col.className,
                          )}
                        >
                          {getCellContent(item, index, col)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[680px] text-sm font-body">
          <thead>
            <tr className="border-b border-surface-800 bg-surface-950/40">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-xs font-semibold uppercase tracking-wider text-surface-400',
                    alignClass[col.align ?? 'left'],
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="p-0">
                  <SkeletonTable rows={skeletonRows} columns={columns.length} />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  {emptyState}
                </td>
              </tr>
            ) : (
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
                      {getCellContent(item, index, col)}
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
