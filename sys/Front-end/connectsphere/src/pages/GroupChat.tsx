import { useState } from 'react';
import { ArrowLeft, Paperclip, Tag, Send, User, X, Flag, UserX, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: number;
  sender: string;
  avatar: string;
  content: string;
  time: string;
  isCurrentUser: boolean;
  userId?: number;
  productCard?: {
    name: string;
    image: string;
    description: string;
    discount: string;
    badge: string;
  };
  statusBadge?: {
    text: string;
    color: string;
  };
}

interface UserProfile {
  id: number;
  name: string;
  username: string;
  avatar: string;
  email: string;
  memberSince: string;
  groupsJoined: number;
  dealsCompleted: number;
  bio: string;
}

export default function GroupChat() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const userProfiles: { [key: number]: UserProfile } = {
    1: {
      id: 1,
      name: 'Alice Johnson',
      username: '@alice',
      avatar: '👤',
      email: 'alice@example.com',
      memberSince: 'March 2023',
      groupsJoined: 28,
      dealsCompleted: 45,
      bio: 'Deal hunter and tech enthusiast. Love organizing group buys for electronics.',
    },
    2: {
      id: 2,
      name: 'Bob Williams',
      username: '@bob',
      avatar: '👤',
      email: 'bob@example.com',
      memberSince: 'June 2023',
      groupsJoined: 15,
      dealsCompleted: 22,
      bio: 'Always looking for great deals on home appliances.',
    },
    3: {
      id: 3,
      name: 'Charlie Davis',
      username: '@charlie',
      avatar: '👤',
      email: 'charlie@example.com',
      memberSince: 'January 2024',
      groupsJoined: 12,
      dealsCompleted: 18,
      bio: 'Bargain shopper and coffee lover.',
    },
    4: {
      id: 4,
      name: 'Diana Martinez',
      username: '@diana',
      avatar: '👤',
      email: 'diana@example.com',
      memberSince: 'August 2023',
      groupsJoined: 20,
      dealsCompleted: 30,
      bio: 'Professional shopper. Love finding the best deals.',
    },
    5: {
      id: 5,
      name: 'Ethan Brown',
      username: '@ethan',
      avatar: '👤',
      email: 'ethan@example.com',
      memberSince: 'December 2023',
      groupsJoined: 10,
      dealsCompleted: 15,
      bio: 'Tech gadget enthusiast.',
    },
    0: {
      id: 0,
      name: 'Sarah Parker',
      username: '@sarahp',
      avatar: '👤',
      email: 'sarah.p@example.com',
      memberSince: 'January 2024',
      groupsJoined: 32,
      dealsCompleted: 52,
      bio: 'Passionate about finding great deals and organizing group buys. Love coffee, tech gadgets, and eco-friendly products.',
    },
  };

  const handleUserClick = (userId: number) => {
    if (userId === 0) {
      // Current user - navigate to profile page
      navigate('/profile');
    } else {
      // Other users - show modal
      setSelectedUser(userProfiles[userId]);
      setIsUserModalOpen(true);
    }
  };

  const closeUserModal = () => {
    setIsUserModalOpen(false);
    setSelectedUser(null);
  };

  const handleReportUser = () => {
    alert(`Report submitted for ${selectedUser?.name}`);
    closeUserModal();
  };

  const handleBlockUser = () => {
    alert(`${selectedUser?.name} has been blocked`);
    closeUserModal();
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      // Handle sending message
      setMessage('');
    }
  };

  const groupMembers = [
    { 
      id: 1,
      name: 'Premium Coffee Beans (Brazil)', 
      icon: '☕',
      count: 3,
      active: true 
    },
    { 
      id: 2,
      name: 'Smart LED Light Strips', 
      icon: '💡',
      count: null 
    },
    { 
      id: 3,
      name: 'High-Speed USB-C Hub', 
      icon: '🔌',
      count: null 
    },
    { 
      id: 4,
      name: 'Organic Snack Variety Pack', 
      icon: '🍿',
      count: 7 
    },
    { 
      id: 5,
      name: 'Noise-Cancelling Headphones', 
      icon: '🎧',
      count: null 
    },
    { 
      id: 6,
      name: 'Ergonomic Office Chair', 
      icon: '🪑',
      count: 12 
    },
    { 
      id: 7,
      name: 'Gaming Mouse Pad XL', 
      icon: '🖱️',
      count: null 
    },
    { 
      id: 8,
      name: 'Designer Succulent Planter', 
      icon: '🌱',
      count: null 
    },
    { 
      id: 9,
      name: 'Resistance Band Set', 
      icon: '🏋️',
      count: null 
    },
  ];

  const messages: Message[] = [
    {
      id: 1,
      sender: 'Alice',
      userId: 1,
      avatar: '👤',
      content: "Hey everyone! Saw a great deal on the new Smart TV. Thinking of organizing a group buy.",
      time: '10:00 AM',
      isCurrentUser: false,
    },
    {
      id: 2,
      sender: 'You',
      userId: 0,
      avatar: '👤',
      content: "Oh, I've been waiting for that! How much can we save?",
      time: '',
      isCurrentUser: true,
    },
    {
      id: 3,
      sender: 'Alice',
      userId: 1,
      avatar: '👤',
      content: "If we get 5 people, it's 30% off. Here's the product:",
      time: '10:04 AM',
      isCurrentUser: false,
      productCard: {
        name: 'QuantumView 65" 4K Smart TV',
        image: '/api/placeholder/400/300',
        description: 'Experience stunning visuals and smart features with the QuantumView 65-inch 4K Smart TV. Perfect for home entertainment.',
        discount: '30% OFF',
        badge: '5+',
      },
    },
    {
      id: 4,
      sender: 'Bob',
      userId: 2,
      avatar: '👤',
      content: "That's an amazing offer! I'm definitely in.",
      time: '10:15 AM',
      isCurrentUser: false,
    },
    {
      id: 5,
      sender: 'Charlie',
      userId: 3,
      avatar: '👤',
      content: "Me too! Need a new TV for my living room.",
      time: '10:18 AM',
      isCurrentUser: false,
    },
    {
      id: 6,
      sender: 'Alice',
      userId: 1,
      avatar: '👤',
      content: 'Deal status updated: October 26, 2023',
      time: '',
      isCurrentUser: false,
    },
    {
      id: 7,
      sender: 'Alice',
      userId: 1,
      avatar: '👤',
      content: "Great! We need 2 more. I'll update the deal status.",
      time: '10:35 AM',
      isCurrentUser: false,
      statusBadge: {
        text: '⚡ DEAL ACTIVE - Searching for 2 more buyers to reach the 30% discount tier.',
        color: 'blue',
      },
    },
    {
      id: 8,
      sender: 'You',
      userId: 0,
      avatar: '👤',
      content: "I'll share it in my network, maybe someone is interested!",
      time: '',
      isCurrentUser: true,
    },
    {
      id: 9,
      sender: 'Diana',
      userId: 4,
      avatar: '👤',
      content: "Just saw this! I'm in for the TV. Count me.",
      time: '10:40 AM',
      isCurrentUser: false,
    },
    {
      id: 10,
      sender: 'Alice',
      userId: 1,
      avatar: '👤',
      content: 'Awesome! Just one more to go!',
      time: '10:47 AM',
      isCurrentUser: false,
      statusBadge: {
        text: '💬 NEGOTIATING - Only 1 buyer needed to unlock 30% discount!',
        color: 'blue',
      },
    },
    {
      id: 11,
      sender: 'Ethan',
      userId: 5,
      avatar: '👤',
      content: "Is there still space for the TV deal? I'm interested.",
      time: '10:56 AM',
      isCurrentUser: false,
    },
    {
      id: 12,
      sender: 'Alice',
      userId: 1,
      avatar: '👤',
      content: "Yes, Ethan! You're the 5th! We've reached the minimum!",
      time: '10:57 AM',
      isCurrentUser: false,
      statusBadge: {
        text: '❤️ DEAL CLOSED! - Deal closed! We have 5 buyers, 30% discount secured.',
        color: 'red',
      },
    },
    {
      id: 13,
      sender: 'You',
      userId: 0,
      avatar: '👤',
      content: 'Fantastic news! What are the next steps for payment and shipping?',
      time: '',
      isCurrentUser: true,
    },
    {
      id: 14,
      sender: 'Alice',
      userId: 1,
      avatar: '👤',
      content: "I'll send out a consolidated order form and payment instructions shortly. Anticipating delivery in 3-7 business days.",
      time: '11:00 AM',
      isCurrentUser: false,
      statusBadge: {
        text: '📦 PROCESSING - Order processing for 5 Smart TVs. Payment instructions sent to all participants.',
        color: 'yellow',
      },
    },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Left Sidebar - Group List */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col shadow-lg">
        {/* Logo */}
        <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <button 
            onClick={() => navigate('/trader')}
            className="flex items-center gap-2 hover:opacity-90 transition"
          >
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span className="text-xl font-bold text-white">ConnectSphere</span>
          </button>
        </div>

        {/* Group Buys Label */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            My Group Chats
          </div>
        </div>

        {/* Groups List */}
        <div className="flex-1 overflow-y-auto scrollable-container">
          {groupMembers.map((group, index) => (
            <div
              key={index}
              className={`px-4 py-3.5 flex items-center justify-between cursor-pointer transition-all ${
                group.active
                  ? 'bg-blue-50 border-l-4 border-blue-600 shadow-sm'
                  : 'hover:bg-gray-50 border-l-4 border-transparent hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  group.active ? 'bg-gradient-to-br from-orange-400 to-orange-600' : 'bg-gradient-to-br from-gray-100 to-gray-200'
                }`}>
                  <span className="text-xl">{group.icon}</span>
                </div>
                <span className={`text-sm truncate ${group.active ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                  {group.name}
                </span>
              </div>
              {group.count !== null && group.count !== undefined && (
                <span className="ml-2 px-2.5 py-1 bg-blue-600 text-white text-xs font-bold rounded-full shadow-sm">
                  {group.count > 99 ? '99+' : group.count}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Start New Deal Button */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button 
            onClick={() => navigate('/create-group')}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg transition-all shadow-md hover:shadow-lg"
          >
            <span className="text-xl font-bold">+</span>
            Start New Deal
          </button>
        </div>

        {/* User Profile */}
        <div 
          onClick={() => handleUserClick(0)}
          className="p-4 border-t border-gray-200 flex items-center gap-3 bg-white cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">Sarah P.</p>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Online
            </p>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
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
                  <h1 className="text-lg font-bold text-gray-900">Premium Coffee Beans (Brazil)</h1>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    5 members online
                  </p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => navigate('/profile')}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 border border-gray-300"
            >
              <User className="w-4 h-4" />
              Profile
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-gradient-to-b from-gray-50 to-white scrollable-container">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isCurrentUser ? 'justify-end' : 'justify-start'}`}>
              {!msg.isCurrentUser && (
                <div className="flex gap-3 max-w-2xl">
                  <div 
                    onClick={() => msg.userId !== undefined && handleUserClick(msg.userId)}
                    className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <span className="text-sm text-white font-semibold">{msg.avatar}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1.5">
                      <span 
                        onClick={() => msg.userId !== undefined && handleUserClick(msg.userId)}
                        className="text-sm font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                      >
                        {msg.sender}
                      </span>
                      {msg.time && <span className="text-xs text-gray-400">{msg.time}</span>}
                    </div>
                    
                    {msg.content && !msg.content.includes('Deal status updated') && (
                      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm hover:shadow-md transition-shadow">
                        <p className="text-sm text-gray-800 leading-relaxed">{msg.content}</p>
                      </div>
                    )}

                    {msg.content.includes('Deal status updated') && (
                      <div className="text-xs text-gray-400 text-center py-3 flex items-center gap-2">
                        <div className="flex-1 h-px bg-gray-200"></div>
                        <span>{msg.content}</span>
                        <div className="flex-1 h-px bg-gray-200"></div>
                      </div>
                    )}

                    {msg.productCard && (
                      <div className="mt-3 bg-white border-2 border-gray-200 rounded-xl overflow-hidden max-w-md shadow-lg hover:shadow-xl transition-shadow">
                        <div className="relative">
                          <img
                            src={msg.productCard.image}
                            alt={msg.productCard.name}
                            className="w-full h-48 object-cover bg-gradient-to-br from-yellow-100 to-orange-200"
                          />
                          <div className="absolute top-3 right-3 flex gap-2">
                            <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full shadow-md">
                              {msg.productCard.badge}
                            </span>
                            <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-md">
                              {msg.productCard.discount}
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-gray-900 mb-2">{msg.productCard.name}</h3>
                          <p className="text-sm text-gray-600 mb-4 leading-relaxed">{msg.productCard.description}</p>
                          <button className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg">
                            View Deal Details
                          </button>
                        </div>
                      </div>
                    )}

                    {msg.statusBadge && (
                      <div className={`mt-3 px-4 py-3 rounded-xl text-sm font-medium shadow-md ${
                        msg.statusBadge.color === 'blue' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' :
                        msg.statusBadge.color === 'red' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' :
                        'bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900'
                      }`}>
                        {msg.statusBadge.text}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {msg.isCurrentUser && (
                <div className="flex gap-3 max-w-2xl items-end">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl rounded-br-sm px-4 py-3 shadow-md hover:shadow-lg transition-shadow">
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                    <span className="text-sm text-white font-semibold">{msg.avatar}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 px-6 py-4 shadow-lg">
          <div className="flex items-center gap-3">
            <button className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
              <Paperclip className="w-5 h-5" />
            </button>
            <button className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
              <Tag className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Discuss products, share deals, or negotiate prices..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 focus:bg-white transition-colors"
            />
            <button
              onClick={handleSendMessage}
              className="px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all flex items-center gap-2 font-medium shadow-md hover:shadow-lg"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>
      </div>

      {/* User Profile Modal */}
      {isUserModalOpen && selectedUser && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeUserModal}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white relative">
              <button
                onClick={closeUserModal}
                className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedUser.name}</h2>
                  <p className="text-blue-100">{selectedUser.username}</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Bio */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">About</h3>
                <p className="text-sm text-gray-600">{selectedUser.bio}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600">Groups Joined</p>
                  <p className="text-lg font-bold text-gray-900">{selectedUser.groupsJoined}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600">Deals Completed</p>
                  <p className="text-lg font-bold text-gray-900">{selectedUser.dealsCompleted}</p>
                </div>
              </div>

              {/* Member Since */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">Member since {selectedUser.memberSince}</p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => alert(`Send message to ${selectedUser.name}`)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  <Mail className="w-4 h-4" />
                  Send Direct Message
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleReportUser}
                    className="flex items-center justify-center gap-2 px-4 py-2 border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 transition text-sm font-medium"
                  >
                    <Flag className="w-4 h-4" />
                    Report
                  </button>
                  <button
                    onClick={handleBlockUser}
                    className="flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition text-sm font-medium"
                  >
                    <UserX className="w-4 h-4" />
                    Block
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
