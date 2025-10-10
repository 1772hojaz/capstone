/**
 * Simple test component to verify backend connection
 */
import { useState, useEffect } from 'react';
import { productsApi, type Product } from '../services';

export function ConnectionTest() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<string>('Checking...');

  useEffect(() => {
    // Check backend health
    fetch('http://localhost:8000/health')
      .then(res => res.json())
      .then(data => {
        setBackendStatus(`✅ Backend is ${data.status}`);
      })
      .catch(() => {
        setBackendStatus('❌ Backend is not running');
      });

    // Fetch products
    productsApi.getAll()
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>Backend Connection Test</h1>
      
      <div style={{ marginBottom: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '5px' }}>
        <strong>Status:</strong> {backendStatus}
      </div>

      <h2>Products from Backend:</h2>
      
      {loading && <p>Loading products...</p>}
      
      {error && (
        <div style={{ color: 'red', padding: '10px', background: '#ffe0e0', borderRadius: '5px' }}>
          <strong>Error:</strong> {error}
          <p style={{ fontSize: '0.9em', marginTop: '10px' }}>
            Make sure the backend is running: <code>python sys/backend/main.py</code>
          </p>
        </div>
      )}
      
      {!loading && !error && products.length === 0 && (
        <p>No products found. Run <code>python sys/backend/seed_mbare_data.py</code> to seed the database.</p>
      )}
      
      {!loading && !error && products.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {products.slice(0, 10).map(product => (
            <li key={product.id} style={{ 
              padding: '10px', 
              marginBottom: '10px', 
              background: '#e8f5e9', 
              borderRadius: '5px',
              border: '1px solid #4caf50'
            }}>
              <strong>{product.name}</strong> - {product.category}
              {product.current_price && ` - $${product.current_price}`}
            </li>
          ))}
        </ul>
      )}
      
      <div style={{ marginTop: '30px', padding: '10px', background: '#e3f2fd', borderRadius: '5px' }}>
        <h3>API Endpoints Available:</h3>
        <ul>
          <li>✅ Products API: <code>/api/products</code></li>
          <li>✅ Auth API: <code>/api/auth</code></li>
          <li>✅ Groups API: <code>/api/groups</code></li>
          <li>✅ ML API: <code>/api/ml</code></li>
          <li>✅ Admin API: <code>/api/admin</code></li>
        </ul>
      </div>
    </div>
  );
}

export default ConnectionTest;
