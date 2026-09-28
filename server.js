const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Grocery Store API is running 🚀'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is working 🚀'
  });
});

app.use('/api/auth', authRoutes);

module.exports = app;