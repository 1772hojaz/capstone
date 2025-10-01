import React, { useEffect, useState } from 'react';
import { Container, Box, Typography, Grid, AppBar, Toolbar, Button, IconButton } from '@mui/material';
import { Logout, ShoppingCart } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks';
import { logout } from '../store/authSlice';
import { setRecommendations } from '../store/recommendationsSlice';
import { recommendationsAPI } from '../services/api';
import GroupRecommendationCard from '../components/GroupRecommendationCard';

export default function TraderDashboard() {
  const { user } = useAppSelector((state) => state.auth);
  const { items: recommendations } = useAppSelector((state) => state.recommendations);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const response = await recommendationsAPI.get();
      dispatch(setRecommendations(response.data));
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>SPACS AFRICA</Typography>
          <Button color="inherit" onClick={() => navigate('/trader/products')} startIcon={<ShoppingCart />}>Products</Button>
          {user?.is_admin && <Button color="inherit" onClick={() => navigate('/admin')}>Admin</Button>}
          <IconButton color="inherit" onClick={() => { dispatch(logout()); navigate('/login'); }}><Logout /></IconButton>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4">Welcome, {user?.full_name}!</Typography>
          <Typography variant="subtitle1" color="text.secondary">{user?.business_name}</Typography>
        </Box>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>Recommended Groups for You</Typography>
          <Typography variant="body2" color="text.secondary">Join these groups to save money on bulk purchases</Typography>
        </Box>
        {loading ? <Typography>Loading recommendations...</Typography> : recommendations.length === 0 ? <Typography>No recommendations yet. Check back soon!</Typography> : (
          <Grid container spacing={3}>
            {recommendations.map((rec) => (
              <Grid item xs={12} md={6} key={rec.id}>
                <GroupRecommendationCard recommendation={rec} onJoin={fetchRecommendations} />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </>
  );
}
