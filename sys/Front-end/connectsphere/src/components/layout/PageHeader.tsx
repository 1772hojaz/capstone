import { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import Breadcrumbs from '../navigation/Breadcrumbs';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  className?: string;
}

/**
 * PageHeader - Standard header for all pages
 * Includes title, optional description, breadcrumbs, and action buttons
 */
const PageHeader = ({
  title,
  description,
  breadcrumbs,
  actions,
  className
}: PageHeaderProps) => {
  return (
    <div className={cn('space-y-4 mb-6', className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs items={breadcrumbs} />
      )}

      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="heading-2">{title}</h1>
          {description && (
            <p className="body-sm text-gray-600">{description}</p>
          )}
        </div>

        {/* Action Buttons */}
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;

