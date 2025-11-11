import React from 'react';

interface PageTemplateProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const PageTemplate = ({ title, children, className = '' }: PageTemplateProps) => {
  return (
    <div className={`p-6 max-w-7xl mx-auto ${className}`}>
      <h1 className="text-2xl font-bold mb-6">{title}</h1>
      <div className="bg-white rounded-lg shadow-sm p-6">
        {children}
      </div>
    </div>
  );
};

export default PageTemplate;
