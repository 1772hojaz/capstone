import { Package, Search, ShoppingCart, Users, FileText } from 'lucide-react';
import { Button } from '../ui/button';

interface EmptyStateProps {
  icon?: 'package' | 'search' | 'cart' | 'users' | 'file';
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

const EmptyState = ({
  icon = 'package',
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: EmptyStateProps) => {
  const icons = {
    package: Package,
    search: Search,
    cart: ShoppingCart,
    users: Users,
    file: FileText,
  };

  const Icon = icons[icon];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {/* Icon */}
      <div className="rounded-full bg-gray-100 p-6 mb-4">
        <Icon className="h-12 w-12 text-gray-400" />
      </div>

      {/* Title */}
      <h3 className="heading-4 mb-2">{title}</h3>

      {/* Description */}
      <p className="body text-gray-600 max-w-md mb-6">{description}</p>

      {/* Actions */}
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {actionLabel && onAction && (
            <Button onClick={onAction}>{actionLabel}</Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="outline" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export { EmptyState };

