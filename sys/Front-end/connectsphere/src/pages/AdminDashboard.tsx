import { Zap, Users, Eye, ShoppingBag, TrendingUp, DollarSign, AlertTriangle, RefreshCw, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import StatCard from '../components/StatCard';
import Layout from '../components/Layout';
import apiService from '../services/api';

interface ManagementCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonText: string;
  link: string;
}

const ManagementCard = ({ icon, title, description, buttonText, link }: ManagementCardProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 flex flex-col">
      <div className="text-blue-600 mb-4">{icon}</div>
      <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4 flex-grow">{description}</p>
      <button
        onClick={() => navigate(link)}
        className="inline-block text-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
      >
        {buttonText}
      </button>
    </div>
  );
};

type TrainingStage = 'data_collection' | 'matrix_building' | 'clustering' | 'nmf_training' | 'tfidf_processing' | 'hybrid_fusion' | 'model_saving' | null;

const trainingStages: { id: TrainingStage; label: string }[] = [
  { id: 'data_collection', label: 'Data Collection' },
  { id: 'matrix_building', label: 'Matrix Building' },
  { id: 'clustering', label: 'Clustering' },
  { id: 'nmf_training', label: 'NMF Training' },
  { id: 'tfidf_processing', label: 'TF-IDF Processing' },
  { id: 'hybrid_fusion', label: 'Hybrid Fusion' },
  { id: 'model_saving', label: 'Model Saving' }
];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'management' | 'qr-verify'>('overview');
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'none' | 'success' | 'error' | 'loading'>('none');
  const [nextRetrainTime, setNextRetrainTime] = useState<Date>(new Date(Date.now() + 12 * 60 * 60 * 1000));
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isRetraining, setIsRetraining] = useState(false);
  const [currentStage, setCurrentStage] = useState<TrainingStage>(null);
  const [trainingProgress, setTrainingProgress] = useState<number>(0);
  const [trainingMessage, setTrainingMessage] = useState<string>('');
  const [trainingResults, setTrainingResults] = useState<any>(null);
  const [trainingError, setTrainingError] = useState<string | null>(null);
  
  // WebSocket reference
  const wsRef = useRef<WebSocket | null>(null);
  
  // Dashboard data state
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [modelPerformanceData, setModelPerformanceData] = useState<any[]>([]);
  const [trainingProgressData, setTrainingProgressData] = useState<any[]>([]);
  const [mlSystemStatus, setMlSystemStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = nextRetrainTime.getTime() - Date.now();
      
      if (difference <= 0) {
        setTimeLeft('Ready to retrain');
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [nextRetrainTime]);

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Load dashboard stats
        const stats = await apiService.getDashboardStats();
        setDashboardStats(stats);
        
        // Load activity data (mock for now, could be from API)
        setActivityData([
          { month: 'Jan', groups: 150, users: 180 },
          { month: 'Feb', groups: 180, users: 220 },
          { month: 'Mar', groups: 280, users: 290 },
          { month: 'Apr', groups: 250, users: 270 },
          { month: 'May', groups: 320, users: 350 },
          { month: 'Jun', groups: 380, users: 420 },
        ]);
        
        // Load model performance data from API
        const performanceData = await apiService.getMLPerformance();
        setModelPerformanceData([
          { name: 'Accuracy', value: performanceData.accuracy || 0 },
          { name: 'Precision', value: performanceData.precision || 0 },
          { name: 'Recall', value: performanceData.recall || 0 },
          { name: 'F1 Score', value: performanceData.f1_score || 0 },
        ]);
        
        // Load training progress data (mock for now)
        setTrainingProgressData([
          { subject: 'Data Quality', A: 90 },
          { subject: 'Model Training', A: 85 },
          { subject: 'Validation', A: 88 },
          { subject: 'Testing', A: 82 },
          { subject: 'Deployment', A: 95 },
        ]);
        
        // Load ML system status
        const mlStatus = await apiService.getMLSystemStatus();
        setMlSystemStatus(mlStatus);
        
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket('ws://localhost:8000/ws/ml-training');
        
        ws.onopen = () => {
          console.log('WebSocket connected for ML training progress');
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('WebSocket message received:', data);
            
            if (data.type === 'progress') {
              setIsRetraining(true);
              setCurrentStage(data.stage as TrainingStage);
              setTrainingProgress(data.progress);
              setTrainingMessage(data.message);
              setTrainingError(null);
            } else if (data.type === 'completed') {
              setIsRetraining(false);
              setCurrentStage(null);
              setTrainingProgress(100);
              setTrainingMessage(data.message);
              setTrainingResults(data.results);
              setTrainingError(null);
              setNextRetrainTime(new Date(Date.now() + 24 * 60 * 60 * 1000)); // Reset to 24 hours
            } else if (data.type === 'error') {
              setIsRetraining(false);
              setCurrentStage(null);
              setTrainingProgress(0);
              setTrainingError(data.error || data.message);
              setTrainingMessage('');
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        ws.onclose = () => {
          console.log('WebSocket disconnected');
          // Attempt to reconnect after a delay
          setTimeout(connectWebSocket, 5000);
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
        
        wsRef.current = ws;
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
      }
    };

    connectWebSocket();

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const handleRetrain = async () => {
    const shouldRetrain = window.confirm('Are you sure you want to start the model retraining process?');
    if (shouldRetrain) {
      try {
        // Reset training state
        setTrainingProgress(0);
        setTrainingMessage('');
        setTrainingError(null);
        setTrainingResults(null);
        
        // Call the real API
        await apiService.retrainMLModels();
        
        // The WebSocket will handle progress updates
      } catch (error) {
        console.error('Retraining failed:', error);
        setTrainingError('Failed to start retraining. Please try again.');
      }
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <Layout title="Admin Dashboard">


      {/* Tabs - Clear visual hierarchy and state */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-[73px] z-40">
        <div className="px-3 sm:px-6">
          <nav className="flex gap-4 sm:gap-8" role="tablist" aria-label="Admin sections">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 text-sm font-medium border-b-2 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                activeTab === 'overview' 
                  ? 'border-blue-600 text-blue-600 font-semibold' 
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
              role="tab"
              aria-selected={activeTab === 'overview'}
              aria-controls="overview-panel"
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 text-sm font-medium border-b-2 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                activeTab === 'analytics' 
                  ? 'border-blue-600 text-blue-600 font-semibold' 
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
              role="tab"
              aria-selected={activeTab === 'analytics'}
              aria-controls="analytics-panel"
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('management')}
              className={`py-4 text-sm font-medium border-b-2 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                activeTab === 'management' 
                  ? 'border-blue-600 text-blue-600 font-semibold' 
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
              role="tab"
              aria-selected={activeTab === 'management'}
              aria-controls="management-panel"
            >
              Management
            </button>
            <button
              onClick={() => setActiveTab('qr-verify')}
              className={`py-4 text-sm font-medium border-b-2 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                activeTab === 'qr-verify' 
                  ? 'border-blue-600 text-blue-600 font-semibold' 
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
              role="tab"
              aria-selected={activeTab === 'qr-verify'}
              aria-controls="qr-verify-panel"
            >
              QR Verification
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs sm:text-sm font-medium w-fit">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Admin Tools</span>
            </div>
          </div>
          <p className="text-sm sm:text-base text-gray-600">Platform metrics, moderation tools, and system settings for ConnectSphere</p>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Analytics Summary */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Analytics Summary</h2>
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700">{error}</p>
                </div>
              ) : dashboardStats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    title="Total Users"
                    value={dashboardStats.total_users?.toString() || "0"}
                    icon={<Users className="w-6 h-6" />}
                    color="blue"
                  />
                  <StatCard
                    title="Active Groups"
                    value={dashboardStats.active_group_buys?.toString() || "0"}
                    icon={<Eye className="w-6 h-6" />}
                    color="green"
                  />
                  <StatCard
                    title="Total Transactions"
                    value={dashboardStats.total_products?.toString() || "0"}
                    icon={<ShoppingBag className="w-6 h-6" />}
                    color="blue"
                  />
                  <StatCard
                    title="Revenue"
                    value={`$${dashboardStats.total_revenue?.toFixed(2) || "0.00"}`}
                    icon={<DollarSign className="w-6 h-6" />}
                    color="red"
                  />
                </div>
              ) : null}
            </div>

            {/* Platform Activity */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Activity</h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="groups" fill="#3B82F6" name="New Groups" />
                      <Bar dataKey="users" fill="#93C5FD" name="New Users" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-12">
            {/* Retrain Button and Timer */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Next Scheduled Retrain</h3>
                    <p className="text-lg font-bold text-blue-600">{timeLeft}</p>
                  </div>
                </div>
                <button
                  onClick={handleRetrain}
                  disabled={isRetraining}
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg transition-colors duration-200 font-semibold shadow-sm
                    ${isRetraining 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                >
                  <RefreshCw className={`w-5 h-5 ${isRetraining ? 'animate-spin' : ''}`} />
                  {isRetraining ? 'Retraining...' : 'Retrain Model'}
                </button>
              </div>

              {/* Training Progress Line */}
              {(isRetraining || trainingProgress > 0) && (
                <div className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">
                        {trainingMessage || 'Initializing training...'}
                      </span>
                      <span className="text-sm font-medium text-blue-600">
                        {trainingProgress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${trainingProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Error Display */}
                  {trainingError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-700 text-sm">{trainingError}</p>
                    </div>
                  )}

                  {/* Results Display */}
                  {trainingResults && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-green-700 text-sm font-medium">Training completed successfully!</p>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <div>Silhouette Score: {trainingResults.silhouette_score?.toFixed(3)}</div>
                        <div>Clusters: {trainingResults.n_clusters}</div>
                        <div>NMF Rank: {trainingResults.nmf_rank}</div>
                        <div>TF-IDF Vocab: {trainingResults.tfidf_vocab_size}</div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center relative">
                    {/* Progress Line */}
                    <div className="absolute left-0 right-0 top-1/2 h-1 bg-gray-200 -translate-y-1/2" />
                    <div 
                      className="absolute left-0 top-1/2 h-1 bg-blue-600 -translate-y-1/2 transition-all duration-300"
                      style={{
                        width: `${
                          currentStage
                            ? ((trainingStages.findIndex(s => s.id === currentStage) + 1) / trainingStages.length) * 100
                            : trainingProgress
                        }%`
                      }}
                    />
                    
                    {/* Stage Markers */}
                    {trainingStages.map((stage, index) => {
                      const isCompleted = currentStage 
                        ? trainingStages.findIndex(s => s.id === currentStage) > index
                        : trainingProgress >= ((index + 1) / trainingStages.length) * 100;
                      const isCurrent = stage.id === currentStage;
                      
                      return (
                        <div 
                          key={stage.id}
                          className="relative z-10 flex flex-col items-center gap-2"
                          style={{ width: '20px' }}
                        >
                          <div 
                            className={`w-5 h-5 rounded-full border-2 transition-colors duration-200
                              ${isCurrent 
                                ? 'border-blue-600 bg-white' 
                                : isCompleted 
                                  ? 'border-blue-600 bg-blue-600'
                                  : 'border-gray-300 bg-white'}`}
                          />
                          <p className={`text-xs font-medium whitespace-nowrap transition-colors duration-200
                            ${isCurrent 
                              ? 'text-blue-600' 
                              : isCompleted 
                                ? 'text-gray-700'
                                : 'text-gray-400'}`}
                          >
                            {stage.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            {/* Model Performance Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Model Performance Metrics</h3>
                  <p className="text-sm text-gray-600 mt-1">Evaluation metrics for the recommendation system</p>
                </div>
              </div>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={modelPerformanceData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={160}
                      innerRadius={120}
                      label
                    >
                      {modelPerformanceData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-4 gap-4 mt-8">
                {modelPerformanceData.map((metric, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">{metric.name}</p>
                    <p className="text-xl font-semibold text-gray-900 mt-1">{metric.value}%</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Training Stage Progress */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Training Stage Progress</h3>
                  <p className="text-sm text-gray-600 mt-1">Current progress across different training stages</p>
                </div>
              </div>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={trainingProgressData}>
                    <PolarGrid stroke="#E5E7EB" />
                    <PolarAngleAxis dataKey="subject" stroke="#6B7280" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#6B7280" />
                    <Radar name="Progress" dataKey="A" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.4} />
                    <Legend verticalAlign="bottom" height={36} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 rounded-lg ${
                  mlSystemStatus?.health_status === 'operational' ? 'bg-green-100' :
                  mlSystemStatus?.health_status === 'warning' ? 'bg-yellow-100' :
                  mlSystemStatus?.health_status === 'critical' ? 'bg-red-100' : 'bg-gray-100'
                }`}>
                  <div className="w-6 h-6 flex items-center justify-center">
                    <div className={`w-3 h-3 rounded-full ${
                      mlSystemStatus?.health_status === 'operational' ? 'bg-green-500' :
                      mlSystemStatus?.health_status === 'warning' ? 'bg-yellow-500' :
                      mlSystemStatus?.health_status === 'critical' ? 'bg-red-500' : 'bg-gray-500'
                    }`}></div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">ML System Status</h3>
                  <p className="text-sm text-gray-600 mt-1">Real-time health monitoring of ML services</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                <div className={`border rounded-lg p-6 ${
                  mlSystemStatus?.health_status === 'operational' ? 'bg-green-50 border-green-200' :
                  mlSystemStatus?.health_status === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  mlSystemStatus?.health_status === 'critical' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${
                      mlSystemStatus?.health_status === 'operational' ? 'bg-green-500' :
                      mlSystemStatus?.health_status === 'warning' ? 'bg-yellow-500' :
                      mlSystemStatus?.health_status === 'critical' ? 'bg-red-500' : 'bg-gray-500'
                    }`}></div>
                    <p className={`font-medium ${
                      mlSystemStatus?.health_status === 'operational' ? 'text-green-900' :
                      mlSystemStatus?.health_status === 'warning' ? 'text-yellow-900' :
                      mlSystemStatus?.health_status === 'critical' ? 'text-red-900' : 'text-gray-900'
                    }`}>System Health</p>
                  </div>
                  <p className={`text-sm ${
                    mlSystemStatus?.health_status === 'operational' ? 'text-green-800' :
                    mlSystemStatus?.health_status === 'warning' ? 'text-yellow-800' :
                    mlSystemStatus?.health_status === 'critical' ? 'text-red-800' : 'text-gray-800'
                  }`}>{mlSystemStatus?.system_health || 'Loading...'}</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <p className="font-medium text-blue-900">Response Time</p>
                  </div>
                  <p className="text-sm text-blue-800">{mlSystemStatus?.response_time_display || 'Loading...'}</p>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <p className="font-medium text-purple-900">Model Updates</p>
                  </div>
                  <p className="text-sm text-purple-800">{mlSystemStatus?.model_updates || 'Loading...'}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mt-6">
                <h4 className="font-semibold text-gray-900 mb-4">System Health Checklist</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className={`w-2 h-2 rounded-full ${mlSystemStatus?.checklist?.recommendation_engine ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span>Recommendation Engine: {mlSystemStatus?.checklist?.recommendation_engine ? 'Operational' : 'Down'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className={`w-2 h-2 rounded-full ${mlSystemStatus?.checklist?.data_processing_pipeline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span>Data Processing Pipeline: {mlSystemStatus?.checklist?.data_processing_pipeline ? 'Running' : 'Stopped'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className={`w-2 h-2 rounded-full ${mlSystemStatus?.checklist?.model_serving_api ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span>Model Serving API: {mlSystemStatus?.checklist?.model_serving_api ? 'Active' : 'Inactive'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className={`w-2 h-2 rounded-full ${mlSystemStatus?.checklist?.training_infrastructure ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span>Training Infrastructure: {mlSystemStatus?.checklist?.training_infrastructure ? 'Available' : 'Unavailable'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'qr-verify' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">QR Code Verification</h2>
              <div className="max-w-xl mx-auto">
                <div className="aspect-square w-full relative bg-gray-50 rounded-lg overflow-hidden mb-6 border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 15h4.01M12 21h4.01M12 12h4.01M12 15h4.01M12 21h4.01M12 12h4.01M12 15h4.01M12 21h4.01" />
                      </svg>
                    </div>
                    <p className="text-gray-600 font-medium">QR Scanner Coming Soon</p>
                    <p className="text-sm text-gray-500 mt-1">This feature will allow branch staff to scan QR codes for pickup verification.</p>
                  </div>
                </div>

                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">How it works:</h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>1. Customers receive QR codes when their group buy is ready for pickup</li>
                    <li>2. Branch staff scan the QR code to verify the customer's order</li>
                    <li>3. System validates the QR code and marks the pickup as complete</li>
                    <li>4. Customer receives their products and payment is processed</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'management' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Management Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ManagementCard
                icon={<Users className="w-8 h-8" />}
                title="User Management"
                description="View, edit, or remove user accounts and manage their roles and permissions."
                buttonText="Manage Users"
                link="/users"
              />
              <ManagementCard
                icon={<ShoppingBag className="w-8 h-8" />}
                title="Group Moderation"
                description="Oversee and moderate group-buy listings, ensuring compliance and quality."
                buttonText="Moderate Groups"
                link="/moderation"
              />
              <ManagementCard
                icon={<TrendingUp className="w-8 h-8" />}
                title="Product Catalog"
                description="Update and manage the inventory of products available for group buying."
                buttonText="Edit Products"
                link="/products"
              />
              <ManagementCard
                icon={<DollarSign className="w-8 h-8" />}
                title="System Settings"
                description="Configure global platform settings, notifications, and error integration points."
                buttonText="Configure System"
                link="/settings"
              />
            </div>
          </div>
        )}
      </main>

      {/* Admin Helper Message */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8 mx-4 sm:mx-6 lg:mx-8 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900">Admin Guidelines</h3>
            <p className="text-sm text-blue-700 mt-1">Important information for managing groups</p>
          </div>
        </div>
        <div className="space-y-3 text-sm text-blue-800">
          <p>• As an admin, you are responsible for creating new group buying opportunities for traders</p>
          <p>• Set realistic target member counts and deadlines to ensure group success</p>
          <p>• Monitor active groups and process payments promptly when targets are reached</p>
          <p>• Ensure accurate product descriptions and pricing information</p>
          <p>• Coordinate with local pickup locations for smooth delivery process</p>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
