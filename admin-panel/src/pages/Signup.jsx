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

 const handleRegister = async () => {
  try {
    console.log("1. Register started");

    const response = await fetch(
      "https://grocery-store-backend-tqu4.vercel.app/api/admin/auth/register",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name:"",
          email:"" ,
          password: "",
        }),
      }
    );

    console.log("2. Status:", response.status);

    const text = await response.text();

    console.log("3. Raw response:", text);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    const data = JSON.parse(text);

    console.log("4. Register response:", data);

    if (data.success) {
      console.log("Admin registered successfully");
      console.log("Token:", data.token);
    }
  } catch (error) {
    console.error("REGISTER ERROR:", error);
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
            />
          </div>

          <div className="form-group">
            <label>Email</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>

            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
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