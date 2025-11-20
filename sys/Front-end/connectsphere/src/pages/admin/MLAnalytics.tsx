import React, { useState, useEffect } from 'react';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Brain,
  Clock,
  Target,
  Zap,
  Database
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import TopNavigation from '../../components/navigation/TopNavigation';
import { PageContainer, PageHeader } from '../../components/layout/index';
import apiService from '../../services/api';

interface MLModelPerformance {
  id: number;
  model_name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  training_time: number;
  prediction_time: number;
  last_trained: string;
  status: string;
}

interface MLSystemStatus {
  total_models: number;
  active_models: number;
  avg_accuracy: number;
  total_predictions_today: number;
  system_health: string;
  last_training: string;
}

const MLAnalytics: React.FC = () => {
  const [models, setModels] = useState<MLModelPerformance[]>([]);
  const [systemStatus, setSystemStatus] = useState<MLSystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [performanceData, statusData] = await Promise.all([
        apiService.getMLPerformance(),
        apiService.get('/api/admin/ml-system-status')
      ]);

      setModels(performanceData || []);
      setSystemStatus(statusData || null);
    } catch (err: any) {
      console.error('Failed to load ML analytics:', err);
      setError('Failed to load ML analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetrain = async () => {
    try {
      setRetraining(true);
      await apiService.retrainMLModels();
      setTimeout(() => {
        fetchData();
        setRetraining(false);
      }, 2000);
    } catch (err: any) {
      console.error('Failed to retrain models:', err);
      setError('Failed to retrain models. Please try again.');
      setRetraining(false);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health.toLowerCase()) {
      case 'excellent':
        return 'bg-green-100 text-green-800';
      case 'good':
        return 'bg-blue-100 text-blue-800';
      case 'fair':
        return 'bg-yellow-100 text-yellow-800';
      case 'poor':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'training':
        return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(2)}s`;
    if (seconds < 3600) return `${(seconds / 60).toFixed(2)}m`;
    return `${(seconds / 3600).toFixed(2)}h`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <>
        <TopNavigation />
        <PageContainer>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading ML analytics...</p>
            </div>
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <TopNavigation />
      <PageContainer>
        <PageHeader
          title="ML Performance Analytics"
          description="Monitor and analyze machine learning model performance"
          action={
            <Button
              onClick={handleRetrain}
              disabled={retraining}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${retraining ? 'animate-spin' : ''}`} />
              {retraining ? 'Retraining...' : 'Retrain Models'}
            </Button>
          }
        />

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* System Status Overview */}
        {systemStatus && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">System Health</p>
                  <Badge className={getHealthColor(systemStatus.system_health)}>
                    {systemStatus.system_health}
                  </Badge>
                </div>
                <Activity className="w-8 h-8 text-blue-600" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Models</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {systemStatus.active_models}/{systemStatus.total_models}
                  </p>
                </div>
                <Brain className="w-8 h-8 text-purple-600" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Avg Accuracy</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPercentage(systemStatus.avg_accuracy)}
                  </p>
                </div>
                <Target className="w-8 h-8 text-green-600" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Predictions Today</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {systemStatus.total_predictions_today.toLocaleString()}
                  </p>
                </div>
                <Zap className="w-8 h-8 text-yellow-600" />
              </div>
            </Card>
          </div>
        )}

        {/* Model Performance Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Model Performance</h2>
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {models.length === 0 ? (
            <Card className="p-12 text-center">
              <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No ML Models</h3>
              <p className="text-gray-600 mb-4">
                No machine learning models have been trained yet.
              </p>
              <Button onClick={handleRetrain}>
                <Brain className="w-4 h-4 mr-2" />
                Train First Model
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {models.map((model) => (
                <Card key={model.id} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Brain className="w-6 h-6 text-blue-600" />
                      <div>
                        <h3 className="font-semibold text-gray-900">{model.model_name}</h3>
                        <p className="text-sm text-gray-600">
                          Last trained: {formatDate(model.last_trained)}
                        </p>
                      </div>
                    </div>
                    {getStatusIcon(model.status)}
                  </div>

                  {/* Performance Metrics */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Accuracy</p>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-bold text-gray-900">
                          {formatPercentage(model.accuracy)}
                        </p>
                        {model.accuracy > 0.8 ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Precision</p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatPercentage(model.precision)}
                      </p>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Recall</p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatPercentage(model.recall)}
                      </p>
                    </div>

                    <div className="bg-yellow-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">F1 Score</p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatPercentage(model.f1_score)}
                      </p>
                    </div>
                  </div>

                  {/* Training & Prediction Times */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-600">Training Time</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatTime(model.training_time)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-600">Prediction Time</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatTime(model.prediction_time)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Performance Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Overall Performance</span>
                      <span>{formatPercentage(model.f1_score)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          model.f1_score > 0.8
                            ? 'bg-green-600'
                            : model.f1_score > 0.6
                            ? 'bg-yellow-600'
                            : 'bg-red-600'
                        }`}
                        style={{ width: `${model.f1_score * 100}%` }}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Model Comparison Section */}
        {models.length > 1 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Model Comparison</h2>
            <Card className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                        Model
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900">
                        Accuracy
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900">
                        Precision
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900">
                        Recall
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900">
                        F1 Score
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {models
                      .sort((a, b) => b.f1_score - a.f1_score)
                      .map((model) => (
                        <tr key={model.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Brain className="w-4 h-4 text-blue-600" />
                              <span className="font-medium text-gray-900">
                                {model.model_name}
                              </span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className="font-medium text-gray-900">
                              {formatPercentage(model.accuracy)}
                            </span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className="font-medium text-gray-900">
                              {formatPercentage(model.precision)}
                            </span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className="font-medium text-gray-900">
                              {formatPercentage(model.recall)}
                            </span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span
                              className={`font-medium ${
                                model.f1_score > 0.8
                                  ? 'text-green-600'
                                  : model.f1_score > 0.6
                                  ? 'text-yellow-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {formatPercentage(model.f1_score)}
                            </span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <Badge
                              className={
                                model.status.toLowerCase() === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }
                            >
                              {model.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Performance Insights */}
        {models.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Best Performer */}
              {(() => {
                const bestModel = models.reduce((prev, current) =>
                  current.f1_score > prev.f1_score ? current : prev
                );
                return (
                  <Card className="p-6 border-green-200 bg-green-50">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold text-green-900">Best Performer</h3>
                    </div>
                    <p className="text-2xl font-bold text-green-900 mb-1">
                      {bestModel.model_name}
                    </p>
                    <p className="text-sm text-green-700">
                      F1 Score: {formatPercentage(bestModel.f1_score)}
                    </p>
                  </Card>
                );
              })()}

              {/* Fastest Predictor */}
              {(() => {
                const fastest = models.reduce((prev, current) =>
                  current.prediction_time < prev.prediction_time ? current : prev
                );
                return (
                  <Card className="p-6 border-blue-200 bg-blue-50">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-blue-900">Fastest Predictor</h3>
                    </div>
                    <p className="text-2xl font-bold text-blue-900 mb-1">
                      {fastest.model_name}
                    </p>
                    <p className="text-sm text-blue-700">
                      {formatTime(fastest.prediction_time)} per prediction
                    </p>
                  </Card>
                );
              })()}

              {/* Most Recent */}
              {(() => {
                const mostRecent = models.reduce((prev, current) =>
                  new Date(current.last_trained) > new Date(prev.last_trained) ? current : prev
                );
                return (
                  <Card className="p-6 border-purple-200 bg-purple-50">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-purple-600" />
                      <h3 className="font-semibold text-purple-900">Most Recent</h3>
                    </div>
                    <p className="text-2xl font-bold text-purple-900 mb-1">
                      {mostRecent.model_name}
                    </p>
                    <p className="text-sm text-purple-700">
                      {formatDate(mostRecent.last_trained)}
                    </p>
                  </Card>
                );
              })()}
            </div>
          </div>
        )}
      </PageContainer>
    </>
  );
};

export default MLAnalytics;

