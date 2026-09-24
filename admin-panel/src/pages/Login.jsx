import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

 const handleLogin = async () => {
  try {
    console.log("1. Login started");

    const response = await fetch(
      "https://grocery-store-backend-tqu4.vercel.app/api/admin/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      }
    );

    console.log("2. Status:", response.status);
    console.log("3. Content-Type:", response.headers.get("content-type"));

    // IMPORTANT: pehle text read karein
    const text = await response.text();

    console.log("4. Raw API response:", text);

    if (!text) {
      throw new Error(
        `Backend ne empty response diya. HTTP Status: ${response.status}`
      );
    }

    let data;

    try {
      data = JSON.parse(text);
    } catch (jsonError) {
      console.error("JSON Parse Error:", jsonError);
      throw new Error("Backend ne valid JSON return nahi kiya.");
    }

    console.log("5. Parsed data:", data);

    if (!response.ok) {
      throw new Error(
        data.message || `Login failed. Status: ${response.status}`
      );
    }

    if (data.success) {
      console.log("6. Login successful");
      console.log("Token:", data.token);

      // TOKEN SAVE
      localStorage.setItem("adminToken", data.token);

      // USER SAVE
      localStorage.setItem(
        "adminUser",
        JSON.stringify(data.user)
      );

      console.log("7. Token saved:", localStorage.getItem("adminToken"));

      // Admin panel open
      // navigate("/admin");
    }
  } catch (error) {
    console.error("LOGIN ERROR:", error);
  }
};

  return (
    <div className="auth-page">

      <div className="auth-card">

        <div className="auth-header">
          <h1>Admin Login</h1>
          <p>Login to your grocery admin panel</p>
        </div>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>

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
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
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