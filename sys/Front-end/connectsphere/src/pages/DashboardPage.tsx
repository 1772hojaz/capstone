import React from 'react';
import PageTemplate from '../components/PageTemplate';

const DashboardPage = () => {
  return (
    <PageTemplate title="Dashboard Overview">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold text-lg mb-2">Recent Activity</h3>
          <p className="text-gray-600">Activity items will appear here</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold text-lg mb-2">Quick Stats</h3>
          <p className="text-gray-600">Key metrics will appear here</p>
        </div>
      </div>
    </PageTemplate>
  );
};

export default DashboardPage;
