import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Box, TextField, Button, Typography, Alert } from '@mui/material';
import { useAppDispatch } from '../hooks';
import { setCredentials } from '../store/authSlice';
import { authAPI } from '../services/api';

export default function Register() {
  const [formData, setFormData] = useState({ email: '', password: '', full_name: '', business_name: '', location_name: '' });
  const [error, setError] = useState('');
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await authAPI.register(formData);
      dispatch(setCredentials({ user: response.data.user, token: response.data.access_token }));
      navigate('/trader');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom>Join SPACS AFRICA</Typography>
        {error && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, width: '100%' }}>
          <TextField fullWidth label="Full Name" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} margin="normal" required />
          <TextField fullWidth label="Business Name" value={formData.business_name} onChange={(e) => setFormData({ ...formData, business_name: e.target.value })} margin="normal" />
          <TextField fullWidth label="Location" value={formData.location_name} onChange={(e) => setFormData({ ...formData, location_name: e.target.value })} margin="normal" placeholder="e.g., Nairobi, Kenya" />
          <TextField fullWidth label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} margin="normal" required />
          <TextField fullWidth label="Password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} margin="normal" required />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>Register</Button>
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <Button fullWidth>Already have an account? Login</Button>
          </Link>
        </Box>
      </Box>
    </Container>
  );
}
