import { useState, useEffect } from 'react';
import apiService from '../services/api';
import toast from 'react-hot-toast';
import type { GroupBuy } from '../types';

export const useGroups = () => {
  const [groups, setGroups] = useState<GroupBuy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiService.getMyGroups();
      setGroups(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const message = err.message || 'Failed to load groups';
      setError(message);
      toast.error(message);
      setGroups([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  return { groups, isLoading, error, refetch: fetchGroups };
};

export default useGroups;
