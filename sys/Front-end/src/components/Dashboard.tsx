import { useState, useEffect } from 'react'
import { authApi } from '../services'

interface DashboardProps {
  onLogout: () => void
}

function Dashboard({ onLogout }: DashboardProps) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const userData = await authApi.getCurrentUser()
      setUser(userData)
    } catch (err) {
      console.error('Failed to load user data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    authApi.logout()
    localStorage.clear()
    onLogout()
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '24px', 
            color: '#2563eb',
            marginBottom: '10px'
          }}>
            Loading...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f5f5f5',
      padding: '20px'
    }}>
      {/* Header */}
      <header style={{
        background: 'white',
        padding: '20px 30px',
        borderRadius: '8px',
        marginBottom: '30px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ 
            margin: 0, 
            fontSize: '24px', 
            color: '#111827',
            fontWeight: '700'
          }}>
            {user?.is_admin ? 'Admin Dashboard' : 'Trader Dashboard'}
          </h1>
          <p style={{ 
            margin: '5px 0 0 0', 
            color: '#6b7280',
            fontSize: '14px'
          }}>
            Welcome back, {user?.full_name}!
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#dc2626'}
          onMouseOut={(e) => e.currentTarget.style.background = '#ef4444'}
        >
          Logout
        </button>
      </header>

      {/* User Info Card */}
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        maxWidth: '600px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <img
            src="/src/assets/user-icon.svg"
            alt="User Icon"
            style={{ width: '24px', height: '24px' }}
          />
          <h2 style={{ 
            margin: 0, 
            fontSize: '18px', 
            color: '#111827',
            fontWeight: '600'
          }}>
            Profile Information
          </h2>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '12px', 
              color: '#6b7280',
              marginBottom: '5px',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Email
            </label>
            <div style={{ fontSize: '14px', color: '#111827' }}>
              {user?.email}
            </div>
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '12px', 
              color: '#6b7280',
              marginBottom: '5px',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Full Name
            </label>
            <div style={{ fontSize: '14px', color: '#111827' }}>
              {user?.full_name}
            </div>
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '12px', 
              color: '#6b7280',
              marginBottom: '5px',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Location Zone
            </label>
            <div style={{ fontSize: '14px', color: '#111827' }}>
              {user?.location_zone}
            </div>
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '12px', 
              color: '#6b7280',
              marginBottom: '5px',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Account Type
            </label>
            <div style={{ 
              display: 'inline-block',
              fontSize: '12px', 
              padding: '4px 12px',
              background: user?.is_admin ? '#dbeafe' : '#d1fae5',
              color: user?.is_admin ? '#1e40af' : '#065f46',
              borderRadius: '12px',
              fontWeight: '600'
            }}>
              {user?.is_admin ? 'Administrator' : 'Trader'}
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon Section */}
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        maxWidth: '600px',
        marginTop: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
          <img
            src="/src/assets/settings-icon.svg"
            alt="Settings Icon"
            style={{ width: '24px', height: '24px' }}
          />
          <h2 style={{ 
            margin: 0, 
            fontSize: '18px', 
            color: '#111827',
            fontWeight: '600'
          }}>
            Coming Soon
          </h2>
        </div>
        <ul style={{ 
          margin: 0, 
          paddingLeft: '20px',
          color: '#6b7280',
          fontSize: '14px',
          lineHeight: '1.8'
        }}>
          {user?.is_admin ? (
            <>
              <li>Admin analytics and insights</li>
              <li>User management</li>
              <li>System configuration</li>
              <li>ML model monitoring</li>
            </>
          ) : (
            <>
              <li>Product recommendations</li>
              <li>Group-buy opportunities</li>
              <li>Transaction history</li>
              <li>Purchase analytics</li>
            </>
          )}
        </ul>
      </div>
    </div>
  )
}

export default Dashboard