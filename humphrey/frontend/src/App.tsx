import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useAppSelector } from './hooks';
import Login from './pages/Login';
import Register from './pages/Register';
import TraderDashboard from './pages/TraderDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Products from './pages/Products';

const theme = createTheme({
  palette: {
    primary: { main: '#0ea5e9' },
    secondary: { main: '#10b981' },
  },
});

function App() {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/trader" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/trader" />} />
          <Route path="/trader" element={user ? <TraderDashboard /> : <Navigate to="/login" />} />
          <Route path="/trader/products" element={user ? <Products /> : <Navigate to="/login" />} />
          <Route path="/admin" element={user?.is_admin ? <AdminDashboard /> : <Navigate to="/trader" />} />
          <Route path="/" element={<Navigate to={user ? "/trader" : "/login"} />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
