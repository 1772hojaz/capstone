import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Building2, Eye, EyeOff, AlertCircle, CheckCircle, Loader, ArrowLeft, Lock } from 'lucide-react';
import apiService from '../services/api';

const SupplierLoginPage = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    companyName: '',
    businessAddress: '',
    taxId: '',
    phoneNumber: '',
    fullName: '',
    locationZone: 'HARARE', // Default location zone
    rememberMe: false,
  });

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Registration-specific validations
    if (!isLogin) {
      if (!formData.companyName.trim()) {
        newErrors.companyName = 'Company name is required';
      }
      if (!formData.businessAddress.trim()) {
        newErrors.businessAddress = 'Business address is required';
      }
      if (!formData.phoneNumber.trim()) {
        newErrors.phoneNumber = 'Phone number is required';
      }
      if (!formData.fullName.trim()) {
        newErrors.fullName = 'Contact person name is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        // Supplier-specific login logic - bypass apiService to prevent auto-redirect
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Invalid supplier credentials. Please check your email and password.');
          }
          throw new Error(data.detail || 'Login failed. Please try again.');
        }

        // Check if the user is actually a supplier
        if (!data.is_supplier) {
          throw new Error('This account is not registered as a supplier. Please register as a supplier or use the trader login.');
        }

        if (data.access_token) {
          localStorage.setItem('token', data.access_token);
          localStorage.setItem('userType', 'supplier');
          setSuccessMessage('Login successful! Redirecting...');
          setTimeout(() => {
            navigate('/supplier/dashboard');
          }, 1500);
        } else {
          throw new Error('Login failed. Please check your credentials.');
        }
      } else {
        // Registration logic
        await apiService.registerSupplier({
          email: formData.email,
          password: formData.password,
          company_name: formData.companyName,
          business_address: formData.businessAddress,
          tax_id: formData.taxId,
          phone_number: formData.phoneNumber,
          full_name: formData.fullName,
          location_zone: formData.locationZone,
        });

        setSuccessMessage('Registration successful! Please check your email to verify your account.');
        setIsLogin(true);
        setFormData({
          ...formData,
          password: '',
          companyName: '',
          businessAddress: '',
          taxId: '',
          phoneNumber: '',
          fullName: '',
          locationZone: 'HARARE',
        });
      }
    } catch (error: any) {
      console.error('Supplier auth error:', error);
      
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      // Ensure error messages are supplier-specific
      if (errorMessage.includes('Invalid credentials') || errorMessage.includes('Unauthorized')) {
        errorMessage = 'Invalid supplier credentials. Please check your email and password, or register as a new supplier.';
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative backdrop-blur-sm border border-gray-100">
        {/* Back Button */}
        <button
          onClick={() => navigate('/supplier')}
          className="absolute top-4 left-4 inline-flex items-center text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <svg className="w-16 h-16 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            ConnectSphere
          </h1>
          <p className="text-gray-600 mt-2 font-medium">
            <span className="inline-flex items-center gap-1">
              <Building2 className="w-4 h-4" />
              Supplier Portal
            </span>
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 rounded-md font-medium transition ${isLogin ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 rounded-md font-medium transition ${!isLogin ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Register
          </button>
        </div>

        {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
          {/* General Error Message */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{errors.general}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email"
                />
                <Mail className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Registration Fields */}
            {!isLogin && (
              <>
                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                    Contact Person Name
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.fullName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter contact person name"
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                  )}
                </div>

                {/* Company Name */}
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                    Company Name
                  </label>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.companyName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your company name"
                  />
                  {errors.companyName && (
                    <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>
                  )}
                </div>

                {/* Business Address */}
                <div>
                  <label htmlFor="businessAddress" className="block text-sm font-medium text-gray-700">
                    Business Address
                  </label>
                  <input
                    id="businessAddress"
                    name="businessAddress"
                    type="text"
                    required
                    value={formData.businessAddress}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.businessAddress ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your business address"
                  />
                  {errors.businessAddress && (
                    <p className="mt-1 text-sm text-red-600">{errors.businessAddress}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    required
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.phoneNumber ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your phone number"
                  />
                  {errors.phoneNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
                  )}
                </div>

                {/* Tax ID (Required) */}
                <div>
                  <label htmlFor="taxId" className="block text-sm font-medium text-gray-700">
                    Tax ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="taxId"
                    name="taxId"
                    type="text"
                    required
                    value={formData.taxId}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.taxId ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your tax ID"
                  />
                  {errors.taxId && (
                    <p className="mt-1 text-sm text-red-600">{errors.taxId}</p>
                  )}
                </div>

                {/* Location Zone */}
                <div>
                  <label htmlFor="locationZone" className="block text-sm font-medium text-gray-700">
                    Location Zone
                  </label>
                  <select
                    id="locationZone"
                    name="locationZone"
                    required
                    value={formData.locationZone}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.locationZone ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="HARARE">Harare</option>
                    <option value="BULAWAYO">Bulawayo</option>
                    <option value="MUTARE">Mutare</option>
                    <option value="GWERU">Gweru</option>
                    <option value="KWEKWE">Kwekwe</option>
                    <option value="MASVINGO">Masvingo</option>
                    <option value="CHITUNGWIZA">Chitungwiza</option>
                    <option value="EPWORTH">Epworth</option>
                    <option value="RURAL">Rural Areas</option>
                  </select>
                  {errors.locationZone && (
                    <p className="mt-1 text-sm text-red-600">{errors.locationZone}</p>
                  )}
                </div>
              </>
            )}

          {isLogin && (
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-600">Remember me</span>
              </label>
              <button
                type="button"
                className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                {isLogin ? 'Signing In...' : 'Creating Account...'}
              </>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>

          </form>

        {/* Quick Navigation */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center mb-3">Not a supplier? Login or register as a trader</p>
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition font-medium"
            >
              Trader Portal
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            By {isLogin ? 'signing in' : 'creating an account'}, you agree to our{' '}
            <a href="#" className="text-blue-600 hover:text-blue-500">Terms of Service</a>{' '}
            and{' '}
            <a href="#" className="text-blue-600 hover:text-blue-500">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SupplierLoginPage;