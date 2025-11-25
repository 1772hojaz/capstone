import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, MapPin, DollarSign, TrendingUp, Users, Calendar, Eye, EyeOff, AlertCircle, CheckCircle, Loader, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import apiService from '../services/api';
import metadataService from '../services/metadataService';

interface RegistrationData {
  // Step 1: Basic Info
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
  
  // Step 2: Location & Trading Patterns
  location_zone: string;
  preferred_categories: string[];
  budget_range: string;
  
  // Step 3: Experience & Preferences
  experience_level: string;
  preferred_group_sizes: string[];
  participation_frequency: string;
}

const EnhancedRegistrationPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [successMessage, setSuccessMessage] = useState('');
  
  // Dynamic data from API
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [budgetRanges, setBudgetRanges] = useState<any[]>([]);
  const [experienceLevels, setExperienceLevels] = useState<any[]>([]);
  const [groupSizes, setGroupSizes] = useState<any[]>([]);
  const [participationFrequencies, setParticipationFrequencies] = useState<any[]>([]);
  const [metadataLoading, setMetadataLoading] = useState(true);
  
  const [formData, setFormData] = useState<RegistrationData>({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    location_zone: '',
    preferred_categories: [],
    budget_range: 'medium',
    experience_level: 'beginner',
    preferred_group_sizes: [],
    participation_frequency: 'regular'
  });

  // Fetch metadata on component mount
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const metadata = await metadataService.getAllMetadata();
        setCategories(metadata.categories);
        setLocations(metadata.locations);
        setBudgetRanges(metadata.budget_ranges);
        setExperienceLevels(metadata.experience_levels);
        setGroupSizes(metadata.group_sizes);
        setParticipationFrequencies(metadata.participation_frequencies);
      } catch (error) {
        console.error('Failed to load metadata:', error);
        // Fallback data is handled by metadataService
      } finally {
        setMetadataLoading(false);
      }
    };

    fetchMetadata();
  }, []);

  const validateStep = (step: number): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (step === 1) {
      // Basic Info Validation
      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }

      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }

      if (!formData.full_name.trim()) {
        newErrors.full_name = 'Full name is required';
      }
    } else if (step === 2) {
      // Location & Trading Patterns
      if (!formData.location_zone) {
        newErrors.location_zone = 'Please select your location';
      }

      if (formData.preferred_categories.length === 0) {
        newErrors.preferred_categories = 'Please select at least one category';
      }
    } else if (step === 3) {
      // Experience & Preferences
      if (formData.preferred_group_sizes.length === 0) {
        newErrors.preferred_group_sizes = 'Please select at least one group size preference';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(3)) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await apiService.register({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        location_zone: formData.location_zone,
        preferred_categories: formData.preferred_categories,
        budget_range: formData.budget_range,
        experience_level: formData.experience_level,
        preferred_group_sizes: formData.preferred_group_sizes,
        participation_frequency: formData.participation_frequency
      });

      setSuccessMessage('Account created successfully! Redirecting...');
      setTimeout(() => {
        if (response.is_admin) {
          navigate('/admin');
        } else {
          navigate('/trader');
        }
      }, 1500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred. Please try again.';
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof RegistrationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const toggleCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      preferred_categories: prev.preferred_categories.includes(category)
        ? prev.preferred_categories.filter(c => c !== category)
        : [...prev.preferred_categories, category]
    }));
    if (errors.preferred_categories) {
      setErrors(prev => ({ ...prev, preferred_categories: '' }));
    }
  };

  const toggleGroupSize = (size: string) => {
    setFormData(prev => ({
      ...prev,
      preferred_group_sizes: prev.preferred_group_sizes.includes(size)
        ? prev.preferred_group_sizes.filter(s => s !== size)
        : [...prev.preferred_group_sizes, size]
    }));
    if (errors.preferred_group_sizes) {
      setErrors(prev => ({ ...prev, preferred_group_sizes: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Join ConnectSphere</h1>
          <p className="text-gray-600">Create your trader account in 3 easy steps</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-md mx-auto">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  currentStep > step
                    ? 'bg-green-500 text-white'
                    : currentStep === step
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > step ? <Check className="w-5 h-5" /> : step}
                </div>
                {step < 3 && (
                  <div className={`w-20 h-1 mx-2 transition-all ${
                    currentStep > step ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between max-w-md mx-auto mt-2 text-xs text-gray-600">
            <span>Basic Info</span>
            <span>Location</span>
            <span>Preferences</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit}>
            {/* Success Message */}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center text-green-700">
                <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* General Error */}
            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
                <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                <span>{errors.general}</span>
              </div>
            )}

            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Basic Information</h2>
                
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                        errors.full_name
                          ? 'border-red-300 focus:ring-red-200'
                          : 'border-gray-300 focus:ring-blue-200'
                      }`}
                      placeholder="Enter your full name"
                    />
                  </div>
                  {errors.full_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                        errors.email
                          ? 'border-red-300 focus:ring-red-200'
                          : 'border-gray-300 focus:ring-blue-200'
                      }`}
                      placeholder="your.email@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                        errors.password
                          ? 'border-red-300 focus:ring-red-200'
                          : 'border-gray-300 focus:ring-blue-200'
                      }`}
                      placeholder="Create a secure password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                        errors.confirmPassword
                          ? 'border-red-300 focus:ring-red-200'
                          : 'border-gray-300 focus:ring-blue-200'
                      }`}
                      placeholder="Re-enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Location & Trading Patterns */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Location & Trading Patterns</h2>
                <p className="text-gray-600 mb-4">Help us personalize your recommendations</p>
                
                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline w-4 h-4 mr-1" />
                    Your Trading Location *
                  </label>
                  <select
                    value={formData.location_zone}
                    onChange={(e) => handleInputChange('location_zone', e.target.value)}
                    disabled={metadataLoading}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                      errors.location_zone
                        ? 'border-red-300 focus:ring-red-200'
                        : 'border-gray-300 focus:ring-blue-200'
                    } ${metadataLoading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  >
                    <option value="">{metadataLoading ? 'Loading locations...' : 'Select your location'}</option>
                    {locations.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                  {errors.location_zone && (
                    <p className="mt-1 text-sm text-red-600">{errors.location_zone}</p>
                  )}
                </div>

                {/* Preferred Categories */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Product Categories You're Interested In *
                  </label>
                  <p className="text-sm text-gray-500 mb-3">Select all that apply (minimum 1)</p>
                  {metadataLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader className="w-6 h-6 animate-spin text-blue-600" />
                      <span className="ml-2 text-gray-600">Loading categories...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {categories.map(category => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => toggleCategory(category)}
                          className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                            formData.preferred_categories.includes(category)
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {formData.preferred_categories.includes(category) && (
                            <Check className="inline w-4 h-4 mr-1" />
                          )}
                          {category}
                        </button>
                      ))}
                    </div>
                  )}
                  {errors.preferred_categories && (
                    <p className="mt-2 text-sm text-red-600">{errors.preferred_categories}</p>
                  )}
                </div>

                {/* Budget Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <DollarSign className="inline w-4 h-4 mr-1" />
                    Monthly Budget Range
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {budgetRanges.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleInputChange('budget_range', option.value)}
                        className={`px-4 py-4 rounded-lg border-2 transition-all ${
                          formData.budget_range === option.value
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="font-semibold text-gray-900">{option.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{option.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Experience & Preferences */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Experience & Preferences</h2>
                <p className="text-gray-600 mb-4">Final step! Tell us about your group buy preferences</p>
                
                {/* Experience Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <TrendingUp className="inline w-4 h-4 mr-1" />
                    Your Experience with Group Buying
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {experienceLevels.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleInputChange('experience_level', option.value)}
                        className={`px-4 py-4 rounded-lg border-2 transition-all ${
                          formData.experience_level === option.value
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="font-semibold text-gray-900">{option.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{option.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preferred Group Sizes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <Users className="inline w-4 h-4 mr-1" />
                    Preferred Group Sizes *
                  </label>
                  <p className="text-sm text-gray-500 mb-3">Select all that apply (minimum 1)</p>
                  <div className="grid grid-cols-3 gap-3">
                    {groupSizes.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => toggleGroupSize(option.value)}
                        className={`px-4 py-4 rounded-lg border-2 transition-all ${
                          formData.preferred_group_sizes.includes(option.value)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        {formData.preferred_group_sizes.includes(option.value) && (
                          <Check className="inline w-4 h-4 mr-1 text-blue-600" />
                        )}
                        <div className="font-semibold text-gray-900">{option.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                      </button>
                    ))}
                  </div>
                  {errors.preferred_group_sizes && (
                    <p className="mt-2 text-sm text-red-600">{errors.preferred_group_sizes}</p>
                  )}
                </div>

                {/* Participation Frequency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    How Often Do You Plan to Participate?
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {participationFrequencies.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleInputChange('participation_frequency', option.value)}
                        className={`px-4 py-4 rounded-lg border-2 transition-all ${
                          formData.participation_frequency === option.value
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="font-semibold text-gray-900">{option.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{option.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Why We Collect This */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-1">Why we collect this information</p>
                      <p>We use your preferences to provide personalized recommendations and connect you with similar traders who share your interests. Your data is secure and never sold to third parties.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center"
                  disabled={isLoading}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </button>
              )}
              
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="ml-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="ml-auto px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center"
                >
                  {isLoading ? (
                    <>
                      <Loader className="w-5 h-5 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <Check className="w-5 h-5 ml-2" />
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Login Link */}
        <div className="text-center mt-6">
          <p className="text-gray-600">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Log in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnhancedRegistrationPage;

