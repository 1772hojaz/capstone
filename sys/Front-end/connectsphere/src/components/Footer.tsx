import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Add your custom footer content here */}
        
        <div className="mt-12 pt-8 border-t border-gray-200 text-sm text-gray-500">
          {new Date().getFullYear()} ConnectSphere. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
