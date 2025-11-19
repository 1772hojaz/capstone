import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Package, Clock, CheckCircle, Eye } from 'lucide-react';
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

type TabType = 'active' | 'ready' | 'past';

interface Group {
  id: number;
  product_name: string;
  product_image_url?: string;
  bulk_price: number;
  quantity: number;
  total_paid?: number; // Optional since it might be undefined
  participants_count: number;
  moq: number;
  moq_progress?: number; // Optional since it might be undefined
  status: string;
  is_completed: boolean;
  delivery_location?: string;
  created_at: string;
}

export default function GroupList() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we're returning from a group detail page with a specific tab
  // Otherwise, check localStorage for the last viewed tab
  const getInitialTab = (): TabType => {
    if (location.state?.activeTab) {
      return location.state.activeTab as TabType;
    }
    const savedTab = localStorage.getItem('myGroups_activeTab');
    return (savedTab as TabType) || 'active';
  };
  
  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab());
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('myGroups_activeTab', activeTab);
  }, [activeTab]);

  // Fetch user's groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.getMyGroups();
        setGroups(response);
      } catch (err) {
        console.error('Failed to fetch groups:', err);
        setError('Failed to load your groups. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  // Filter groups based on active tab
  const filteredGroups = groups.filter((group) => {
    if (activeTab === 'active') {
      // Show groups that are active (includes full groups waiting to be ready)
      return group.status === 'active';
    } else if (activeTab === 'ready') {
      return group.status === 'ready_for_pickup';
    } else {
      // past
      return group.status === 'completed' || group.status === 'delivered';
    }
  });

  const handleViewGroup = (group: Group) => {
    navigate(`/group/${group.id}`, { 
      state: { 
        group: group,
        mode: 'view',
        source: 'my-groups',
        activeTab: activeTab // Pass current tab so we can return to it
      } 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <TopNavigation userRole="trader" />
      
      <PageContainer>
        <PageHeader
          title="My Groups"
          description="Track your group buys and manage orders"
          breadcrumbs={[
            { label: 'Home', path: '/trader' },
            { label: 'My Groups' }
          ]}
        />

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <Button
            variant={activeTab === 'active' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('active')}
            leftIcon={<Clock className="h-4 w-4" />}
          >
            Active ({groups.filter(g => !g.is_completed).length})
          </Button>
          <Button
            variant={activeTab === 'ready' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('ready')}
            leftIcon={<Package className="h-4 w-4" />}
          >
            Ready ({groups.filter(g => g.is_completed && g.status === 'ready_for_pickup').length})
          </Button>
          <Button
            variant={activeTab === 'past' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('past')}
            leftIcon={<CheckCircle className="h-4 w-4" />}
          >
            Past ({groups.filter(g => g.status === 'completed' || g.status === 'delivered').length})
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Error State */}
        {error && (
          <ErrorAlert
            title="Unable to load groups"
            message={error}
            variant="card"
          />
        )}

        {/* Empty State */}
        {!loading && !error && filteredGroups.length === 0 && (
          <EmptyState
            icon="package"
            title={`No ${activeTab} groups`}
            description={
              activeTab === 'active'
                ? "You haven't joined any groups yet. Browse available groups to get started!"
                : activeTab === 'ready'
                ? "No groups are ready for pickup yet."
                : "You don't have any completed orders."
            }
            actionLabel={activeTab === 'active' ? 'Browse Groups' : undefined}
            onAction={activeTab === 'active' ? () => navigate('/all-groups') : undefined}
          />
        )}

        {/* Groups Grid */}
        {!loading && !error && filteredGroups.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map((group) => (
              <Card key={group.id} variant="elevated" hoverable>
                {/* Product Image */}
                <div className="relative h-48 bg-gray-100 flex items-center justify-center">
                  {group.product_image_url ? (
                    <img 
                      src={group.product_image_url} 
                      alt={group.product_name} 
                      className="h-full w-full object-cover" 
                    />
                  ) : (
                    <span className="text-5xl text-gray-400">📦</span>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    {activeTab === 'active' && (
                      <>
                        {(group.amount_progress || group.moq_progress || 0) >= 100 ? (
                          <Badge variant="success" size="sm" leftIcon={<CheckCircle className="h-3 w-3" />}>
                            Goal Reached
                          </Badge>
                        ) : (
                          <Badge variant="info" size="sm">Active</Badge>
                        )}
                      </>
                    )}
                    {activeTab === 'ready' && (
                      <Badge variant="success" size="sm">Ready</Badge>
                    )}
                    {activeTab === 'past' && (
                      <Badge variant="ghost" size="sm">Completed</Badge>
                    )}
                  </div>
                </div>

                {/* Group Info */}
                <div className="p-4 space-y-3">
                  <h3 className="heading-5 line-clamp-2">{group.product_name}</h3>
                  
                  {/* Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Your quantity:</span>
                      <span className="font-medium">{group.quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount paid:</span>
                      <span className="font-medium text-green-600">
                        ${(group.total_paid || 0).toFixed(2)}
                      </span>
                    </div>
                    {activeTab === 'active' && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Progress:</span>
                        <span className="font-medium">{group.moq_progress || 0}%</span>
                      </div>
                    )}
                    {group.delivery_location && activeTab === 'ready' && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pickup:</span>
                        <span className="font-medium">{group.delivery_location}</span>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar (Active only) */}
                  {activeTab === 'active' && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>${(group.current_amount || 0).toFixed(0)} raised</span>
                        <span>${(group.target_amount || 0).toFixed(0)} target</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            (group.amount_progress || group.moq_progress || 0) >= 100 
                              ? 'bg-success-600' 
                              : 'bg-primary-600'
                          }`}
                          style={{ width: `${Math.min(group.amount_progress || group.moq_progress || 0, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 text-center">
                        {group.participants_count || group.participants} people joined
                      </p>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewGroup(group)}
                    leftIcon={<Eye className="h-4 w-4" />}
                    fullWidth
                  >
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </PageContainer>

      <MobileBottomNav userRole="trader" />
    </div>
  );
}
