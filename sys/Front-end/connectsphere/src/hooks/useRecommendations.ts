import { useState, useEffect } from 'react';
import apiService from '../services/api';
import toast from 'react-hot-toast';
import type { Recommendation } from '../types';

export const useRecommendations = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiService.getRecommendations();
      setRecommendations(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const message = err.message || 'Failed to load recommendations';
      setError(message);
      toast.error(message);
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  return { recommendations, isLoading, error, refetch: fetchRecommendations };
};

export default useRecommendations;
