import React from 'react';
import Button from './ui/Button';

const Hero = () => {
  return (
    <section className="bg-gradient-to-br from-primary-50 to-primary-100 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Welcome to ConnectSphere
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-10">
            Premium networking solution with elegant design and powerful features
          </p>
          <div className="flex justify-center space-x-4">
            <Button variant="primary" size="lg">
              Get Started
            </Button>
            <Button variant="ghost" size="lg">
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
