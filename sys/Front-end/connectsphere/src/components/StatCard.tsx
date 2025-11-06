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
        bg-white/90 dark:bg-neutral-900/90 
        backdrop-blur-xl 
        rounded-2xl 
        border border-neutral-200/30 dark:border-neutral-800/50
        shadow-elevation-1 hover:shadow-elevation-3
        transition-all duration-500 
        p-6 
        group 
        ${onClick ? 'cursor-pointer' : ''}
        hover:scale-[1.02] active:scale-[0.98]
        hover:translate-y-[-2px]
      `}
    >
      {/* Premium Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-60 group-hover:opacity-80 transition-opacity duration-500`}></div>
      
      {/* Animated Glow Effect */}
      <div className="absolute -inset-px bg-gradient-to-r from-accent-500/0 via-accent-500/20 to-accent-500/0 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>
      
      {/* Content */}
      <div className="relative flex items-start justify-between">
        <div className="flex-1 space-y-2">
          {/* Title with Icon */}
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              {title}
            </p>
            {onClick && (
              <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            )}
          </div>
          
          {/* Value */}
          {loading ? (
            <div className="h-9 w-24 bg-gradient-to-r from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-600 rounded-lg animate-pulse"></div>
          ) : (
            <p className="text-3xl font-bold font-display bg-gradient-to-br from-neutral-900 to-neutral-700 dark:from-neutral-100 dark:to-neutral-200 bg-clip-text text-transparent">
              {value}
            </p>
          )}
          
          {/* Trend */}
          {trend !== undefined && (
            <div className="flex items-center gap-2">
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${trend >= 0 ? colorClasses.green.trend : colorClasses.red.trend}`}>
                {trend >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>{trend >= 0 ? '+' : ''}{trend}%</span>
              </div>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">vs last period</span>
            </div>
          )}
          
          {/* Subtitle */}
          {subtitle && !trend && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{subtitle}</p>
          )}
          
          {/* Sparkline */}
          {sparkline && (
            <div className="flex items-end gap-0.5 h-8 mt-3">
              {sparkline.map((value, i) => (
                <div
                  key={i}
                  className={`flex-1 bg-gradient-to-t ${colors.icon} rounded-t opacity-60 group-hover:opacity-100 transition-all duration-300`}
                  style={{ 
                    height: `${(value / Math.max(...sparkline)) * 100}%`,
                    animationDelay: `${i * 50}ms`
                  }}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Icon */}
        <div className="relative">
          <div className={`absolute inset-0 bg-gradient-to-br ${colors.icon} rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500`}></div>
          <div className={`relative p-3 bg-gradient-to-br ${colors.icon} text-white rounded-2xl shadow-lg ${colors.glow} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
            {icon}
          </div>
          <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-amber-400 opacity-0 group-hover:opacity-100 animate-pulse transition-opacity duration-300" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
