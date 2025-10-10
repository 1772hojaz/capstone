import { useState } from 'react';
import { ArrowLeft, Paperclip, Tag, Send, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: number;
  sender: string;
  avatar: string;
  content: string;
  time: string;
  isCurrentUser: boolean;
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

export default function GroupChat() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');

  const groupMembers = [
    { name: 'Electronics Deal Cente', count: 142, active: true },
    { name: 'Home Appliance Hub', count: 98 },
    { name: 'Fashion Finds & Sales', count: 127 },
    { name: 'Outdoor Gear Collective', count: null },
    { name: 'Bookworm Bargains', count: 83 },
  ];

  const messages: Message[] = [
    {
      id: 1,
      sender: 'Alice',
      avatar: '👤',
      content: "Hey everyone! Saw a great deal on the new Smart TV. Thinking of organizing a group buy.",
      time: '10:00 AM',
      isCurrentUser: false,
    },
    {
      id: 2,
      sender: 'You',
      avatar: '👤',
      content: "Oh, I've been waiting for that! How much can we save?",
      time: '',
      isCurrentUser: true,
    },
    {
      id: 3,
      sender: 'Alice',
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
      avatar: '👤',
      content: "That's an amazing offer! I'm definitely in.",
      time: '10:15 AM',
      isCurrentUser: false,
    },
    {
      id: 5,
      sender: 'Charlie',
      avatar: '👤',
      content: "Me too! Need a new TV for my living room.",
      time: '10:18 AM',
      isCurrentUser: false,
    },
    {
      id: 6,
      sender: 'Alice',
      avatar: '👤',
      content: 'Deal status updated: October 26, 2023',
      time: '',
      isCurrentUser: false,
    },
    {
      id: 7,
      sender: 'Alice',
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
      avatar: '👤',
      content: "I'll share it in my network, maybe someone is interested!",
      time: '',
      isCurrentUser: true,
    },
    {
      id: 9,
      sender: 'Diana',
      avatar: '👤',
      content: "Just saw this! I'm in for the TV. Count me.",
      time: '10:40 AM',
      isCurrentUser: false,
    },
    {
      id: 10,
      sender: 'Alice',
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
      avatar: '👤',
      content: "Is there still space for the TV deal? I'm interested.",
      time: '10:56 AM',
      isCurrentUser: false,
    },
    {
      id: 12,
      sender: 'Alice',
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
      avatar: '👤',
      content: 'Fantastic news! What are the next steps for payment and shipping?',
      time: '',
      isCurrentUser: true,
    },
    {
      id: 14,
      sender: 'Alice',
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

  const handleSendMessage = () => {
    if (message.trim()) {
      // Handle sending message
      setMessage('');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Group List */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <button 
            onClick={() => navigate('/trader')}
            className="flex items-center gap-2 hover:opacity-80 transition"
          >
            <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span className="text-xl font-semibold text-gray-800">ConnectSphere</span>
          </button>
        </div>

        {/* Group Buys Label */}
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            Group Buys
          </div>
        </div>

        {/* Groups List */}
        <div className="flex-1 overflow-y-auto">
          {groupMembers.map((group, index) => (
            <div
              key={index}
              className={`px-4 py-3 flex items-center justify-between cursor-pointer transition ${
                group.active
                  ? 'bg-blue-50 border-l-4 border-blue-600'
                  : 'hover:bg-gray-50 border-l-4 border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-gray-400">#</span>
                <span className={`text-sm truncate ${group.active ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                  {group.name}
                </span>
              </div>
              {group.count !== null && group.count !== undefined && (
                <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs font-medium rounded-full">
                  {group.count}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Start New Deal Button */}
        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={() => navigate('/create-group')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            <span className="text-lg">+</span>
            Start New Deal
          </button>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200 flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-gray-600" />
          </div>
          <span className="text-sm font-medium text-gray-900">Sarah P.</span>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/groups')}
              className="p-1 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Premium Coffee Beans (Brazil)</h1>
              <p className="text-sm text-gray-500">5 online</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/profile')}
            className="absolute top-4 right-6 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition flex items-center gap-1"
          >
            <User className="w-4 h-4" />
            Profile
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isCurrentUser ? 'justify-end' : 'justify-start'}`}>
              {!msg.isCurrentUser && (
                <div className="flex gap-3 max-w-2xl">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">{msg.avatar}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900">{msg.sender}</span>
                      {msg.time && <span className="text-xs text-gray-500">{msg.time}</span>}
                    </div>
                    
                    {msg.content && !msg.content.includes('Deal status updated') && (
                      <div className="bg-gray-100 rounded-lg rounded-tl-none px-4 py-2">
                        <p className="text-sm text-gray-800">{msg.content}</p>
                      </div>
                    )}

                    {msg.content.includes('Deal status updated') && (
                      <div className="text-xs text-gray-400 text-center py-2">
                        {msg.content}
                      </div>
                    )}

                    {msg.productCard && (
                      <div className="mt-2 bg-white border border-gray-200 rounded-lg overflow-hidden max-w-md">
                        <div className="relative">
                          <img
                            src={msg.productCard.image}
                            alt={msg.productCard.name}
                            className="w-full h-48 object-cover bg-gradient-to-br from-yellow-100 to-orange-200"
                          />
                          <div className="absolute top-2 right-2 flex gap-2">
                            <span className="px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded">
                              {msg.productCard.badge}
                            </span>
                            <span className="px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded">
                              {msg.productCard.discount}
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 mb-2">{msg.productCard.name}</h3>
                          <p className="text-sm text-gray-600 mb-3">{msg.productCard.description}</p>
                          <button className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
                            View Deal
                          </button>
                        </div>
                      </div>
                    )}

                    {msg.statusBadge && (
                      <div className={`mt-2 px-3 py-2 rounded-lg text-sm ${
                        msg.statusBadge.color === 'blue' ? 'bg-blue-600 text-white' :
                        msg.statusBadge.color === 'red' ? 'bg-red-500 text-white' :
                        'bg-yellow-500 text-gray-900'
                      }`}>
                        {msg.statusBadge.text}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {msg.isCurrentUser && (
                <div className="flex gap-3 max-w-2xl items-end">
                  <div className="bg-blue-600 text-white rounded-lg rounded-br-none px-4 py-2">
                    <p className="text-sm">{msg.content}</p>
                  </div>
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">{msg.avatar}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-500 hover:text-gray-700 transition">
              <Paperclip className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 transition">
              <Tag className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Discuss products, share deals, or negotiate prices..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <button
              onClick={handleSendMessage}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
