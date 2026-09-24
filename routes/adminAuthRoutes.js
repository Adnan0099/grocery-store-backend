const express = require('express');
const jwt = require('jsonwebtoken');

const User = require('../models/User');

const router = express.Router();


// ======================================
// ADMIN SIGNUP
// ======================================

router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password
    } = req.body;

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

    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email is already registered.'
      });
    }

    const admin = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      phone: '',
      address: '',
      role: 'admin'
    });

    const token = jwt.sign(
      {
        id: admin._id,
        role: admin.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d'
      }
    );

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully.',
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (error) {
    console.error('Admin register error:', error);

    res.status(500).json({
      success: false,
      message: 'Server error during admin registration.'
    });
  }
});


router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Admin Auth API is working',
    endpoints: {
      register: 'POST /api/admin/auth/register',
      login: 'POST /api/admin/auth/login'
    }
  });
});


// ======================================
// ADMIN LOGIN
// ======================================

router.post('/login', async (req, res) => {
  try {
    const {
      email,
      password
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const admin = await User.findOne({
      email: normalizedEmail
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Only admin can login to admin panel
    if (admin.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin account required.'
      });
    }

    const passwordMatch = await admin.comparePassword(password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = jwt.sign(
      {
        id: admin._id,
        role: admin.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d'
      }
    );

    res.json({
      success: true,
      message: 'Admin login successful.',
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);

    res.status(500).json({
      success: false,
      message: 'Server error during admin login.'
    });
  }
});


module.exports = router;