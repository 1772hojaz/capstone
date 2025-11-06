import React from 'react';
import PageTemplate from '../components/PageTemplate';

const PricingPage = () => {
  const plans = [
    {
      name: 'Starter',
      price: '$29',
      period: '/month',
      features: [
        'Up to 5 team members',
        '50GB storage',
        'Basic analytics'
      ]
    },
    {
      name: 'Professional',
      price: '$79',
      period: '/month',
      features: [
        'Up to 15 team members',
        '200GB storage',
        'Advanced analytics',
        'Priority support'
      ]
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      features: [
        'Unlimited team members',
        '1TB+ storage',
        'Dedicated account manager',
        '24/7 support'
      ]
    }
  ];

  return (
    <PageTemplate title="Pricing Plans">
      <div className="py-12 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the perfect plan for your team's needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div key={index} className={`border rounded-lg p-6 ${index === 1 ? 'ring-2 ring-primary-500' : ''}`}>
              <h3 className="font-bold text-lg mb-2">{plan.name}</h3>
              <div className="mt-2">
                <span className="text-4xl font-bold text-primary-600">{plan.price}</span>
                <span className="text-gray-500">{plan.period}</span>
              </div>
              <ul className="space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <span className="text-primary-500 mr-2">✓</span>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <button className="mt-6 w-full bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg transition-colors">
                Get Started
              </button>
            </div>
          ))}
        </div>
      </div>
    </PageTemplate>
  );
};

export default PricingPage;
