import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'gray';
  className?: string;
}

const Spinner = ({ size = 'md', color = 'primary', className }: SpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  const colorClasses = {
    primary: 'text-primary-600',
    white: 'text-white',
    gray: 'text-gray-400',
  };

  return (
    <Loader2
      className={cn(
        'animate-spin',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
    />
  );
};

// Loading overlay component
interface LoadingOverlayProps {
  message?: string;
}

const LoadingOverlay = ({ message = 'Loading...' }: LoadingOverlayProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div className="bg-white rounded-lg p-6 shadow-xl flex flex-col items-center gap-4">
      <Spinner size="lg" />
      <p className="text-sm font-medium text-gray-700">{message}</p>
    </div>
  </div>
);

export { Spinner, LoadingOverlay };


