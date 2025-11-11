import { Users, Eye, ShoppingBag, TrendingUp, DollarSign, RefreshCw, Clock } from 'lucide-react';
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
  // Load active tab from localStorage or default to 'overview'
  const [activeTab, setActiveTab] = useState<'overview' | 'ml-visualisations' | 'management' | 'qr-verify'>(() => {
    const savedTab = localStorage.getItem('admin-dashboard-active-tab');
    return (savedTab as 'overview' | 'ml-visualisations' | 'management' | 'qr-verify') || 'overview';
  });
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
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
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
    // QR Code helper functions
  const handleQRScan = async (qrCodeData: string) => {
    if (!qrCodeData) return;

    setErrorMessage('');

    try {
      // Always fetch fresh data from the server to avoid cache issues
      const result = await apiService.scanQRCode(qrCodeData);
      setScanResult(result);
      setLastScannedCode(qrCodeData);
      
      // Add to scan history locally for immediate feedback
      const scanEntry = {
        qrCode: qrCodeData,
        timestamp: new Date(),
        userInfo: result.user_info,
        productInfo: result.product_info,
        purchaseInfo: result.purchase_info
      };
      setScanHistory(prev => [scanEntry, ...prev].slice(0, 50)); // Keep last 50 scans

      // Refresh scan history from API to get the latest data
      try {
        const history = await apiService.getQRScanHistory(50, 0);
        const transformedHistory = history.scans.map((scan: any) => ({
          qrCode: scan.qr_code,
          timestamp: new Date(scan.scanned_at),
          userInfo: scan.user_info,
          productInfo: scan.product_info,
          purchaseInfo: scan.purchase_info
        }));
        setScanHistory(transformedHistory);
      } catch (refreshError) {
        console.error('Failed to refresh scan history:', refreshError);
        // Keep the local update if API refresh fails
      }
    } catch (error: any) {
      console.error('QR Scan Error Details:', error);
      
      // Extract detailed error message
      let errorDetail = error.message || 'Failed to scan QR code';
      
      // Add timestamp for admin reference
      const timestamp = new Date().toLocaleString();
      const fullErrorMessage = `${errorDetail}\n\nTime: ${timestamp}\nQR Code: ${qrCodeData?.substring(0, 20)}...`;
      
      setErrorMessage(fullErrorMessage);
      setScanResult(null);
    }
  };

  // Function to refresh the current scan result with fresh data from database
  const refreshScanResult = async () => {
    if (lastScannedCode) {
      console.log('Refreshing scan result with fresh data...');
      await handleQRScan(lastScannedCode);
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

  // Load QR scan history on mount and clear any stale scan results
  useEffect(() => {
    const loadScanHistory = async () => {
      try {
        const history = await apiService.getQRScanHistory(50, 0);
        // Transform API response to match current scanHistory format
        const transformedHistory = history.scans.map((scan: any) => ({
          qrCode: scan.qr_code,
          timestamp: new Date(scan.scanned_at),
          userInfo: scan.user_info,
          productInfo: scan.product_info,
          purchaseInfo: scan.purchase_info
        }));
        setScanHistory(transformedHistory);
      } catch (error) {
        console.error('Failed to load scan history:', error);
        // Don't show error to user, just log it
      }
    };

    // Clear any stale scan results when switching to QR verification tab
    if (activeTab === 'qr-verify') {
      setScanResult(null);
      setErrorMessage('');
      setLastScannedCode(null);
    }

    loadScanHistory();
  }, [activeTab]);

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('admin-dashboard-active-tab', activeTab);
  }, [activeTab]);
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
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4">
                {/* Main Layout - Camera and Instructions/Results */}
                <div className={`grid gap-6 ${scanResult || !scanResult ? 'lg:grid-cols-2' : 'max-w-2xl mx-auto'}`}>
                  
                  {/* Camera Section - Always on left */}
                  <div className="space-y-3">
                    {/* QR Scanner */}
                    <div className="aspect-square w-64 mx-auto relative bg-gray-50 rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        playsInline
                        muted
                      />
                      {!isScanning && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-80">
                          <div className="bg-gray-50 rounded-lg p-2">
                            <div className="text-center">
                              <div className="w-6 h-6 mx-auto mb-1 text-gray-400 bg-gray-100 rounded-full flex items-center justify-center">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-3 h-3">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10l4.553-2.276A1 1 0 0119 8.618v6.764a1 1 0 01-1.447.894L13 14M3 18h8a2 2 0 002-2V8a2 2 0 00-2-2H3a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <p className="text-gray-900 font-medium text-sm">Camera Ready</p>
                              <p className="text-xs text-gray-600 mt-0.5">Click "Start Scanning" to activate the camera</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Controls */}
                    <div className="flex gap-2">
                      <button
                        onClick={isScanning ? stopScanning : startScanning}
                        className={`flex-1 py-2 px-3 text-sm rounded-lg font-medium transition-colors ${
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
                          setLastScannedCode(null);
                        }}
                        className="px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                      >
                        Clear
                      </button>
                    </div>

                    {/* Last Scanned Code */}
                    {lastScannedCode && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-700">
                          <span className="font-medium">Last scanned:</span> {lastScannedCode.substring(0, 20)}...
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right Side - Instructions, Errors, or Results */}
                  <div className="space-y-4">
                    {/* Error Message - Show whenever there's an error */}
                    {errorMessage && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="text-red-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <p className="text-red-800 font-semibold text-base">QR Scan Error</p>
                        </div>
                        <div className="text-red-700 bg-red-100 px-3 py-2 rounded-md border border-red-200 whitespace-pre-line">
                          {errorMessage}
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <p className="text-sm text-red-600">Try scanning again or ask the customer for a new QR code.</p>
                          <button
                            onClick={() => setErrorMessage('')}
                            className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 rounded-md hover:bg-red-100 transition-colors"
                          >
                            Clear Error
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Instructions - Show when no scan result and no error */}
                    {!scanResult && !errorMessage && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-base font-semibold text-gray-900 mb-3">How it works:</h3>
                        <ul className="text-xs text-gray-600 space-y-2">
                          <li className="flex items-start gap-2">
                            <span className="flex-shrink-0 w-4 h-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">1</span>
                            <span>Click "Start Scanning" to activate the camera</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="flex-shrink-0 w-4 h-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">2</span>
                            <span>Point the camera at a customer's QR code</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="flex-shrink-0 w-4 h-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">3</span>
                            <span>The system will automatically scan and verify the QR code</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="flex-shrink-0 w-4 h-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">4</span>
                            <span>Review the customer and purchase information</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="flex-shrink-0 w-4 h-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">5</span>
                            <span>Complete the pickup process and mark the QR code as used</span>
                          </li>
                        </ul>
                      </div>
                    )}

                    {/* Scan Results - Show when there's a successful scan result */}
                    {scanResult && (
                      <div className="space-y-3">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="text-green-500">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <p className="text-green-800 font-semibold text-base">QR Code Verified Successfully!</p>
                          </div>                        <div className="grid grid-cols-1 gap-3">
                            {/* User Info */}
                            <div className="bg-white rounded-lg p-3 border border-green-100">
                              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Customer Information
                              </h4>
                              <div className="space-y-1 text-xs">
                                <p><span className="font-medium text-gray-600">Name:</span> <span className="text-gray-900">{scanResult.user_info?.full_name || 'N/A'}</span></p>
                                <p><span className="font-medium text-gray-600">Email:</span> <span className="text-gray-900">{scanResult.user_info?.email || 'N/A'}</span></p>
                                <p><span className="font-medium text-gray-600">Location:</span> <span className="text-gray-900">{scanResult.user_info?.location_zone || 'N/A'}</span></p>
                              </div>
                            </div>

                            {/* Product Info */}
                            <div className="bg-white rounded-lg p-3 border border-green-100">
                              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                Product Information
                              </h4>
                              <div className="space-y-1 text-xs">
                                <p><span className="font-medium text-gray-600">Product:</span> <span className="text-gray-900">{scanResult.product_info?.name || 'N/A'}</span></p>
                                <p><span className="font-medium text-gray-600">Price:</span> <span className="text-gray-900">${scanResult.product_info?.unit_price || 'N/A'}</span></p>
                                <p><span className="font-medium text-gray-600">Category:</span> <span className="text-gray-900">{scanResult.product_info?.category || 'N/A'}</span></p>
                              </div>
                            </div>

                            {/* Purchase Info */}
                            <div className="bg-white rounded-lg p-3 border border-green-100">
                              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                Purchase Details
                              </h4>
                              <div className="space-y-1 text-xs">
                                <p><span className="font-medium text-gray-600">Quantity:</span> <span className="text-gray-900">{scanResult.purchase_info?.quantity || 'N/A'}</span></p>
                                <p><span className="font-medium text-gray-600">Amount:</span> <span className="text-gray-900">${scanResult.purchase_info?.amount || 'N/A'}</span></p>
                                <p><span className="font-medium text-gray-600">Date:</span> <span className="text-gray-900">{scanResult.purchase_info?.purchase_date ? new Date(scanResult.purchase_info.purchase_date).toLocaleDateString() : 'N/A'}</span></p>
                              </div>
                            </div>

                            {/* QR Status */}
                            <div className="bg-white rounded-lg p-3 border border-green-100">
                              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <svg className="w-3 h-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 15h4.01M12 21h4.01M12 12h4.01M12 15h4.01M12 21h4.01M12 12h4.01M12 15h4.01M12 21h4.01" />
                                </svg>
                                QR Code Status
                              </h4>
                              <div className="space-y-1 text-xs">
                                <p><span className="font-medium text-gray-600">Used:</span> <span className={`font-medium ${scanResult.qr_status?.is_used ? 'text-red-600' : 'text-green-600'}`}>{scanResult.qr_status?.is_used ? 'Yes' : 'No'}</span></p>
                                <p><span className="font-medium text-gray-600">Generated:</span> <span className="text-gray-900">{scanResult.qr_status?.generated_at ? new Date(scanResult.qr_status.generated_at).toLocaleDateString() : 'N/A'}</span></p>
                                <p><span className="font-medium text-gray-600">Expires:</span> <span className="text-gray-900">{scanResult.qr_status?.expires_at ? new Date(scanResult.qr_status.expires_at).toLocaleDateString() : 'N/A'}</span></p>
                              </div>
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={refreshScanResult}
                                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded-md font-medium transition-colors flex items-center justify-center gap-1"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                  Refresh Status
                                </button>
                                {!scanResult.qr_status?.is_used && (
                                  <button
                                    onClick={async () => {
                                      try {
                                        console.log('QR Status:', scanResult.qr_status);
                                        console.log('QR ID:', scanResult.qr_status?.id);
                                        
                                        if (!scanResult.qr_status?.id) {
                                          throw new Error('QR Code ID is missing from scan result');
                                        }
                                        
                                        await apiService.markQRCodeAsUsed(scanResult.qr_status.id);
                                        // Refresh the scan result to show updated status
                                        await refreshScanResult();
                                        // Refresh scan history
                                        const history = await apiService.getQRScanHistory(50, 0);
                                        const transformedHistory = history.scans.map((scan: any) => ({
                                          qrCode: scan.qr_code,
                                          timestamp: new Date(scan.scanned_at),
                                          userInfo: scan.user_info,
                                          productInfo: scan.product_info,
                                          purchaseInfo: scan.purchase_info
                                        }));
                                        setScanHistory(transformedHistory);
                                      } catch (error: any) {
                                        setErrorMessage(error.message || 'Failed to mark QR code as used');
                                      }
                                    }}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs py-2 px-3 rounded-md font-medium transition-colors"
                                  >
                                    Mark as Used
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Scan History - Always visible */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="text-base font-semibold text-gray-900 mb-3">Scan History:</h4>
                      {scanHistory.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {scanHistory.map((scan, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span className="text-xs font-medium text-gray-900">
                                    {scan.userInfo?.full_name || 'Unknown User'}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {scan.timestamp.toLocaleTimeString()}
                                </span>
                              </div>
                              <div className="text-xs text-gray-600 space-y-0.5">
                                <p><span className="font-medium">Product:</span> {scan.productInfo?.name || 'N/A'}</p>
                                <p><span className="font-medium">Email:</span> {scan.userInfo?.email || 'N/A'}</p>
                                <p><span className="font-medium">Scanned:</span> {scan.timestamp.toLocaleDateString()}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          <svg className="w-8 h-8 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <p className="text-xs">No QR scans recorded yet</p>
                          <p className="text-xs mt-1">Scanned QR codes will appear here</p>
                        </div>
                      )}
                    </div>
                  </div>
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
                icon={<DollarSign className="w-8 h-8" />}
                title="Ready for Payment"
                description="Process payments for groups that have reached their target and are ready for fulfillment."
                buttonText="Process Payments"
                link="/ready-for-payment"
              />
              <ManagementCard
                icon={<Clock className="w-8 h-8" />}
                title="Completed Groups"
                description="Manage groups where orders have been paid and are ready for trader pickup."
                buttonText="Manage Pickups"
                link="/completed-groups"
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
