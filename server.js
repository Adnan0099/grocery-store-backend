const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminAuthRoutes = require('./routes/adminAuthRoutes');

const app = express();

// ==========================================
// DATABASE
// ==========================================

connectDB();

// ==========================================
// CORS
// ==========================================

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization'
    ]
  })
);

// ==========================================
// BODY PARSER
// ==========================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ==========================================
// STATIC UPLOADS
// ==========================================

app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
);

// ==========================================
// API TEST
// ==========================================

app.get('/', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Grocery Store API is running 🚀',
    api: {
      auth: '/api/auth',
      adminAuth: '/api/admin/auth',
      products: '/api/products',
      categories: '/api/categories',
      orders: '/api/orders'
    }
  });
});

// ==========================================
// HEALTH CHECK
// ==========================================

app.get('/api/health', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Server is healthy 🚀'
  });
});

// ==========================================
// AUTH ROUTES
// ==========================================

app.use('/api/auth', authRoutes);

// ==========================================
// ADMIN AUTH ROUTES
// ==========================================

app.use('/api/admin/auth', adminAuthRoutes);

// ==========================================
// PRODUCT ROUTES
// ==========================================

app.use('/api/products', productRoutes);

// ==========================================
// CATEGORY ROUTES
// ==========================================

app.use('/api/categories', categoryRoutes);

// ==========================================
// ORDER ROUTES
// ==========================================

app.use('/api/orders', orderRoutes);

// ==========================================
// API 404
// ==========================================

app.use('/api/*', (req, res) => {
  return res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`
  });
});

// ==========================================
// GENERAL ERROR HANDLER
// ==========================================

app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err);

  return res.status(500).json({
    success: false,
    message: 'Internal server error.'
  });
});

// ==========================================
// LOCAL DEVELOPMENT
// ==========================================

if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// ==========================================
// VERCEL
// ==========================================

module.exports = app;