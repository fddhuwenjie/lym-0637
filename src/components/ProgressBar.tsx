import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  variant?: 'default' | 'success' | 'warning' | 'danger'
  showLabel?: boolean
  className?: string
}

const variantStyles = {
  default: 'bg-[#0ea5e9]',
  success: 'bg-[#10b981]',
  warning: 'bg-[#f59e0b]',
  danger: 'bg-[#ef4444]',
}

export default function ProgressBar({
  value,
  variant = 'default',
  showLabel = false,
  className,
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value))

  return (
    <div className={cn('w-full', className)}>
      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            variantStyles[variant]
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-slate-500 mt-1">{clampedValue}%</p>
      )}
    </div>
  )
}
