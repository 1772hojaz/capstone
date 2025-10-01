import React, { useEffect, useState } from 'react';
import { Container, Grid, Card, CardContent, Typography, AppBar, Toolbar, IconButton, Box, Chip } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { productsAPI } from '../services/api';

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/trader')}><ArrowBack /></IconButton>
          <Typography variant="h6">Browse Products</Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          {products.map((product) => (
            <Grid item xs={12} sm={6} md={4} key={product.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>{product.name}</Typography>
                  <Chip label={product.category} size="small" sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{product.description}</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Box><Typography variant="caption" color="text.secondary">Individual</Typography><Typography variant="h6">${product.base_price}</Typography></Box>
                    <Box><Typography variant="caption" color="text.secondary">Bulk</Typography><Typography variant="h6" color="success.main">${product.bulk_price}</Typography></Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </>
  );
}
