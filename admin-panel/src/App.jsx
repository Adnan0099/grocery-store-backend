import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Orders from './pages/Orders';
import Customers from './pages/Customers';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import './App.css';

function AdminLayout() {
  return (
    <div className="admin-layout">

      <Sidebar />

      <div className="main-area">

        <Header />

        <main className="page-content">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
 
            <Route path="/orders" element={<Orders />} />
            <Route path="/customers" element={<Customers />} />
            <Route
              path="*"
              element={<Navigate to="/dashboard" replace />}
            />
            <Route path="/categories" element={<Categories />}/>
          </Routes>
        </main>

      </div>

    </div>
  );
}

function App() {
  const token = localStorage.getItem('adminToken');

  if (!token) {
    return (
      <div className="login-required">
        <h2>Admin Login Required</h2>
        <p>Please login to access the dashboard.</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AdminLayout />
    </BrowserRouter>
  );
}

export default App;