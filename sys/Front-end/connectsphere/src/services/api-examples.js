// API Service Usage Examples
// This file demonstrates how to use the API service in your React components

import apiService from '../services/api';
import { Navigate } from 'react-router-dom';

// Example 1: Login Component
const handleLogin = async (email, password) => {
  try {
    setLoading(true);
    const response = await apiService.login({ email, password });
    // Token is automatically stored in localStorage
    navigate('/dashboard'); // Redirect on success
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
};

// Example 2: Fetching Data on Component Mount
useEffect(() => {
  const fetchData = async () => {
    try {
      const [groups, recommendations] = await Promise.all([
        apiService.getMyGroups(),
        apiService.getRecommendations()
      ]);
      setGroups(groups);
      setRecommendations(recommendations);
    } catch (error) {
      setError('Failed to load data');
    }
  };

  fetchData();
}, []);

// Example 3: Handling API Errors
const handleJoinGroup = async (groupId) => {
  try {
    await apiService.joinGroup(groupId);
    // Refresh groups data
    const updatedGroups = await apiService.getMyGroups();
    setGroups(updatedGroups);
    setSuccessMessage('Successfully joined group!');
  } catch (error) {
    if (error.message.includes('Unauthorized')) {
      // Token expired, redirect to login
      navigate('/login');
    } else {
      setError(error.message);
    }
  }
};

// Example 4: Admin Operations (only for admin users)
const handleRetrainModels = async () => {
  try {
    const result = await apiService.retrainMLModels();
    console.log('ML models retrained:', result);
  } catch (error) {
    setError('Failed to retrain models');
  }
};

// Example 5: Checking Authentication Status
// Note: This is example code only - component declarations should be in .jsx or .tsx files
const ProtectedComponent = () => {
  if (!apiService.isAuthenticated()) {
    // In actual implementation: return <Navigate to="/login" />;
    return null; // Placeholder for example purposes
  }

  // In actual implementation: return <Dashboard />;
  return null; // Placeholder for example purposes
};

// Example 6: Logout
const handleLogout = async () => {
  await apiService.logout(); // Clears token and makes API call
  navigate('/login');
};

// Example 7: Profile Update
const updateProfile = async (profileData) => {
  try {
    const updatedUser = await apiService.updateProfile(profileData);
    setUser(updatedUser);
  } catch (error) {
    setError('Failed to update profile');
  }
};

// Example 8: Fetching Products with Filters
const fetchProducts = async (filters = {}) => {
  try {
    const products = await apiService.getProducts(filters);
    setProducts(products);
  } catch (error) {
    setError('Failed to load products');
  }
};

// Available API Methods:
// - Authentication: login, register, logout, getCurrentUser, updateProfile
// - Groups: getMyGroups, getGroupDetails, joinGroup, getGroupQRCode, getAllGroups, getPastGroupsSummary
// - Products: getProducts, getProduct
// - Recommendations: getRecommendations, getUserSimilarityRecommendations, getHybridRecommendations
// - Admin: getAllUsers, getSystemStats, retrainMLModels
// - Utilities: isAuthenticated, healthCheck

export {};