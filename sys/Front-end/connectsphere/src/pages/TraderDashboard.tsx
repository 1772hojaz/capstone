import { Zap, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import apiService from '../services/api';
import TopNavigation from '../components/navigation/TopNavigation';
import MobileBottomNav from '../components/navigation/MobileBottomNav';
import { PageContainer, PageHeader } from '../components/layout/index';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { SkeletonCard } from '../components/feedback/Skeleton';
import { ErrorAlert } from '../components/feedback/ErrorAlert';
import { EmptyState } from '../components/feedback/EmptyState';

const TraderDashboard = () => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load recommendations on component mount
  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await apiService.getRecommendations();
        setRecommendations(response);
      } catch (err) {
        console.error('Failed to load recommendations:', err);
        setError('Failed to load recommendations. Please try again.');
        setRecommendations([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecommendations();
  }, []);

  // View group handler
  const handleViewGroup = (recommendation: any) => {
    navigate(`/group/${recommendation.group_buy_id}`, { 
      state: { recommendation, mode: 'view' } 
    });
  };

  // Join group handler
  const handleJoinGroup = (recommendation: any) => {
    navigate(`/group/${recommendation.group_buy_id}`, { 
      state: { recommendation, mode: 'join' } 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <TopNavigation userRole="trader" />
      
      <PageContainer>
        <PageHeader
          title="Recommended For You"
          description="Personalized group buys based on your interests - Save up to 40%"
          breadcrumbs={[
            { label: 'Home' }
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Badge variant="info" leftIcon={<Zap className="h-3 w-3" />}>
                AI Powered
              </Badge>
              <Button
                variant="outline"
                onClick={() => navigate('/all-groups')}
                leftIcon={<ShoppingCart className="h-4 w-4" />}
              >
                Browse All
              </Button>
            </div>
          }
        />

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Error State */}
        {error && (
          <ErrorAlert
            title="Unable to load recommendations"
            message={error}
            onRetry={() => window.location.reload()}
            variant="card"
          />
        )}

        {/* Empty State */}
        {!isLoading && !error && recommendations.length === 0 && (
          <EmptyState
            icon="package"
            title="No recommendations yet"
            description="We're still learning your preferences. Browse all groups to get started!"
            actionLabel="Browse All Groups"
            onAction={() => navigate('/all-groups')}
          />
        )}

        {/* Product Grid */}
        {!isLoading && !error && recommendations.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {recommendations.map((product) => (
                <Card 
                  key={product.group_buy_id} 
                  variant="elevated"
                  hoverable
                  className="overflow-hidden"
                >
                  {/* Product Image */}
                  <div className="relative h-48 bg-gray-100 flex items-center justify-center">
                    {product.product_image_url ? (
                      <img 
                        src={product.product_image_url} 
                        alt={product.product_name} 
                        className="h-full w-full object-cover" 
                      />
                    ) : (
                      <span className="text-5xl text-gray-400">📦</span>
                    )}
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3">
                      <Badge variant="success" size="sm">
                        {Math.round(product.recommendation_score * 100)}% Match
                      </Badge>
                    </div>
                    <div className="absolute top-3 right-3">
                      <Badge variant="warning" size="sm">
                        Save {Math.round(product.savings_factor * 100)}%
                      </Badge>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4 space-y-3">
                    <h3 className="heading-5 line-clamp-2">{product.product_name}</h3>
                    
                    {/* Price */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900">
                        ${product.bulk_price}
                      </span>
                      <span className="text-sm text-gray-500 line-through">
                        ${product.unit_price}
                      </span>
                    </div>
                    
                    {/* Progress */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>{product.participants_count} joined</span>
                        <span>{product.moq} needed</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(product.moq_progress, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewGroup(product)}
                        fullWidth
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleJoinGroup(product)}
                        fullWidth
                      >
                        Join Group
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* How It Works Section */}
            <Card variant="filled" padding="lg" className="border border-primary-200">
              <div className="flex items-start gap-4 mb-6">
                <div className="h-12 w-12 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">💡</span>
                </div>
                <div>
                  <h2 className="heading-3 mb-2">How Group Buying Works</h2>
                  <p className="body-sm text-gray-600">Save money by buying together</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center space-y-3">
                  <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto">
                    <span className="text-3xl">👥</span>
                  </div>
                  <h3 className="heading-6">1. Join a Group</h3>
                  <p className="body-sm text-gray-600">
                    Browse deals and join groups for products you want
                  </p>
                </div>
                
                <div className="text-center space-y-3">
                  <div className="h-16 w-16 rounded-full bg-success-100 flex items-center justify-center mx-auto">
                    <span className="text-3xl">⏱️</span>
                  </div>
                  <h3 className="heading-6">2. Wait for Goal</h3>
                  <p className="body-sm text-gray-600">
                    More people join, bigger the discount gets
                  </p>
                </div>
                
                <div className="text-center space-y-3">
                  <div className="h-16 w-16 rounded-full bg-secondary-100 flex items-center justify-center mx-auto">
                    <span className="text-3xl">🎉</span>
                  </div>
                  <h3 className="heading-6">3. Deal Unlocked</h3>
                  <p className="body-sm text-gray-600">
                    Everyone gets the discounted price and product ships
                  </p>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-white rounded-lg border border-primary-200">
                <p className="body-sm text-gray-700">
                  <strong>💰 Example:</strong> A $100 item can drop to $70 when 50 people join. 
                  The more participants, the lower the price for everyone! 
                  <strong className="text-primary-600"> No risk</strong> - you only pay if the group reaches its goal.
                </p>
              </div>
            </Card>
          </>
        )}
      </PageContainer>

      <MobileBottomNav userRole="trader" />
    </div>
  );
};

export default TraderDashboard;
