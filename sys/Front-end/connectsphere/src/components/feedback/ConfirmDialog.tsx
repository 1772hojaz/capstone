import { AlertTriangle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'warning',
  isLoading = false,
}: ConfirmDialogProps) => {
  const variantStyles = {
    danger: {
      icon: 'text-danger-600 bg-danger-100',
      button: 'destructive' as const,
    },
    warning: {
      icon: 'text-warning-600 bg-warning-100',
      button: 'warning' as const,
    },
    info: {
      icon: 'text-info-600 bg-info-100',
      button: 'info' as const,
    },
  };

  const style = variantStyles[variant];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showCloseButton={false}
      closeOnBackdrop={!isLoading}
    >
      <div className="flex flex-col items-center text-center py-4">
        {/* Icon */}
        <div className={`rounded-full p-3 mb-4 ${style.icon}`}>
          <AlertTriangle className="h-6 w-6" />
        </div>

        {/* Title */}
        <h2 className="heading-3 mb-2">{title}</h2>

        {/* Description */}
        <p className="body text-gray-600 mb-6">{description}</p>

        {/* Actions */}
        <div className="flex gap-3 w-full">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            fullWidth
          >
            {cancelLabel}
          </Button>
          <Button
            variant={style.button}
            onClick={onConfirm}
            loading={isLoading}
            disabled={isLoading}
            fullWidth
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export { ConfirmDialog };


