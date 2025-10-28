import { Zap, Users, Eye, ShoppingBag, TrendingUp, DollarSign, RefreshCw, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, PieChart, Pie, Cell } from 'recharts';
import StatCard from '../components/StatCard';
import Layout from '../components/Layout';
import apiService from '../services/api';
import QrScanner from 'qr-scanner';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'ml-visualisations' | 'management' | 'qr-verify'>('overview');
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
  
  // QR Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const qrScannerRef = useRef<QrScanner | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
    // QR Code helper functions
  const handleQRScan = async (qrCodeData: string) => {
    if (!qrCodeData) return;
    
    setVerificationStatus('loading');
    setErrorMessage('');
    
    try {
      const result = await apiService.scanQRCode(qrCodeData);
      setScanResult(result);
      setVerificationStatus('success');
      setLastScannedCode(qrCodeData);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to scan QR code');
      setVerificationStatus('error');
      setScanResult(null);
    }
  };

  // QR Scanner functions
  const startScanning = async () => {
    if (!videoRef.current) return;

    try {
      setIsScanning(true);
      setErrorMessage('');
      setScanResult(null);

      const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          console.log('QR Code detected:', result.data);
          handleQRScan(result.data);
          stopScanning();
        },
        {
          onDecodeError: (error) => {
            console.log('QR decode error:', error);
          },
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      qrScannerRef.current = scanner;
      await scanner.start();
    } catch (error: any) {
      console.error('Failed to start QR scanner:', error);
      setErrorMessage('Failed to access camera. Please ensure camera permissions are granted.');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
  };

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };
  
  const calculateSavings = (unitPrice: number, bulkPrice: number) => {
    return unitPrice - bulkPrice;
  };
  
  const calculateSavingsPercentage = (unitPrice: number, bulkPrice: number) => {
    if (unitPrice <= 0) return 0;
    return ((unitPrice - bulkPrice) / unitPrice) * 100;
  };
  
  // Dashboard data state
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [modelPerformanceData, setModelPerformanceData] = useState<any[]>([]);
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
        
        // Load activity data from backend (last 6 months)
        try {
          const activity = await apiService.getActivityData({ months: 6 });
          // activity is expected as [{ month, month_key, groups, users }, ...]
          setActivityData((activity || []).map((d: any) => ({ month: d.month, groups: d.groups, users: d.users })));
        } catch (err) {
          console.warn('Failed to load activity data from API, falling back to empty array', err);
          setActivityData([]);
        }
        
        // Load model performance data from API (pick latest model if array)
        try {
          const perfArray: any = await apiService.getMLPerformance();
          const latest: any = Array.isArray(perfArray) && perfArray.length > 0 ? perfArray[0] : null;
          const silhouette = latest ? (latest.silhouette_score || 0) : 0;
          const n_clusters = latest ? (latest.n_clusters || 0) : 0;
          const nmf_rank = latest ? (latest.nmf_rank || 0) : 0;
          const tfidf_vocab = latest ? (latest.tfidf_vocab_size || 0) : 0;

          // Represent silhouette as percentage for readability (e.g., 3.8%)
          const silhouettePct = +(silhouette * 100).toFixed(2);

          setModelPerformanceData([
            { name: 'Silhouette', value: silhouettePct, unit: '%' },
            { name: 'Clusters', value: n_clusters, unit: '' },
            { name: 'NMF Rank', value: nmf_rank, unit: '' },
            { name: 'TF-IDF Vocab', value: tfidf_vocab, unit: '' },
          ]);
        } catch (err) {
          console.warn('Failed to load ML performance from API', err);
          setModelPerformanceData([]);
        }
        
        // Load ML system status
        const mlStatus = await apiService.getMLSystemStatus();
        setMlSystemStatus(mlStatus);      } catch (err) {
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
              onClick={() => setActiveTab('ml-visualisations')}
              className={`py-4 text-sm font-medium border-b-2 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                activeTab === 'ml-visualisations' 
                  ? 'border-blue-600 text-blue-600 font-semibold' 
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
              role="tab"
              aria-selected={activeTab === 'ml-visualisations'}
              aria-controls="analytics-panel"
            >
              ML Visualisations
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
                    value={dashboardStats.total_transactions?.toString() || "0"}
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

        {activeTab === 'ml-visualisations' && (
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
                {modelPerformanceData.map((metric: any, index: number) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">{metric.name}</p>
                    <p className="text-xl font-semibold text-gray-900 mt-1">
                      {metric.unit === '%' ? `${metric.value}${metric.unit}` : `${metric.value}`}
                    </p>
                  </div>
                ))}
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
              <div className="max-w-2xl mx-auto">
                {/* QR Scanner */}
                <div className="aspect-square w-full relative bg-gray-50 rounded-lg overflow-hidden mb-6 border-2 border-dashed border-gray-300">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />
                  {!isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 15h4.01M12 21h4.01M12 12h4.01M12 15h4.01M12 21h4.01M12 12h4.01M12 15h4.01M12 21h4.01" />
                          </svg>
                        </div>
                        <p className="text-gray-600 font-medium">Camera Ready</p>
                        <p className="text-sm text-gray-500 mt-1">Click start to begin scanning</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex gap-3 mb-6">
                  <button
                    onClick={isScanning ? stopScanning : startScanning}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                      isScanning
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isScanning ? 'Stop Scanning' : 'Start Scanning'}
                  </button>
                  <button
                    onClick={() => {
                      setScanResult(null);
                      setErrorMessage('');
                      setVerificationStatus('none');
                      setLastScannedCode(null);
                    }}
                    className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    Clear
                  </button>
                </div>

                {/* Error Message */}
                {errorMessage && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <div className="text-red-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-red-700 font-medium">{errorMessage}</p>
                    </div>
                  </div>
                )}

                {/* Scan Results */}
                {scanResult && (
                  <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="text-green-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-green-700 font-medium">QR Code Verified Successfully!</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* User Info */}
                      <div className="bg-white rounded-lg p-3">
                        <h4 className="font-medium text-gray-900 mb-2">Customer Information</h4>
                        <div className="space-y-1 text-sm">
                          <p><span className="font-medium">Name:</span> {scanResult.user_info?.full_name || 'N/A'}</p>
                          <p><span className="font-medium">Email:</span> {scanResult.user_info?.email || 'N/A'}</p>
                          <p><span className="font-medium">Location:</span> {scanResult.user_info?.location_zone || 'N/A'}</p>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="bg-white rounded-lg p-3">
                        <h4 className="font-medium text-gray-900 mb-2">Product Information</h4>
                        <div className="space-y-1 text-sm">
                          <p><span className="font-medium">Product:</span> {scanResult.product_info?.name || 'N/A'}</p>
                          <p><span className="font-medium">Price:</span> ${scanResult.product_info?.unit_price || 'N/A'}</p>
                          <p><span className="font-medium">Category:</span> {scanResult.product_info?.category || 'N/A'}</p>
                        </div>
                      </div>

                      {/* Purchase Info */}
                      <div className="bg-white rounded-lg p-3">
                        <h4 className="font-medium text-gray-900 mb-2">Purchase Details</h4>
                        <div className="space-y-1 text-sm">
                          <p><span className="font-medium">Quantity:</span> {scanResult.purchase_info?.quantity || 'N/A'}</p>
                          <p><span className="font-medium">Amount:</span> ${scanResult.purchase_info?.amount || 'N/A'}</p>
                          <p><span className="font-medium">Date:</span> {scanResult.purchase_info?.purchase_date ? new Date(scanResult.purchase_info.purchase_date).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </div>

                      {/* QR Status */}
                      <div className="bg-white rounded-lg p-3">
                        <h4 className="font-medium text-gray-900 mb-2">QR Code Status</h4>
                        <div className="space-y-1 text-sm">
                          <p><span className="font-medium">Used:</span> {scanResult.qr_status?.is_used ? 'Yes' : 'No'}</p>
                          <p><span className="font-medium">Generated:</span> {scanResult.qr_status?.generated_at ? new Date(scanResult.qr_status.generated_at).toLocaleDateString() : 'N/A'}</p>
                          <p><span className="font-medium">Expires:</span> {scanResult.qr_status?.expires_at ? new Date(scanResult.qr_status.expires_at).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Instructions */}
                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">How it works:</h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>1. Click "Start Scanning" to activate the camera</li>
                    <li>2. Point the camera at a customer's QR code</li>
                    <li>3. The system will automatically scan and verify the QR code</li>
                    <li>4. Review the customer and purchase information</li>
                    <li>5. Complete the pickup process and mark the QR code as used</li>
                  </ul>
                </div>

                {/* Last Scanned Code */}
                {lastScannedCode && (
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-700">
                      <span className="font-medium">Last scanned:</span> {lastScannedCode.substring(0, 20)}...
                    </p>
                  </div>
                )}
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
    </Layout>
  );
};

export default AdminDashboard;
