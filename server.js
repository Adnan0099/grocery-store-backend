const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===============================
// API ROUTES
// ===============================

app.use('/api/auth', authRoutes);

app.use('/api/admin/auth', adminAuthRoutes);

app.use('/api/products', productRoutes);

app.use('/api/categories', categoryRoutes);

app.use('/api/orders', orderRoutes);

// ===============================
// TEST
// ===============================

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Grocery Store API is running 🚀'
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend is working 🚀'
  });
});

// ===============================
// 404
// ===============================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// ===============================
// LOCAL
// ===============================

if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  connectDB()
    .then(() => {
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch((error) => {
      console.error('Database connection failed:', error);
      process.exit(1);
    });
}

module.exports = app;