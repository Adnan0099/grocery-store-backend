
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
    // IMPORTANT: Page refresh rokna
    e.preventDefault();

    console.log('1. Register started');

    setError('');
    setSuccess('');

    // Basic validation
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        'https://grocery-store-backend-tqu4.vercel.app/api/admin/auth/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password,
          }),
        }
      );

      console.log('2. Status:', response.status);

      // Pehle raw text read karein
      const text = await response.text();

      console.log('3. Raw response:', text);

      // Empty response handle
      if (!text) {
        throw new Error(
          `Server returned an empty response. HTTP ${response.status}`
        );
      }

      let data;

      try {
        data = JSON.parse(text);
      } catch (jsonError) {
        throw new Error(
          `Server returned invalid JSON: ${text}`
        );
      }

      console.log('4. Register response:', data);

      if (!response.ok) {
        throw new Error(
          data.message || `Registration failed. HTTP ${response.status}`
        );
      }

      if (data.success) {
        console.log('Admin registered successfully');

        // Agar backend token return karta hai
        if (data.token) {
          localStorage.setItem('token', data.token);
          console.log('Token saved');
        }

        setSuccess(
          data.message || 'Admin account created successfully!'
        );

        // Fields clear
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');

        // 1.5 second ke baad login page
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        setError(
          data.message || 'Registration failed'
        );
      }

    } catch (error) {
      console.error('REGISTER ERROR:', error);

      setError(
        error.message || 'Something went wrong while registering'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-card">

        <div className="auth-header">
          <h1>Create Admin Account</h1>
          <p>Register a new admin account</p>
        </div>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        {success && (
          <div className="auth-success">
            {success}
          </div>
        )}

        <form onSubmit={handleRegister}>

          <div className="form-group">
            <label>Name</label>

            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Email</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>

            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
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
              ? 'Creating Account...'
              : 'Sign Up'}
          </button>

        </form>

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
