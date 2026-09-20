const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const Product = require('../models/Product');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/* =========================================
   MULTER CONFIGURATION
========================================= */

const uploadDir = path.join(__dirname, '../uploads/products');

// Create folder if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },

  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() +
      '-' +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error('Only JPG, JPEG and PNG images are allowed'),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

/* =========================================
   GET ALL PRODUCTS
========================================= */

router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error('Get Products Error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
    });
  }
});

/* =========================================
   GET SINGLE PRODUCT
========================================= */

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
    });
  }
});

/* =========================================
   ADD PRODUCT
========================================= */

router.post(
  '/',
  authMiddleware,
  upload.single('image'),
  async (req, res) => {
    try {
      console.log('BODY:', req.body);
      console.log('FILE:', req.file);

      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required',
        });
      }

      const {
        name,
        description,
        price,
        category,
        stock,
        unit,
      } = req.body;

      if (!name || price === undefined || !category) {
        return res.status(400).json({
          success: false,
          message: 'Name, price and category are required',
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Product image is required',
        });
      }

      const imageUrl =
        `/uploads/products/${req.file.filename}`;

      const product = await Product.create({
        name,
        description: description || '',
        price: Number(price),
        category,
        stock: Number(stock) || 0,
        image: imageUrl,
        unit: unit || 'piece',
      });

      res.status(201).json({
        success: true,
        message: 'Product added successfully',
        product,
      });

    } catch (error) {
      console.error('Add Product Error:', error);

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to add product',
      });
    }
  }
);

/* =========================================
   UPDATE PRODUCT
========================================= */

router.put(
  '/:id',
  authMiddleware,
  upload.single('image'),
  async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required',
        });
      }

      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      const {
        name,
        description,
        price,
        category,
        stock,
        unit,
        isActive,
      } = req.body;

      product.name = name;
      product.description = description || '';
      product.price = Number(price);
      product.category = category;
      product.stock = Number(stock) || 0;
      product.unit = unit || 'piece';

      if (isActive !== undefined) {
        product.isActive =
          isActive === 'true' || isActive === true;
      }

      // New image uploaded
      if (req.file) {
        // Delete old image
        if (product.image) {
          const oldImagePath = path.join(
            __dirname,
            '..',
            product.image
          );

          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }

        product.image =
          `/uploads/products/${req.file.filename}`;
      }

      await product.save();

      res.json({
        success: true,
        message: 'Product updated successfully',
        product,
      });
    } catch (error) {
      console.error('Update Product Error:', error);

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update product',
      });
    }
  }
);

/* =========================================
   DELETE PRODUCT
========================================= */

router.delete(
  '/:id',
  authMiddleware,
  async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required',
        });
      }

      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      // Delete image from uploads folder
      if (product.image) {
        const imagePath = path.join(
          __dirname,
          '..',
          product.image
        );

        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }

      await Product.findByIdAndDelete(req.params.id);

      res.json({
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (error) {
      console.error('Delete Product Error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to delete product',
      });
    }
  }
);

module.exports = router;