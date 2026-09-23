
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password.');
      return;
    }

    if (!API_URL) {
      setError('API URL is not configured.');
      console.error(
        'VITE_API_URL is missing. Add it to your .env file or Vercel Environment Variables.'
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      console.log('LOGIN RESPONSE:', data);

      if (!response.ok) {
        setError(
          data?.message ||
            data?.error ||
            'Invalid email or password.'
        );
        return;
      }

      // Check token
      if (!data?.token) {
        console.error('Token missing from API response:', data);
        setError('Login successful but token was not received.');
        return;
      }

      // Check admin role
      if (data?.user?.role !== 'admin') {
        setError('Only admin users can access the admin panel.');
        return;
      }

      // Save admin token
      localStorage.setItem(
        'adminToken',
        data.token
      );

      // Save admin user
      localStorage.setItem(
        'adminUser',
        JSON.stringify(data.user)
      );

      console.log(
        'Admin token saved:',
        localStorage.getItem('adminToken')
      );

      // Open dashboard
      navigate('/dashboard', { replace: true });

    } catch (error) {
      console.error('LOGIN ERROR:', error);

      setError(
        'Unable to connect to server. Please check your API URL and backend.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        <div style={styles.logo}>
          🛒
        </div>

        <h1 style={styles.title}>
          Admin Login
        </h1>

        <p style={styles.subtitle}>
          Login to access your admin dashboard
        </p>

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              Email
            </label>

            <input
              type="email"
              placeholder="Enter admin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              Password
            </label>

            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
            }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

        </form>

      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f5f7fb',
    padding: '20px',
    boxSizing: 'border-box',
  },

  card: {
    width: '100%',
    maxWidth: '420px',
    background: '#ffffff',
    borderRadius: '16px',
    padding: '40px',
    boxSizing: 'border-box',
    boxShadow: '0 10px 35px rgba(0, 0, 0, 0.08)',
  },

  logo: {
    width: '70px',
    height: '70px',
    borderRadius: '18px',
    background: '#16a34a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '34px',
    margin: '0 auto 20px',
  },

  title: {
    textAlign: 'center',
    margin: '0',
    fontSize: '28px',
    fontWeight: '700',
    color: '#111827',
  },

  subtitle: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: '8px',
    marginBottom: '30px',
    fontSize: '14px',
  },

  error: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
  },

  inputGroup: {
    marginBottom: '18px',
  },

  label: {
    display: 'block',
    marginBottom: '7px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  },

  input: {
    width: '100%',
    height: '48px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    padding: '0 14px',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
  },

  button: {
    width: '100%',
    height: '50px',
    border: 'none',
    borderRadius: '8px',
    background: '#16a34a',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
  },
};

export default Login;
