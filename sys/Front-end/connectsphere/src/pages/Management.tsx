import { Users, ShoppingBag, DollarSign, Clock, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

interface ManagementCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonText: string;
  link: string;
}

const ManagementCard = ({ icon, title, description, buttonText, link }: ManagementCardProps) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 flex flex-col">
      <div className="text-blue-600 mb-4">{icon}</div>
      <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4 flex-grow">{description}</p>
      <button
        onClick={() => navigate(link)}
        className="inline-block text-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
      >
        {buttonText}
      </button>
    </div>
  );
};

const Management = () => {
  return (
    <Layout title="Management">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Management Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ManagementCard
            icon={<Users className="w-8 h-8" />}
            title="User Management"
            description="View, edit, or remove user accounts and manage their roles and permissions."
            buttonText="Manage Users"
            link="/users"
          />
          <ManagementCard
            icon={<ShoppingBag className="w-8 h-8" />}
            title="Group Moderation"
            description="Oversee and moderate group-buy listings, ensuring compliance and quality."
            buttonText="Moderate Groups"
            link="/moderation"
          />
          <ManagementCard
            icon={<DollarSign className="w-8 h-8" />}
            title="Ready for Payment"
            description="Process payments for groups that have reached their target and are ready for fulfillment."
            buttonText="Process Payments"
            link="/ready-for-payment"
          />
          <ManagementCard
            icon={<Clock className="w-8 h-8" />}
            title="Completed Groups"
            description="Manage groups where orders have been paid and are ready for trader pickup."
            buttonText="Manage Pickups"
            link="/completed-groups"
          />
          <ManagementCard
            icon={<TrendingUp className="w-8 h-8" />}
            title="Product Catalog"
            description="Update and manage the inventory of products available for group buying."
            buttonText="Edit Products"
            link="/products"
          />
          <ManagementCard
            icon={<DollarSign className="w-8 h-8" />}
            title="System Settings"
            description="Configure global platform settings, notifications, and error integration points."
            buttonText="Configure System"
            link="/settings"
          />
        </div>
      </div>
    </Layout>
  );
};

export default Management;