import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ErrorAlertProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  variant?: 'inline' | 'banner' | 'card';
  className?: string;
}

const ErrorAlert = ({
  title = 'Error',
  message,
  onRetry,
  onDismiss,
  variant = 'inline',
  className,
}: ErrorAlertProps) => {
  const variantStyles = {
    inline: 'rounded-lg p-4',
    banner: 'rounded-none p-4',
    card: 'rounded-xl p-6 shadow-lg',
  };

  return (
    <div
      className={cn(
        'bg-danger-50 border border-danger-200',
        variantStyles[variant],
        className
      )}
      role="alert"
    >
      <div className="flex gap-3">
        <AlertCircle className="h-5 w-5 text-danger-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-danger-900">{title}</h3>
          <p className="text-sm text-danger-800 mt-1">{message}</p>
          
          {/* Actions */}
          {(onRetry || onDismiss) && (
            <div className="flex items-center gap-2 mt-4">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-danger-700 bg-danger-100 hover:bg-danger-200 rounded-lg transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-danger-700 hover:bg-danger-100 rounded-lg transition-colors"
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Close Button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 rounded-lg p-1 text-danger-600 hover:bg-danger-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export { ErrorAlert };

