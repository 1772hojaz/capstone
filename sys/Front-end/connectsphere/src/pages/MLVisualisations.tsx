import { TrendingUp, Clock, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Layout from '../components/Layout';
import apiService from '../services/api';
import { useState, useEffect, useRef } from 'react';

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

const MLVisualisations = () => {
  const [nextRetrainTime, setNextRetrainTime] = useState<Date>(new Date(Date.now() + 12 * 60 * 60 * 1000));
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isRetraining, setIsRetraining] = useState(false);
  const [currentStage, setCurrentStage] = useState<TrainingStage>(null);
  const [trainingProgress, setTrainingProgress] = useState<number>(0);
  const [trainingMessage, setTrainingMessage] = useState<string>('');
  const [trainingResults, setTrainingResults] = useState<any>(null);
  const [trainingError, setTrainingError] = useState<string | null>(null);
  const [modelPerformanceData, setModelPerformanceData] = useState<any[]>([]);
  const [mlSystemStatus, setMlSystemStatus] = useState<any>(null);

  // WebSocket reference
  const wsRef = useRef<WebSocket | null>(null);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

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

  useEffect(() => {
    const loadMLData = async () => {
      try {
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
        setMlSystemStatus(mlStatus);
      } catch (err) {
        console.error('Failed to load ML data:', err);
      }
    };

    loadMLData();
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

  return (
    <Layout title="ML Visualisations">
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
    </Layout>
  );
};

export default MLVisualisations;