import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Package, MapPin, DollarSign, Calendar } from 'lucide-react';
import TopNavigation from '../components/navigation/TopNavigation';
import { PageContainer } from '../components/layout/index';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input, Textarea } from '../components/ui/Input';
import { Badge } from '../components/ui/badge';
import apiService from '../services/api';
import { useToast } from '../components/feedback/Toast';

type Step = 1 | 2 | 3 | 4;

interface GroupFormData {
  // Step 1: Product Details
  product_id?: number;
  product_name: string;
  description: string;
  category: string;
  
  // Step 2: Pricing & Quantity
  base_price: string;
  target_quantity: string;
  min_participants: string;
  max_participants_per_trader: string;
  
  // Step 3: Delivery
  pickup_location: string;
  delivery_method: string;
  estimated_delivery_days: string;
  
  // Step 4: Schedule
  deadline: string;
  special_instructions: string;
}

const CATEGORIES = [
  'Grocery',
  'Vegetables',
  'Fruits',
  'Grains & Cereals',
  'Cooking Essentials',
  'Meat & Poultry',
  'Fish & Kapenta',
  'Dairy Products',
  'Beverages',
  'Tobacco & Cash Crops',
  'Livestock',
  'Seeds & Fertilizers',
  'Traditional Medicines',
  'Arts & Crafts',
  'Building Materials',
  'Hardware & Tools',
  'Household Items',
  'Clothing & Textiles',
  'Stationery & Books',
  'Electronics & Appliances',
  'Fuel & Energy',
  'Others'
];

const DELIVERY_METHODS = [
  { value: 'pickup', label: 'Pickup at Location' },
  { value: 'delivery', label: 'Home Delivery' },
  { value: 'both', label: 'Both Options Available' }
];

