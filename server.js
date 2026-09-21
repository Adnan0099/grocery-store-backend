
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

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);

// Home route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Grocery Store API is running 🚀',
  });
});

// Connect MongoDB
connectDB();

// Local development only
if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, '0.0.0.0', () => {
    console.log('Server running on port ' + PORT);
  });
}

// Vercel
module.exports = app;
