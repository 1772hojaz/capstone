import axios from 'axios';

export const fetchDashboardData = async () => {
  try {
    const response = await axios.get('/api/ml/dashboard-data');
    return response.data;
  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw error;
  }
};

export default {
  fetchDashboardData
};
