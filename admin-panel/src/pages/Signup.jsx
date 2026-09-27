
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    // =========================
    // VALIDATION
    // =========================

    if (!cleanName) {
      setError('Please enter your name');
      return;
    }

    if (!cleanEmail) {
      setError('Please enter your email');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!confirmPassword) {
      setError('Please confirm your password');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const registerData = {
      name: cleanName,
      email: cleanEmail,
      password: password,
    };

    setLoading(true);

    try {
      // =========================
      // ADMIN REGISTER API
      // =========================

      const response = await fetch(
        'https://grocery-store-backend-cyan.vercel.app/api/admin/auth/register',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },

          body: JSON.stringify(registerData),
        }
      );

      console.log('HTTP STATUS:', response.status);

      const text = await response.text();

      console.log('RAW SERVER RESPONSE:', text);

      if (!text || !text.trim()) {
        throw new Error(
          `Server returned an empty response. HTTP ${response.status}`
        );
      }

      let data;

      try {
        data = JSON.parse(text);
      } catch (jsonError) {
        console.error('JSON PARSE ERROR:', jsonError);

        throw new Error(
          `Server returned invalid JSON: ${text}`
        );
      }

      console.log('SERVER RESPONSE:', data);

      // =========================
      // SERVER ERROR
      // =========================

      if (!response.ok) {
        throw new Error(
          data.message ||
          data.error ||
          `Registration failed. HTTP ${response.status}`
        );
      }

      // =========================
      // SUCCESS
      // =========================

      if (data.success) {
        console.log('ADMIN REGISTERED SUCCESSFULLY');

        if (data.token) {
          localStorage.setItem('token', data.token);
        }

        if (data.user) {
          localStorage.setItem(
            'adminUser',
            JSON.stringify(data.user)
          );
        }

        setSuccess(
          data.message ||
          'Admin account created successfully!'
        );

        // Clear form
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');

        // Go to login
        setTimeout(() => {
          navigate('/login');
        }, 1500);

      } else {
        setError(
          data.message ||
          'Registration failed'
        );
      }

    } catch (error) {
      console.error('REGISTER ERROR:', error);

      setError(
        error.message ||
        'Something went wrong while registering'
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-card">

        {/* HEADER */}
        <div className="auth-header">
          <h1>Create Admin Account</h1>

          <p>
            Register a new admin account
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        {/* SUCCESS */}
        {success && (
          <div className="auth-success">
            {success}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleRegister}>

          {/* NAME */}
          <div className="form-group">
            <label>Name</label>

            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              autoComplete="name"
            />
          </div>

          {/* EMAIL */}
          <div className="form-group">
            <label>Email</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
            />
          </div>

          {/* PASSWORD */}
          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          {/* CONFIRM PASSWORD */}
          <div className="form-group">
            <label>Confirm Password</label>

            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading
              ? 'Creating Account...'
              : 'Sign Up'}
          </button>

        </form>

        {/* FOOTER */}
        <div className="auth-footer">
          Already have an account?{' '}

          <Link to="/login">
            Login
          </Link>
        </div>

      </div>

    </div>
  );
}

export default Signup;