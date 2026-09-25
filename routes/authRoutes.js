const express = require('express');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

// ==========================================
// TEST / AUTH API
// ==========================================

router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Auth API is working 🚀',
    endpoints: {
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      me: 'GET /api/auth/me'
    }
  });
});

// ==========================================
// REGISTER
// ==========================================

router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone = '',
      address = ''
    } = req.body || {};

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check existing user
    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email is already registered.'
      });
    }

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      phone: phone ? phone.trim() : '',
      address: address ? address.trim() : '',
      role: 'customer'
    });

    // JWT
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is missing in environment variables.');

      return res.status(500).json({
        success: false,
        message: 'JWT configuration is missing on server.'
      });
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d'
      }
    );

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address
      }
    });

  } catch (error) {
    console.error('REGISTER ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error during registration.',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : undefined
    });
  }
});

// ==========================================
// LOGIN
// ==========================================

router.post('/login', async (req, res) => {
  try {
    const {
      email,
      password
    } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const passwordMatch = await user.comparePassword(password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is missing in environment variables.');

      return res.status(500).json({
        success: false,
        message: 'JWT configuration is missing on server.'
      });
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d'
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address
      }
    });

  } catch (error) {
    console.error('LOGIN ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error during login.',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : undefined
    });
  }
});

// ==========================================
// CURRENT USER
// ==========================================

router.get('/me', protect, async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('ME ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to get current user.'
    });
  }
});

module.exports = router;