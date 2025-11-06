import React from 'react';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-white"> 
      <main className="flex-grow"> 
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
