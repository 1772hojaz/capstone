import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Building2, Eye, EyeOff, AlertCircle, CheckCircle, Loader, ArrowLeft, Lock } from 'lucide-react';
import apiService from '../services/api';

const SupplierLoginPage = () => {
  const navigate = useNavigate();
  // Default to registration mode since this page is now used for /supplier/register
  const [isLogin, setIsLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    companyName: '',
    businessAddress: '',
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
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full blur-lg opacity-50"></div>
              <div className="relative bg-white p-3 rounded-full">
                <Building2 className="w-12 h-12 text-purple-600" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Supplier Partnership
          </h1>
          <p className="text-gray-600 font-medium mb-1">
            Grow Your Business with ConnectSphere
          </p>
          <p className="text-sm text-gray-500">
            Join our network and reach thousands of bulk buyers
          </p>
        </div>

        {/* Benefits Section */}
        <div className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-purple-600" />
            Why Become a Supplier Partner?
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Access to a verified network of bulk buyers</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Create and manage group buying campaigns easily</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Secure payment processing and order management</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Real-time analytics and business insights</span>
            </li>
          </ul>
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

            {/* Step Indicator for Registration */}
            {!isLogin && (
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm font-semibold text-blue-900 mb-1">Registration Steps</p>
                <div className="flex items-center justify-between text-xs text-blue-700">
                  <span className="flex items-center gap-1">
                    <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center font-semibold">1</span>
                    Account Info
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center font-semibold">2</span>
                    Business Details
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center font-semibold">3</span>
                    Location
                  </span>
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-2">
                Business Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-3 py-3 border-2 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${
                    errors.email ? 'border-red-300' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  placeholder="e.g., business@company.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email}
                </p>
              )}
              <p className="mt-1.5 text-xs text-gray-500">Use your official business email address</p>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-800 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-12 py-3 border-2 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${
                    errors.password ? 'border-red-300' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.password}
                </p>
              )}
              <p className="mt-1.5 text-xs text-gray-500">Minimum 6 characters, include letters and numbers</p>
            </div>

            {/* Registration Fields */}
            {!isLogin && (
              <>
                {/* Business Information Section */}
                <div className="border-t border-gray-200 pt-5 mt-2">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-600" />
                    Business Information
                  </h3>
                  
                  {/* Full Name */}
                  <div className="mb-4">
                    <label htmlFor="fullName" className="block text-sm font-semibold text-gray-800 mb-2">
                      Contact Person Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className={`block w-full px-3 py-3 border-2 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${
                        errors.fullName ? 'border-red-300' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="e.g., John Smith"
                    />
                    {errors.fullName && (
                      <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.fullName}
                      </p>
                    )}
                    <p className="mt-1.5 text-xs text-gray-500">Primary contact for business communications</p>
                  </div>

                  {/* Company Name */}
                  <div className="mb-4">
                    <label htmlFor="companyName" className="block text-sm font-semibold text-gray-800 mb-2">
                      Company/Business Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="companyName"
                      name="companyName"
                      type="text"
                      required
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className={`block w-full px-3 py-3 border-2 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${
                        errors.companyName ? 'border-red-300' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="e.g., Smith Trading Co."
                    />
                    {errors.companyName && (
                      <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.companyName}
                      </p>
                    )}
                    <p className="mt-1.5 text-xs text-gray-500">Registered business name as it appears on documents</p>
                  </div>

                  {/* Business Address */}
                  <div className="mb-4">
                    <label htmlFor="businessAddress" className="block text-sm font-semibold text-gray-800 mb-2">
                      Business Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="businessAddress"
                      name="businessAddress"
                      type="text"
                      required
                      value={formData.businessAddress}
                      onChange={handleInputChange}
                      className={`block w-full px-3 py-3 border-2 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${
                        errors.businessAddress ? 'border-red-300' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="e.g., 123 Market Street, Harare"
                    />
                    {errors.businessAddress && (
                      <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.businessAddress}
                      </p>
                    )}
                    <p className="mt-1.5 text-xs text-gray-500">Physical location of your business operations</p>
                  </div>

                  {/* Phone Number */}
                  <div className="mb-4">
                    <label htmlFor="phoneNumber" className="block text-sm font-semibold text-gray-800 mb-2">
                      Business Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      required
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className={`block w-full px-3 py-3 border-2 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${
                        errors.phoneNumber ? 'border-red-300' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="e.g., +263 77 123 4567"
                    />
                    {errors.phoneNumber && (
                      <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.phoneNumber}
                      </p>
                    )}
                    <p className="mt-1.5 text-xs text-gray-500">Include country code for international numbers</p>
                  </div>

                  {/* Location Zone */}
                  <div>
                    <label htmlFor="locationZone" className="block text-sm font-semibold text-gray-800 mb-2">
                      Primary Operating Location <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="locationZone"
                      name="locationZone"
                      required
                      value={formData.locationZone}
                      onChange={handleInputChange}
                      className={`block w-full px-3 py-3 border-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${
                        errors.locationZone ? 'border-red-300' : 'border-gray-200 hover:border-gray-300'
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
                      <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.locationZone}
                      </p>
                    )}
                    <p className="mt-1.5 text-xs text-gray-500">Main area where your business operates</p>
                  </div>
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
              <Link
                to="/forgot-password"
                className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              >
                Forgot password?
              </Link>
            </div>
          )}

          {!isLogin && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800">
                <strong>Business Verification:</strong> All supplier accounts undergo verification to ensure quality and trust. You'll receive an email within 2-3 business days.
              </p>
            </div>
          )}

          {!isLogin && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>Terms & Conditions:</strong> By registering, you agree to our{' '}
                <a href="#" className="text-blue-900 underline hover:text-blue-700">Supplier Agreement</a>,{' '}
                <a href="#" className="text-blue-900 underline hover:text-blue-700">Terms of Service</a>, and{' '}
                <a href="#" className="text-blue-900 underline hover:text-blue-700">Privacy Policy</a>
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3.5 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 focus:ring-4 focus:ring-purple-500 focus:ring-opacity-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            {isLoading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                {isLogin ? 'Signing In...' : 'Creating Supplier Account...'}
              </>
            ) : (
              <>
                {isLogin ? 'Sign In' : 'Register as Supplier'}
                <ArrowLeft className="w-5 h-5 rotate-180" />
              </>
            )}
          </button>

          </form>

        {/* Quick Navigation */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center mb-3">
            Already have a ConnectSphere account?
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full px-6 py-2.5 text-sm bg-white border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all font-medium flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </button>
        </div>

        {/* Support Section */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 mb-2">
            Need assistance with registration?
          </p>
          <a href="mailto:suppliers@connectsphere.com" className="text-sm text-purple-600 hover:text-purple-700 font-medium hover:underline">
            Contact Supplier Support
          </a>
        </div>

        {/* Legal Links */}
        <div className="mt-4 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            <button
              onClick={() => navigate('/terms-of-service')}
              className="text-blue-600 hover:text-blue-700 hover:underline"
            >
              Terms of Service
            </button>
            {' '}<span className="text-gray-400">•</span>{' '}
            <button
              onClick={() => navigate('/privacy-policy')}
              className="text-blue-600 hover:text-blue-700 hover:underline"
            >
              Privacy Policy
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SupplierLoginPage;