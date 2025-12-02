import { ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import apiService from '../services/apiWithMock';
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

  // Check if user is admin or supplier and redirect them
  useEffect(() => {
    const checkRole = async () => {
      try {
        const user = await apiService.getCurrentUser();
        if (user?.is_admin) {
          navigate('/admin', { replace: true });
        } else if (user?.is_supplier) {
          navigate('/supplier/dashboard', { replace: true });
        }
      } catch (err) {
        console.error('Failed to check user role:', err);
      }
    };
    
    checkRole();
  }, [navigate]);

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
      state: { recommendation, mode: 'view', source: 'dashboard' } 
    });
  };

  // Join group handler
  const handleJoinGroup = (recommendation: any) => {
    navigate(`/group/${recommendation.group_buy_id}`, { 
      state: { recommendation, mode: 'join', source: 'dashboard' } 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <TopNavigation userRole="trader" />
      
      <PageContainer>
        <PageHeader
          title="Recommendations"
          description="Personalized group buys based on your interests - Save up to 40%"
          breadcrumbs={[
            { label: 'Home' }
          ]}
          actions={
            <Button
              variant="outline"
              onClick={() => navigate('/all-groups')}
              leftIcon={<ShoppingCart className="h-4 w-4" />}
            >
              Browse All
            </Button>
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
                    {product.product_image_url && (
                      <img 
                        src={product.product_image_url} 
                        alt={product.product_name} 
                        className="h-full w-full object-cover" 
                      />
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
                    
                    {/* Recommendation Reason - Explainability */}
                    {product.reason && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg px-3 py-2.5 shadow-sm">
                        <p className="text-xs font-medium text-blue-900 flex items-start gap-2">
                          <span className="text-blue-600 font-bold text-sm">Why:</span>
                          <span className="flex-1 leading-relaxed">{product.reason}</span>
                        </p>
                      </div>
                    )}
                    
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
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Progress: {(product.amount_progress || product.moq_progress || 0).toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>${(product.current_amount || 0).toFixed(0)} raised</span>
                        <span>${(product.target_amount || 0).toFixed(0)} target</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(product.amount_progress || product.moq_progress || 0, 100)}%` }}
                        />
                      </div>
                      {product.participants_count > 0 && (
                        <p className="text-xs text-gray-500 text-center">
                          {product.participants_count} {product.participants_count === 1 ? 'person' : 'people'} joined
                        </p>
                      )}
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
                      {product.joined ? (
                        <Button
                          size="sm"
                          variant="success"
                          disabled
                          fullWidth
                        >
                          Joined
                        </Button>
                      ) : (product.current_amount || 0) >= (product.target_amount || 1) ? (
                        <Button
                          size="sm"
                          disabled
                          fullWidth
                        >
                          Full
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleJoinGroup(product)}
                          fullWidth
                        >
                          Join Group
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </PageContainer>

      <MobileBottomNav userRole="trader" />
    </div>
  );
};

export default TraderDashboard;
