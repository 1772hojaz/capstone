import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    location_zone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const locationZones = ['Downtown', 'Uptown', 'Suburbs', 'EastSide', 'WestSide'];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const response = await authAPI.login({
          email: formData.email,
          password: formData.password
        });
        
        console.log('Login response:', response.data);
        
        // Store token and user info
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('userId', response.data.user_id);
        localStorage.setItem('isAdmin', response.data.is_admin);
        localStorage.setItem('locationZone', response.data.location_zone);
        
        // Redirect based on role
        if (response.data.is_admin) {
          navigate('/admin');
        } else {
          navigate('/trader');
        }
      } else {
        // Register
        const response = await authAPI.register(formData);
        
        console.log('Register response:', response.data);
        
        // Store token and user info
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('userId', response.data.user_id);
        localStorage.setItem('isAdmin', response.data.is_admin);
        localStorage.setItem('locationZone', response.data.location_zone);
        
        // Redirect to trader dashboard
        navigate('/trader');
      }
    } catch (err) {
      console.error('Auth error:', err.response?.data);
      
      // Handle validation errors
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          // Pydantic validation errors
          const errors = err.response.data.detail.map(e => e.msg).join(', ');
          setError(errors);
        } else {
          setError(err.response.data.detail);
        }
      } else {
        setError('Authentication failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-bold mb-2 text-center text-gray-800">
          Group-Buy Platform
        </h1>
        <p className="text-center text-gray-600 mb-6">
          {isLogin ? 'Sign in to your account' : 'Create a new account'}
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Location Zone
                </label>
                <select
                  name="location_zone"
                  value={formData.location_zone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select your location</option>
                  {locationZones.map(zone => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>

        <div className="mt-4 text-center text-xs text-gray-600">
          <p>Demo Accounts:</p>
          <p>Admin: admin@groupbuy.com / admin123</p>
          <p>Trader: trader1@example.com / password123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;