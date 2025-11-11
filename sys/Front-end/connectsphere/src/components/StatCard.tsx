import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown, ArrowUpRight, Sparkles } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'accent' | 'primary';
  trend?: number;
  subtitle?: string;
  sparkline?: number[];
  loading?: boolean;
  onClick?: () => void;
}

const colorClasses = {
  blue: {
    bg: 'from-blue-500/10 to-blue-600/10',
    icon: 'from-blue-500 to-blue-600',
    glow: 'shadow-blue-500/25',
    text: 'text-blue-600 dark:text-blue-400',
    trend: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
  },
  green: {
    bg: 'from-green-500/10 to-green-600/10',
    icon: 'from-green-500 to-green-600',
    glow: 'shadow-green-500/25',
    text: 'text-green-600 dark:text-green-400',
    trend: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
  },
  red: {
    bg: 'from-red-500/10 to-red-600/10',
    icon: 'from-red-500 to-red-600',
    glow: 'shadow-red-500/25',
    text: 'text-red-600 dark:text-red-400',
    trend: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
  },
  yellow: {
    bg: 'from-amber-500/10 to-amber-600/10',
    icon: 'from-amber-500 to-amber-600',
    glow: 'shadow-amber-500/25',
    text: 'text-amber-600 dark:text-amber-400',
    trend: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
  },
  purple: {
    bg: 'from-purple-500/10 to-purple-600/10',
    icon: 'from-purple-500 to-purple-600',
    glow: 'shadow-purple-500/25',
    text: 'text-purple-600 dark:text-purple-400',
    trend: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
  },
  accent: {
    bg: 'from-accent-500/10 to-accent-600/10',
    icon: 'from-accent-500 to-accent-600',
    glow: 'shadow-accent-500/25',
    text: 'text-accent-600 dark:text-accent-400',
    trend: 'bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300'
  },
  primary: {
    bg: 'from-primary-500/10 to-primary-600/10',
    icon: 'from-primary-500 to-primary-600',
    glow: 'shadow-primary-500/25',
    text: 'text-primary-600 dark:text-primary-400',
    trend: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
  },
};

const StatCard = ({ 
  title, 
  value, 
  icon, 
  color = 'accent', 
  trend, 
  subtitle, 
  sparkline,
  loading,
  onClick 
}: StatCardProps) => {
  const colors = colorClasses[color];
  
  return (
    <div 
      onClick={onClick}
      className={`
        relative overflow-hidden 
        bg-white dark:bg-neutral-900
        rounded-lg 
        border border-neutral-200 dark:border-neutral-800
        shadow-sm hover:shadow-md
        transition-all duration-300 
        p-5 
        group 
        ${onClick ? 'cursor-pointer' : ''}
        hover:translate-y-[-1px]
      `}
    >
      {/* Content */}
      <div className="relative flex items-start justify-between">
        <div className="flex-1 space-y-2">
          {/* Title */}
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              {title}
            </p>
          </div>
          
          {/* Value */}
          {loading ? (
            <div className="h-9 w-24 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></div>
          ) : (
            <p className="text-2xl font-bold font-display text-neutral-900 dark:text-neutral-100">
              {value}
            </p>
          )}
          
          {/* Trend */}
          {trend !== undefined && (
            <div className="flex items-center gap-2">
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${trend >= 0 ? colorClasses.green.trend : colorClasses.red.trend}`}>
                {trend >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>{trend >= 0 ? '+' : ''}{trend}%</span>
              </div>
            </div>
          )}
          
          {/* Subtitle */}
          {subtitle && !trend && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{subtitle}</p>
          )}
        </div>
        
        {/* Icon */}
        <div className="relative p-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded">
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
