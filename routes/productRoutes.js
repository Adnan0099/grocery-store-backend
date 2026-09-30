const express = require('express');
const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('cloudinary').v2;

const Product = require('../models/Product');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'grocery-products' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};

router.post(
  '/',
  authMiddleware,
  upload.single('image'),
  async (req, res) => {
    try {
      const { name, description, price, category, stock, unit } = req.body;

      let imageUrl = '';

      if (req.file) {
        const uploadedImage = await uploadToCloudinary(req.file);
        imageUrl = uploadedImage.secure_url;
      }

      const product = await Product.create({
        name,
        description,
        price: Number(price),
        category,
        stock: Number(stock),
        unit: unit || 'piece',
        image: imageUrl,
      });

      return res.status(201).json({
        success: true,
        message: 'Product added successfully',
        product,
      });
    } catch (error) {
      console.error('Product upload error:', error);

      return res.status(500).json({
        success: false,
        message: error.message || 'Product upload failed',
      });
    }
  }
);

module.exports = router;