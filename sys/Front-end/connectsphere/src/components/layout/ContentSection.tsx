import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface ContentSectionProps {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  background?: 'none' | 'white' | 'gray';
  border?: boolean;
  rounded?: boolean;
  shadow?: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * ContentSection - Reusable section wrapper for page content
 * Can be used with or without background, borders, shadows
 */
const ContentSection = ({
  children,
  title,
  description,
  className,
  spacing = 'md',
  background = 'none',
  border = false,
  rounded = false,
  shadow = 'none',
}: ContentSectionProps) => {
  const spacingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const backgroundClasses = {
    none: '',
    white: 'bg-white',
    gray: 'bg-gray-50',
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  };

  return (
    <section
      className={cn(
        spacingClasses[spacing],
        backgroundClasses[background],
        shadowClasses[shadow],
        border && 'border border-gray-200',
        rounded && 'rounded-lg',
        className
      )}
    >
      {/* Section Header */}
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h2 className="heading-4 mb-1">{title}</h2>
          )}
          {description && (
            <p className="body-sm text-gray-600">{description}</p>
          )}
        </div>
      )}

      {/* Section Content */}
      {children}
    </section>
  );
};

export default ContentSection;





