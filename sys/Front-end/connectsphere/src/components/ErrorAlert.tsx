import { AlertTriangle, X } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
  onClose?: () => void;
  className?: string;
}

export const ErrorAlert = ({ message, onClose, className = '' }: ErrorAlertProps) => {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-red-800">{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-red-600 hover:text-red-800 ml-3 flex-shrink-0"
            aria-label="Close error"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorAlert;
