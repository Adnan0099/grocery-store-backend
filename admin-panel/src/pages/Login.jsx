import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    // IMPORTANT: Form submit par page refresh rokna
    e.preventDefault();

    console.log('1. Login started');

    setError('');

    // Validation
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        'https://grocery-store-backend-tqu4.vercel.app/api/admin/auth/login',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },

          body: JSON.stringify({
            email: email.trim(),
            password: password,
          }),
        }
      );

      console.log('2. Status:', response.status);
      console.log(
        '3. Content-Type:',
        response.headers.get('content-type')
      );

      // Pehle raw response read karein
      const text = await response.text();

      console.log('4. Raw API response:', text);

      // Empty response
      if (!text) {
        throw new Error(
          `Backend ne empty response diya. HTTP Status: ${response.status}`
        );
      }

      let data;

      // JSON parse
      try {
        data = JSON.parse(text);
      } catch (jsonError) {
        console.error('JSON Parse Error:', jsonError);

        throw new Error(
          `Backend ne valid JSON return nahi kiya: ${text.substring(
            0,
            200
          )}`
        );
      }

      console.log('5. Parsed data:', data);

      // HTTP error
      if (!response.ok) {
        throw new Error(
          data.message ||
            `Login failed. Status: ${response.status}`
        );
      }

      // Login successful
      if (data.success) {
        console.log('6. Login successful');
        console.log('Token:', data.token);

        // =====================================
        // TOKEN SAVE
        // =====================================

        if (data.token) {
          localStorage.setItem(
            'adminToken',
            data.token
          );

          console.log(
            '7. Token saved:',
            localStorage.getItem('adminToken')
          );
        } else {
          console.warn('Backend ne token return nahi kiya');
        }

        // =====================================
        // USER SAVE
        // =====================================

        if (data.user) {
          localStorage.setItem(
            'adminUser',
            JSON.stringify(data.user)
          );
        }

        // =====================================
        // DASHBOARD
        // =====================================

        navigate('/dashboard');

      } else {
        setError(
          data.message || 'Invalid email or password'
        );
      }

    } catch (error) {
      console.error('LOGIN ERROR:', error);

      setError(
        error.message ||
          'Login failed. Please try again.'
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-card">

        <div className="auth-header">
          <h1>Admin Login</h1>

          <p>
            Login to your grocery admin panel
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        {/* LOGIN FORM */}
        <form onSubmit={handleLogin}>

          <div className="form-group">
            <label>Email</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading
              ? 'Logging in...'
              : 'Login'}
          </button>

        </form>

        <div className="auth-footer">
          Don't have an account?{' '}

          <Link to="/signup">
            Create Account
          </Link>
        </div>

      </div>

    </div>
  );
}

export default Login;