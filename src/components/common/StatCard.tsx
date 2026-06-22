import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type TrendType = 'up' | 'down' | 'neutral';

type StatCardProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  iconBgColor?: string;
  iconColor?: string;
  className?: string;
};

export default function StatCard({
  title,
  value,
  icon,
  trend,
  trendLabel,
  iconBgColor = 'bg-primary/10',
  iconColor = 'text-primary',
  className,
}: StatCardProps) {
  const getTrendType = (): TrendType => {
    if (!trend) return 'neutral';
    return trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral';
  };

  const trendType = getTrendType();

  const trendStyles = {
    up: 'text-success',
    down: 'text-danger',
    neutral: 'text-gray-500',
  };

  const TrendIcon = trendType === 'up' ? TrendingUp : trendType === 'down' ? TrendingDown : Minus;

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {trend !== undefined && (
            <div className={cn('mt-3 flex items-center gap-1 text-sm', trendStyles[trendType])}>
              <TrendIcon size={16} />
              <span className="font-medium">
                {trend > 0 ? '+' : ''}
                {trend}%
              </span>
              {trendLabel && <span className="text-gray-500 ml-1">{trendLabel}</span>}
            </div>
          )}
        </div>
        <div
          className={cn(
            'flex items-center justify-center w-12 h-12 rounded-lg',
            iconBgColor,
            iconColor
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
