import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'indigo';
  trend?: number; // Percentage change
  subtitle?: string;
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white',
    border: 'border-blue-100',
    text: 'text-blue-600'
  },
  green: {
    bg: 'bg-green-50',
    icon: 'bg-gradient-to-br from-green-500 to-green-600 text-white',
    border: 'border-green-100',
    text: 'text-green-600'
  },
  red: {
    bg: 'bg-red-50',
    icon: 'bg-gradient-to-br from-red-500 to-red-600 text-white',
    border: 'border-red-100',
    text: 'text-red-600'
  },
  yellow: {
    bg: 'bg-yellow-50',
    icon: 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-white',
    border: 'border-yellow-100',
    text: 'text-yellow-600'
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'bg-gradient-to-br from-purple-500 to-purple-600 text-white',
    border: 'border-purple-100',
    text: 'text-purple-600'
  },
  indigo: {
    bg: 'bg-indigo-50',
    icon: 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white',
    border: 'border-indigo-100',
    text: 'text-indigo-600'
  },
};

const StatCard = ({ title, value, icon, color = 'blue', trend, subtitle }: StatCardProps) => {
  const colors = colorClasses[color];
  
  return (
    <div className={`relative overflow-hidden bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 border ${colors.border} group cursor-pointer`}>
      {/* Background Pattern */}
      <div className={`absolute top-0 right-0 w-32 h-32 ${colors.bg} rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity duration-300`}></div>
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          
          {/* Trend or Subtitle */}
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {trend >= 0 ? (
                <>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-green-600">+{trend}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-red-600">{trend}%</span>
                </>
              )}
              <span className="text-sm text-gray-500 ml-1">vs last month</span>
            </div>
          )}
          
          {subtitle && !trend && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        
        <div className={`p-3 rounded-xl ${colors.icon} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
