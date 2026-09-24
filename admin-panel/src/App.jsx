import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Orders from './pages/Orders';
import Customers from './pages/Customers';

import Login from './pages/Login';
import Signup from './pages/Signup';

import Sidebar from './components/Sidebar';
import Header from './components/Header';

import './App.css';


// ===============================
// Protected Route
// ===============================
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('adminToken');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}


// ===============================
// Admin Layout
// ===============================
function AdminLayout() {
  return (
    <div className="admin-layout">

      <Sidebar />

      <div className="main-area">

        <Header />

        <main className="page-content">

          <Routes>

            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            <Route
              path="/products"
              element={<Products />}
            />

            <Route
              path="/categories"
              element={<Categories />}
            />

            <Route
              path="/orders"
              element={<Orders />}
            />

            <Route
              path="/customers"
              element={<Customers />}
            />

            <Route
              path="*"
              element={<Navigate to="/dashboard" replace />}
            />

          </Routes>

        </main>

      </div>

    </div>
  );
}


// ===============================
// App
// ===============================
function App() {

  const token = localStorage.getItem('adminToken');

  return (
    <BrowserRouter>

      <Routes>

        {/* Login */}
        <Route
          path="/login"
          element={
            token
              ? <Navigate to="/dashboard" replace />
              : <Login />
          }
        />

        {/* Signup */}
        <Route
          path="/signup"
          element={
            token
              ? <Navigate to="/dashboard" replace />
              : <Signup />
          }
        />

        {/* Protected Admin Panel */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;