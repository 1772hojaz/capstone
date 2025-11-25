import React, { useState, useEffect } from 'react';
import { 
  Play, TrendingUp, TrendingDown, Info, RefreshCw, Clock, 
  CheckCircle, AlertCircle, BarChart3, Activity
} from 'lucide-react';
import api from '../../services/api';

interface BenchmarkMetrics {
  precision_at_5: number;
  precision_at_10: number;
  recall_at_5: number;
  recall_at_10: number;
  ndcg_at_5: number;
  ndcg_at_10: number;
  map_score: number;
  hit_rate: number;
  coverage: number;
}

interface ModelResults {
  hybrid: BenchmarkMetrics;
  collaborative_only: BenchmarkMetrics;
  content_only: BenchmarkMetrics;
  popularity: BenchmarkMetrics;
  random: BenchmarkMetrics;
}

interface BenchmarkData {
  status: string;
  models: ModelResults;
  test_set_size: number;
  run_at: string;
}

interface HistoricalRun {
  run_at: string;
  models: ModelResults;
}

const MLBenchmarking: React.FC = () => {
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkData | null>(null);
  const [history, setHistory] = useState<HistoricalRun[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLatestBenchmark();
    fetchHistory();
  }, []);

  const fetchLatestBenchmark = async () => {
    try {
      setLoading(true);
      const response = await api.getLatestBenchmark();
      if (response.status === 'success') {
        setBenchmarkData(response);
      }
      setError(null);
    } catch (err: any) {
      console.error('Error fetching benchmark:', err);
      setError(err.message || 'Failed to fetch benchmark data');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await api.getBenchmarkHistory(10);
      setHistory(response);
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const runBenchmark = async () => {
    try {
      setIsRunning(true);
      setError(null);
      await api.runBenchmark();
      
      // Wait a moment then refresh data
      setTimeout(() => {
        fetchLatestBenchmark();
        fetchHistory();
        setIsRunning(false);
      }, 2000);
    } catch (err: any) {
      console.error('Error running benchmark:', err);
      setError(err.message || 'Failed to run benchmark');
      setIsRunning(false);
    }
  };

  const getMetricColor = (value: number, metric: string): string => {
    if (metric === 'precision_at_10' || metric === 'recall_at_10' || metric === 'ndcg_at_10') {
      if (value > 0.4) return 'text-green-600';
      if (value > 0.2) return 'text-yellow-600';
      return 'text-red-600';
    }
    if (metric === 'map_score' || metric === 'hit_rate') {
      if (value > 0.5) return 'text-green-600';
      if (value > 0.3) return 'text-yellow-600';
      return 'text-red-600';
    }
    return 'text-gray-700';
  };

  const getMetricBadge = (value: number, metric: string): string => {
    if (metric === 'precision_at_10' || metric === 'recall_at_10' || metric === 'ndcg_at_10') {
      if (value > 0.4) return 'bg-green-100 text-green-800';
      if (value > 0.2) return 'bg-yellow-100 text-yellow-800';
      return 'bg-red-100 text-red-800';
    }
    if (metric === 'map_score' || metric === 'hit_rate') {
      if (value > 0.5) return 'bg-green-100 text-green-800';
      if (value > 0.3) return 'bg-yellow-100 text-yellow-800';
      return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const getPerformanceLabel = (value: number, metric: string): string => {
    if (metric === 'precision_at_10' || metric === 'recall_at_10' || metric === 'ndcg_at_10') {
      if (value > 0.4) return 'Excellent';
      if (value > 0.2) return 'Fair';
      return 'Poor';
    }
    if (metric === 'map_score' || metric === 'hit_rate') {
      if (value > 0.5) return 'Excellent';
      if (value > 0.3) return 'Fair';
      return 'Poor';
    }
    return 'N/A';
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleString();
  };

  const MetricTooltip: React.FC<{ title: string; description: string }> = ({ title, description }) => (
    <div className="group relative inline-block ml-1">
      <Info className="w-4 h-4 text-gray-400 cursor-help" />
      <div className="invisible group-hover:visible absolute z-10 w-64 p-2 text-sm bg-gray-900 text-white rounded shadow-lg -left-32 top-6">
        <div className="font-semibold mb-1">{title}</div>
        <div className="text-xs">{description}</div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading benchmark data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                ML Recommendation Benchmarking
              </h1>
              <p className="text-gray-600">
                Evaluate and compare recommendation model performance using industry-standard metrics
              </p>
            </div>
            <button
              onClick={runBenchmark}
              disabled={isRunning}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                isRunning
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Run New Benchmark
                </>
              )}
            </button>
          </div>

          {benchmarkData && (
            <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Last run: {formatDate(benchmarkData.run_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                <span>Test set: {benchmarkData.test_set_size} users</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Status: Active</span>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
          )}
        </div>

        {benchmarkData && benchmarkData.models ? (
          <>
            {/* Performance Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Precision@10</h3>
                  <MetricTooltip
                    title="Precision@10"
                    description="Proportion of top 10 recommendations that are relevant. Higher is better."
                  />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-bold ${getMetricColor(benchmarkData.models.hybrid.precision_at_10, 'precision_at_10')}`}>
                    {(benchmarkData.models.hybrid.precision_at_10 * 100).toFixed(1)}%
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getMetricBadge(benchmarkData.models.hybrid.precision_at_10, 'precision_at_10')}`}>
                    {getPerformanceLabel(benchmarkData.models.hybrid.precision_at_10, 'precision_at_10')}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Recall@10</h3>
                  <MetricTooltip
                    title="Recall@10"
                    description="Proportion of relevant items found in top 10. Higher is better."
                  />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-bold ${getMetricColor(benchmarkData.models.hybrid.recall_at_10, 'recall_at_10')}`}>
                    {(benchmarkData.models.hybrid.recall_at_10 * 100).toFixed(1)}%
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getMetricBadge(benchmarkData.models.hybrid.recall_at_10, 'recall_at_10')}`}>
                    {getPerformanceLabel(benchmarkData.models.hybrid.recall_at_10, 'recall_at_10')}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">NDCG@10</h3>
                  <MetricTooltip
                    title="NDCG@10"
                    description="Normalized Discounted Cumulative Gain. Measures ranking quality (0-1)."
                  />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-bold ${getMetricColor(benchmarkData.models.hybrid.ndcg_at_10, 'ndcg_at_10')}`}>
                    {(benchmarkData.models.hybrid.ndcg_at_10 * 100).toFixed(1)}%
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getMetricBadge(benchmarkData.models.hybrid.ndcg_at_10, 'ndcg_at_10')}`}>
                    {getPerformanceLabel(benchmarkData.models.hybrid.ndcg_at_10, 'ndcg_at_10')}
                  </span>
                </div>
              </div>
            </div>

            {/* Model Comparison Table */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Model Comparison
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Model</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">
                        Precision@10
                        <MetricTooltip title="Precision@10" description="% of recommendations that are relevant" />
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">
                        Recall@10
                        <MetricTooltip title="Recall@10" description="% of relevant items found" />
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">
                        NDCG@10
                        <MetricTooltip title="NDCG@10" description="Ranking quality (0-1)" />
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">
                        MAP
                        <MetricTooltip title="MAP" description="Mean Average Precision" />
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">
                        Hit Rate
                        <MetricTooltip title="Hit Rate" description="% users with ≥1 relevant item" />
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">
                        Coverage
                        <MetricTooltip title="Coverage" description="% of items recommended" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(benchmarkData.models).map(([modelName, metrics]) => {
                      const displayName = modelName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                      const isHybrid = modelName === 'hybrid';
                      
                      return (
                        <tr key={modelName} className={`border-b ${isHybrid ? 'bg-blue-50 font-semibold' : 'hover:bg-gray-50'}`}>
                          <td className="py-3 px-4">
                            {displayName}
                            {isHybrid && <span className="ml-2 text-xs text-blue-600">(Current)</span>}
                          </td>
                          <td className="text-center py-3 px-4">{(metrics.precision_at_10 * 100).toFixed(2)}%</td>
                          <td className="text-center py-3 px-4">{(metrics.recall_at_10 * 100).toFixed(2)}%</td>
                          <td className="text-center py-3 px-4">{(metrics.ndcg_at_10 * 100).toFixed(2)}%</td>
                          <td className="text-center py-3 px-4">{(metrics.map_score * 100).toFixed(2)}%</td>
                          <td className="text-center py-3 px-4">{(metrics.hit_rate * 100).toFixed(2)}%</td>
                          <td className="text-center py-3 px-4">{(metrics.coverage * 100).toFixed(2)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Performance Trends */}
            {history.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Performance History
                </h2>
                <div className="space-y-4">
                  {history.slice(0, 5).map((run, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600">{formatDate(run.run_at)}</span>
                      <div className="flex items-center gap-6 text-sm">
                        <span>
                          P@10: <span className="font-semibold">{(run.models.hybrid.precision_at_10 * 100).toFixed(1)}%</span>
                        </span>
                        <span>
                          R@10: <span className="font-semibold">{(run.models.hybrid.recall_at_10 * 100).toFixed(1)}%</span>
                        </span>
                        <span>
                          NDCG: <span className="font-semibold">{(run.models.hybrid.ndcg_at_10 * 100).toFixed(1)}%</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interpretation Guide */}
            <div className="bg-blue-50 rounded-lg p-6 mt-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Interpretation Guide</h3>
              <div className="space-y-2 text-sm text-blue-800">
                <p><strong>If Hybrid &lt; Collaborative:</strong> Content-based features may be hurting performance. Consider reducing content weight.</p>
                <p><strong>If Hybrid &lt; Content:</strong> Collaborative filtering not working well. Check data sparsity.</p>
                <p><strong>If Hybrid ≈ Popularity:</strong> Model not learning personalization. Need more user diversity.</p>
                <p><strong>If Hybrid &lt; Popularity:</strong> Critical issue! Model is broken, investigate data quality.</p>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Benchmark Data Available</h3>
            <p className="text-gray-600 mb-6">Run your first benchmark to evaluate model performance</p>
            <button
              onClick={runBenchmark}
              disabled={isRunning}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Run Benchmark Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MLBenchmarking;

