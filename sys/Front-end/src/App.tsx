import { useState, FormEvent, useEffect } from 'react'
import './App.css'
import { authApi } from './services'
import Dashboard from './components/Dashboard'

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      authApi.getCurrentUser()
        .then(() => setIsAuthenticated(true))
        .catch(() => {
          localStorage.clear()
          setIsAuthenticated(false)
        })
    }
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await authApi.login({ email, password })
      console.log('Login successful:', response)

      // Store token in localStorage
      localStorage.setItem('token', response.access_token)
      localStorage.setItem('user_id', response.user_id.toString())
      localStorage.setItem('is_admin', response.is_admin.toString())

      // Fetch user profile to get full name
      const userProfile = await authApi.getCurrentUser()
      console.log('User profile:', userProfile)

      // Set authenticated state to show dashboard
      setIsAuthenticated(true)
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setEmail('')
    setPassword('')
    setError(null)
  }

  // If authenticated, show dashboard
  if (isAuthenticated) {
    return <Dashboard onLogout={handleLogout} />
  }

  // Otherwise show login form
  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f5f5',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px'
    }}>
      {/* Login Card */}
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <img
            src="/src/assets/connectsphere-logo.svg"
            alt="ConnectSphere Logo"
            style={{
              width: '60px',
              height: '60px',
              margin: '0 auto 15px auto'
            }}
          />
          <h1 style={{
            margin: '0 0 5px 0',
            fontSize: '24px',
            fontWeight: '700',
            color: '#111827'
          }}>
            ConnectSphere
          </h1>
          <p style={{
            margin: 0,
            color: '#6b7280',
            fontSize: '14px'
          }}>
            Your gateway to collaborative trading
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Error Message */}
          {error && (
            <div style={{
              padding: '12px',
              background: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              color: '#991b1b',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {/* Email Field */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="trader1@mbare.co.zw"
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxSizing: 'border-box',
                opacity: loading ? 0.6 : 1
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#2563eb';
                e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Password Field */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxSizing: 'border-box',
                opacity: loading ? 0.6 : 1
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#2563eb';
                e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Remember me & Forgot Password */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '14px'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              color: '#374151'
            }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
                style={{
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer',
                  accentColor: '#2563eb'
                }}
              />
              <span>Remember me</span>
            </label>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                alert('Forgot password feature coming soon!')
              }}
              style={{
                color: '#2563eb',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500'
              }}
              onMouseOver={(e) => (e.target as HTMLElement).style.textDecoration = 'underline'}
              onMouseOut={(e) => (e.target as HTMLElement).style.textDecoration = 'none'}
            >
              Forgot Password?
            </a>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? '#9ca3af' : '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              marginTop: '4px'
            }}
            onMouseOver={(e) => !loading && (e.currentTarget.style.background = '#1d4ed8')}
            onMouseOut={(e) => !loading && (e.currentTarget.style.background = '#2563eb')}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Admin Sign In Link */}
        <div style={{
          textAlign: 'center',
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              alert('Admin login coming soon!')
            }}
            style={{
              color: '#2563eb',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500'
            }}
            onMouseOver={(e) => (e.target as HTMLElement).style.textDecoration = 'underline'}
            onMouseOut={(e) => (e.target as HTMLElement).style.textDecoration = 'none'}
          >
            Sign in as Admin
          </a>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '30px',
          color: '#9ca3af',
          fontSize: '12px'
        }}>
          © 2025 ConnectSphere. All rights reserved.
        </div>
      </div>
    </div>
  )
}

export default App

