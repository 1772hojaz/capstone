import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'content' | 'prose' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * PageContainer - Standard wrapper for all pages
 * Ensures consistent padding, max-width, and spacing
 */
const PageContainer = ({ 
  children, 
  className,
  maxWidth = 'content',
  padding = 'md'
}: PageContainerProps) => {
  const maxWidthClasses = {
    content: 'max-w-content',
    prose: 'max-w-prose',
    full: 'max-w-full',
  };

  const paddingClasses = {
    none: '',
    sm: 'px-4 py-4 sm:px-6 sm:py-6',
    md: 'px-4 py-6 sm:px-6 sm:py-8',
    lg: 'px-4 py-8 sm:px-6 sm:py-12',
  };

  return (
    <div className={cn(
      'w-full mx-auto',
      maxWidthClasses[maxWidth],
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  );
};

export default PageContainer;



