import { cn } from '@/lib/utils'

export interface TableColumn<T> {
  key: string
  title: string
  dataIndex: keyof T
  render?: (value: T[keyof T], record: T) => React.ReactNode
  width?: string | number
  align?: 'left' | 'center' | 'right'
}

interface TableProps<T> {
  columns: TableColumn<T>[]
  data: T[]
  rowKey?: keyof T | ((record: T) => string)
  className?: string
  emptyText?: string
  loading?: boolean
}

export default function Table<T extends object>({
  columns,
  data,
  rowKey = 'id' as keyof T,
  className,
  emptyText = '暂无数据',
  loading = false,
}: TableProps<T>) {
  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record)
    }
    const val = record[rowKey]
    return val !== undefined && val !== null ? String(val) : String(index)
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-slate-600 uppercase bg-slate-50 border-b border-slate-200">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3 font-medium',
                  col.align === 'center' && 'text-center',
                  col.align === 'right' && 'text-right',
                  col.width && `w-[${col.width}]`
                )}
                style={col.width ? { width: typeof col.width === 'number' ? `${col.width}px` : col.width } : undefined}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-500">
                加载中...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-500">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((record, index) => (
              <tr
                key={getRowKey(record, index)}
                className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
              >
                {columns.map((col) => {
                  const value = record[col.dataIndex] as T[keyof T]
                  return (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-3',
                        col.align === 'center' && 'text-center',
                        col.align === 'right' && 'text-right'
                      )}
                    >
                      {col.render ? col.render(value, record) : String(value ?? '')}
                    </td>
                  )
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
