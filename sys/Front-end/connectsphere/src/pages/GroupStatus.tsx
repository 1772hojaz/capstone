import { ArrowLeft, Users, Clock, DollarSign, MapPin, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function GroupStatus() {
  const navigate = useNavigate();

  const groupDetails = {
    id: 1,
    name: 'Premium Coffee Beans (Brazil)',
    description: 'High-quality Brazilian coffee beans sourced from sustainable farms. Perfect for espresso and drip coffee.',
    status: 'ready_for_pickup',
    progress: '5/5',
    dueDate: '2024-01-15',
    price: '$45.00',
    members: 5,
    targetMembers: 5,
    savings: '$12.00 per member',
    pickupLocation: 'Harare Central Branch',
    orderStatus: 'Ready for pickup - show QR code at branch',
    participants: [
      { id: 1, name: 'Alice Johnson', status: 'confirmed', joinedDate: '2024-01-10' },
      { id: 2, name: 'Bob Williams', status: 'confirmed', joinedDate: '2024-01-11' },
      { id: 3, name: 'Charlie Davis', status: 'confirmed', joinedDate: '2024-01-12' },
      { id: 4, name: 'Diana Martinez', status: 'confirmed', joinedDate: '2024-01-13' },
      { id: 5, name: 'You', status: 'confirmed', joinedDate: '2024-01-14' },
    ]
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'forming': return 'bg-blue-100 text-blue-700';
      case 'active': return 'bg-green-100 text-green-700';
      case 'payment_pending': return 'bg-yellow-100 text-yellow-700';
      case 'processing': return 'bg-purple-100 text-purple-700';
      case 'ready_for_pickup': return 'bg-orange-100 text-orange-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      default: return 'bg-red-100 text-red-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'forming': return 'Forming Group';
      case 'active': return 'Active';
      case 'payment_pending': return 'Payment Due';
      case 'processing': return 'Processing';
      case 'ready_for_pickup': return 'Ready for Pickup';
      case 'completed': return 'Completed';
      default: return 'Cancelled';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/groups')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-md">
              <span className="text-2xl">☕</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{groupDetails.name}</h1>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                {groupDetails.members} members
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Group Status Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Group Status</h2>
              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(groupDetails.status)}`}>
                {getStatusText(groupDetails.status)}
              </span>
            </div>
            {groupDetails.status === 'ready_for_pickup' && (
              <button
                onClick={() => navigate('/groups')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Show QR Code
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Participants</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{groupDetails.progress}</p>
              <p className="text-sm text-gray-600">Goal reached!</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Due Date</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{groupDetails.dueDate}</p>
              <p className="text-sm text-gray-600">Completed on time</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Total Savings</span>
              </div>
              <p className="text-2xl font-bold text-green-600">${groupDetails.savings.split(' ')[0]}</p>
              <p className="text-sm text-gray-600">per member</p>
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Product Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed">{groupDetails.description}</p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Price per Person:</span>
                <span className="font-semibold text-gray-900">{groupDetails.price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pickup Location:</span>
                <span className="font-semibold text-gray-900 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {groupDetails.pickupLocation}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Order Status:</span>
                <span className="font-semibold text-orange-600">{groupDetails.orderStatus}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Group Participants</h2>
          <div className="space-y-3">
            {groupDetails.participants.map((participant) => (
              <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {participant.name[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{participant.name}</p>
                    <p className="text-sm text-gray-600">Joined {participant.joinedDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    participant.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {participant.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                  </span>
                  {participant.name === 'You' && (
                    <span className="text-xs text-blue-600 font-medium">You</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next Steps */}
        {groupDetails.status === 'ready_for_pickup' && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Ready for Pickup!</h3>
                <p className="text-gray-700 mb-3">
                  Your order is ready for collection at {groupDetails.pickupLocation}.
                  Bring your phone with the QR code to collect your items.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => navigate('/groups')}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition font-medium"
                  >
                    Show QR Code
                  </button>
                  <button
                    onClick={() => navigate('/groups')}
                    className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition"
                  >
                    Back to Groups
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Group Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Group Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/groups')}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              <Users className="w-4 h-4" />
              View All Groups
            </button>
            <button
              onClick={() => navigate('/trader')}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              <DollarSign className="w-4 h-4" />
              Find New Deals
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