export default function CreateGroup() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof GroupFormData, string>>>({});
  
  const [formData, setFormData] = useState<GroupFormData>({
    product_name: '',
    description: '',
    category: '',
    base_price: '',
    target_quantity: '',
    min_participants: '1',
    max_participants_per_trader: '',
    pickup_location: '',
    delivery_method: 'pickup',
    estimated_delivery_days: '7',
    deadline: '',
    special_instructions: '',
  });

  const steps = [
    { number: 1, title: 'Product Details', icon: Package },
    { number: 2, title: 'Pricing & Quantity', icon: DollarSign },
    { number: 3, title: 'Delivery', icon: MapPin },
    { number: 4, title: 'Schedule & Review', icon: Calendar },
  ];

  const handleInputChange = (field: keyof GroupFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = (step: Step): boolean => {
    const newErrors: Partial<Record<keyof GroupFormData, string>> = {};

    switch (step) {
      case 1:
        if (!formData.product_name.trim()) {
          newErrors.product_name = 'Product name is required';
        }
        if (!formData.description.trim()) {
          newErrors.description = 'Description is required';
        }
        if (formData.description.trim().length < 20) {
          newErrors.description = 'Description must be at least 20 characters';
        }
        break;

      case 2:
        if (!formData.base_price || parseFloat(formData.base_price) <= 0) {
          newErrors.base_price = 'Valid price is required';
        }
        if (!formData.target_quantity || parseInt(formData.target_quantity) <= 0) {
          newErrors.target_quantity = 'Valid target quantity is required';
        }
        if (!formData.min_participants || parseInt(formData.min_participants) <= 0) {
          newErrors.min_participants = 'Minimum participants must be at least 1';
        }
        if (formData.max_participants_per_trader && parseInt(formData.max_participants_per_trader) < 1) {
          newErrors.max_participants_per_trader = 'Must be at least 1 or leave empty';
        }
        break;

      case 3:
        if (!formData.pickup_location.trim()) {
          newErrors.pickup_location = 'Pickup location is required';
        }
        if (!formData.estimated_delivery_days || parseInt(formData.estimated_delivery_days) <= 0) {
          newErrors.estimated_delivery_days = 'Valid delivery time is required';
        }
        break;

      case 4:
        if (!formData.deadline) {
          newErrors.deadline = 'Deadline is required';
        } else {
          const deadlineDate = new Date(formData.deadline);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (deadlineDate < today) {
            newErrors.deadline = 'Deadline must be in the future';
          }
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4) as Step);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1) as Step);
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      return;
    }

    try {
      setLoading(true);
      
      const groupData = {
        product_name: formData.product_name,
        description: formData.description,
        category: formData.category,
        base_price: parseFloat(formData.base_price),
        target_quantity: parseInt(formData.target_quantity),
        min_participants: parseInt(formData.min_participants),
        max_participants_per_trader: formData.max_participants_per_trader 
          ? parseInt(formData.max_participants_per_trader) 
          : null,
        pickup_location: formData.pickup_location,
        delivery_method: formData.delivery_method,
        estimated_delivery_days: parseInt(formData.estimated_delivery_days),
        deadline: formData.deadline,
        special_instructions: formData.special_instructions || null,
      };

      await apiService.createSupplierGroup(groupData);
      
      showToast({
        type: 'success',
        title: 'Group Created!',
        message: 'Your group buy has been created successfully.'
      });
      
      navigate('/supplier/dashboard');
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to create group. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation userRole="supplier" />

      <PageContainer>
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/supplier/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Create New Group Buy</h1>
          <p className="text-gray-600 mt-2">
            Fill in the details to create a new group buying opportunity
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = currentStep > step.number;
              const isCurrent = currentStep === step.number;
              
              return (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                        isCompleted
                          ? 'bg-green-500 border-green-500 text-white'
                          : isCurrent
                          ? 'bg-primary-500 border-primary-500 text-white'
                          : 'bg-white border-gray-300 text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-6 w-6" />
                      ) : (
                        <StepIcon className="h-6 w-6" />
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <div
                        className={`text-sm font-medium ${
                          isCurrent ? 'text-primary-600' : 'text-gray-600'
                        }`}
                      >
                        {step.title}
                      </div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-4 transition-all ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <Card className="p-8 max-w-3xl mx-auto">
          {/* Step 1: Product Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Details</h2>
                <p className="text-gray-600">Tell us about the product you're offering</p>
              </div>

              <Input
                label="Product Name"
                placeholder="e.g., Fresh Organic Tomatoes"
                value={formData.product_name}
                onChange={(e) => handleInputChange('product_name', e.target.value)}
                error={errors.product_name}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <Textarea
                label="Description"
                placeholder="Describe your product, its quality, origin, and why traders should buy it..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                error={errors.description}
                helperText="Minimum 20 characters"
                rows={5}
                required
              />
            </div>
          )}

          {/* Step 2: Pricing & Quantity */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Pricing & Quantity</h2>
                <p className="text-gray-600">Set your pricing and quantity targets</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Base Price per Unit ($)"
                  type="number"
                  placeholder="0.00"
                  value={formData.base_price}
                  onChange={(e) => handleInputChange('base_price', e.target.value)}
                  error={errors.base_price}
                  step="0.01"
                  min="0"
                  required
                />

                <Input
                  label="Target Quantity"
                  type="number"
                  placeholder="e.g., 100"
                  value={formData.target_quantity}
                  onChange={(e) => handleInputChange('target_quantity', e.target.value)}
                  error={errors.target_quantity}
                  helperText="Total units you want to sell"
                  min="1"
                  required
                />

                <Input
                  label="Minimum Participants"
                  type="number"
                  placeholder="1"
                  value={formData.min_participants}
                  onChange={(e) => handleInputChange('min_participants', e.target.value)}
                  error={errors.min_participants}
                  helperText="Minimum traders needed"
                  min="1"
                  required
                />

                <Input
                  label="Max per Trader (Optional)"
                  type="number"
                  placeholder="Leave empty for no limit"
                  value={formData.max_participants_per_trader}
                  onChange={(e) => handleInputChange('max_participants_per_trader', e.target.value)}
                  error={errors.max_participants_per_trader}
                  helperText="Maximum units per trader"
                  min="1"
                />
              </div>

              {/* Preview Calculation */}
              {formData.base_price && formData.target_quantity && (
                <Card variant="filled" className="p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Potential Revenue:</span>
                    <span className="text-2xl font-bold text-green-600">
                      ${(parseFloat(formData.base_price) * parseInt(formData.target_quantity)).toFixed(2)}
                    </span>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Step 3: Delivery */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Delivery Details</h2>
                <p className="text-gray-600">Specify delivery and pickup information</p>
              </div>

              <Input
                label="Pickup Location"
                placeholder="e.g., 123 Main St, Harare"
                value={formData.pickup_location}
                onChange={(e) => handleInputChange('pickup_location', e.target.value)}
                error={errors.pickup_location}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Method <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {DELIVERY_METHODS.map((method) => (
                    <label
                      key={method.value}
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.delivery_method === method.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="delivery_method"
                        value={method.value}
                        checked={formData.delivery_method === method.value}
                        onChange={(e) => handleInputChange('delivery_method', e.target.value)}
                        className="mr-3"
                      />
                      <span className="font-medium">{method.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Input
                label="Estimated Delivery Time (Days)"
                type="number"
                placeholder="7"
                value={formData.estimated_delivery_days}
                onChange={(e) => handleInputChange('estimated_delivery_days', e.target.value)}
                error={errors.estimated_delivery_days}
                helperText="Days from group completion to delivery"
                min="1"
                required
              />
            </div>
          )}

          {/* Step 4: Schedule & Review */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Schedule & Review</h2>
                <p className="text-gray-600">Set the deadline and review your group</p>
              </div>

              <Input
                label="Deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => handleInputChange('deadline', e.target.value)}
                error={errors.deadline}
                helperText="Last date to join this group"
                min={new Date().toISOString().split('T')[0]}
                required
              />

              <Textarea
                label="Special Instructions (Optional)"
                placeholder="Any special handling instructions, storage requirements, or additional notes..."
                value={formData.special_instructions}
                onChange={(e) => handleInputChange('special_instructions', e.target.value)}
                rows={4}
              />

              {/* Preview Summary */}
              <Card variant="filled" className="p-6">
                <h3 className="font-bold text-lg mb-4">Group Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Product:</span>
                    <span className="font-medium">{formData.product_name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Category:</span>
                    <Badge variant="secondary">{formData.category}</Badge>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Price per Unit:</span>
                    <span className="font-bold text-primary-600">${formData.base_price}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Target Quantity:</span>
                    <span className="font-medium">{formData.target_quantity} units</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{formData.pickup_location}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Delivery:</span>
                    <span className="font-medium">{formData.estimated_delivery_days} days</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Deadline:</span>
                    <span className="font-medium">
                      {new Date(formData.deadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1 || loading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            {currentStep < 4 ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} loading={loading}>
                Create Group
              </Button>
            )}
          </div>
        </Card>
      </PageContainer>
    </div>
  );
}

