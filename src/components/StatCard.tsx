import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: string
  description?: string
  variant?: 'default' | 'success' | 'warning' | 'danger'
  iconColor?: string
  iconBg?: string
  className?: string
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  variant = 'default',
  iconColor,
  iconBg,
  className,
}: StatCardProps) {
  const variantStyles = {
    default: 'bg-[#1e3a5f] text-white',
    success: 'bg-[#10b981] text-white',
    warning: 'bg-[#f59e0b] text-white',
    danger: 'bg-[#ef4444] text-white',
  }

  const iconWrapperClass = iconBg ? cn(iconBg, 'p-3 rounded-lg') : cn('p-3 rounded-lg', variantStyles[variant])
  const iconClass = iconColor ? cn(iconColor) : ''

  const displayTrend = description || trend

  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-sm border border-slate-200 p-5',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-2">{title}</p>
          <p className="text-2xl font-semibold text-slate-800">{value}</p>
          {displayTrend && (
            <p className="text-xs text-slate-400 mt-1">{displayTrend}</p>
          )}
        </div>
        <div className={iconWrapperClass}>
          <Icon size={24} className={iconClass} />
        </div>
      </div>
    </div>
  )
}
