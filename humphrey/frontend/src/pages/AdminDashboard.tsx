import React, { useEffect, useState } from 'react';
import { Container, Grid, Card, CardContent, Typography, AppBar, Toolbar, IconButton, Button, Box } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [evaluation, setEvaluation] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [metricsRes, evalRes] = await Promise.all([adminAPI.getMetrics(), adminAPI.getEvaluation()]);
      setMetrics(metricsRes.data);
      setEvaluation(evalRes.data);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    }
  };

  const handleGenerateData = async () => {
    try {
      await adminAPI.generateSyntheticData({ num_users: 100, num_transactions: 500, num_groups: 20 });
      alert('Synthetic data generated successfully!');
      fetchData();
    } catch (error) {
      console.error('Failed to generate data:', error);
    }
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/trader')}><ArrowBack /></IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Admin Dashboard</Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ mb: 3 }}><Button variant="contained" onClick={handleGenerateData}>Generate Synthetic Data</Button></Box>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}><Card><CardContent><Typography color="text.secondary" gutterBottom>Total Users</Typography><Typography variant="h4">{metrics?.total_users || 0}</Typography></CardContent></Card></Grid>
          <Grid item xs={12} sm={6} md={3}><Card><CardContent><Typography color="text.secondary" gutterBottom>Active Groups</Typography><Typography variant="h4">{metrics?.active_groups || 0}</Typography></CardContent></Card></Grid>
          <Grid item xs={12} sm={6} md={3}><Card><CardContent><Typography color="text.secondary" gutterBottom>Transactions</Typography><Typography variant="h4">{metrics?.total_transactions || 0}</Typography></CardContent></Card></Grid>
          <Grid item xs={12} sm={6} md={3}><Card><CardContent><Typography color="text.secondary" gutterBottom>Total Revenue</Typography><Typography variant="h4">${metrics?.total_revenue?.toFixed(0) || 0}</Typography></CardContent></Card></Grid>
        </Grid>
      </Container>
    </>
  );
}
