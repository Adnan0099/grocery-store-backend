const express = require('express');
const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('cloudinary').v2;

const Category = require('../models/Category');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();


// ========================================
// CLOUDINARY CONFIG
// ========================================

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


// ========================================
// MULTER MEMORY STORAGE
// IMPORTANT:
// DO NOT SAVE FILE TO VERCEL DISK
// ========================================

const storage = multer.memoryStorage();


// ========================================
// FILE FILTER
// ========================================

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
      new Error(
        'Only JPG, JPEG and PNG images are allowed.'
      )
    );
  }
};


const upload = multer({
  storage,
  fileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});


// ========================================
// UPLOAD IMAGE TO CLOUDINARY
// ========================================

const uploadToCloudinary = (fileBuffer) => {

  return new Promise((resolve, reject) => {

    const uploadStream =
      cloudinary.uploader.upload_stream(
        {
          folder: 'grocery-store/categories',
          resource_type: 'image',
        },

        (error, result) => {

          if (error) {
            reject(error);
          } else {
            resolve(result);
          }

        }
      );

    streamifier
      .createReadStream(fileBuffer)
      .pipe(uploadStream);
  });
};


// ========================================
// GET ALL CATEGORIES
// PUBLIC
// ========================================

router.get('/', async (req, res) => {

  try {

    const categories =
      await Category.find()
        .sort({
          createdAt: -1,
        });

    res.json({
      success: true,
      count: categories.length,
      categories,
    });

  } catch (error) {

    console.error(
      'Get Categories Error:',
      error
    );

    res.status(500).json({
      success: false,
      message:
        'Failed to fetch categories',
    });
  }
});


// ========================================
// GET SINGLE CATEGORY
// ========================================

router.get('/:id', async (req, res) => {

  try {

    const category =
      await Category.findById(
        req.params.id
      );

    if (!category) {

      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    res.json({
      success: true,
      category,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message:
        'Failed to fetch category',
    });
  }
});


// ========================================
// ADD CATEGORY
// ADMIN ONLY
// ========================================

router.post(
  '/',
  authMiddleware,
  upload.single('image'),

  async (req, res) => {

    try {

      if (req.user.role !== 'admin') {

        return res.status(403).json({
          success: false,
          message:
            'Admin access required',
        });
      }


      const {
        name,
        description,
      } = req.body;


      if (!name || !name.trim()) {

        return res.status(400).json({
          success: false,
          message:
            'Category name is required',
        });
      }


      const existingCategory =
        await Category.findOne({
          name: name.trim(),
        });


      if (existingCategory) {

        return res.status(409).json({
          success: false,
          message:
            'Category already exists',
        });
      }


      // ==================================
      // UPLOAD IMAGE
      // ==================================

      let image = '';


      if (req.file) {

        const uploadedImage =
          await uploadToCloudinary(
            req.file.buffer
          );

        image =
          uploadedImage.secure_url;
      }


      // ==================================
      // CREATE CATEGORY
      // ==================================

      const category =
        await Category.create({

          name: name.trim(),

          description:
            description || '',

          image,

        });


      res.status(201).json({

        success: true,

        message:
          'Category added successfully',

        category,

      });

    } catch (error) {

      console.error(
        'Add Category Error:',
        error
      );

      res.status(500).json({

        success: false,

        message:
          error.message ||
          'Failed to add category',

      });
    }
  }
);


// ========================================
// UPDATE CATEGORY
// ADMIN ONLY
// ========================================

router.put(
  '/:id',
  authMiddleware,
  upload.single('image'),

  async (req, res) => {

    try {

      if (req.user.role !== 'admin') {

        return res.status(403).json({
          success: false,
          message:
            'Admin access required',
        });
      }


      const category =
        await Category.findById(
          req.params.id
        );


      if (!category) {

        return res.status(404).json({
          success: false,
          message:
            'Category not found',
        });
      }


      const {
        name,
        description,
        isActive,
      } = req.body;


      if (!name || !name.trim()) {

        return res.status(400).json({
          success: false,
          message:
            'Category name is required',
        });
      }


      const duplicate =
        await Category.findOne({

          name: name.trim(),

          _id: {
            $ne: req.params.id,
          },

        });


      if (duplicate) {

        return res.status(409).json({
          success: false,
          message:
            'Another category with this name already exists',
        });
      }


      category.name =
        name.trim();

      category.description =
        description || '';


      if (isActive !== undefined) {

        category.isActive =
          isActive === true ||
          isActive === 'true';
      }


      // ==================================
      // NEW IMAGE
      // ==================================

      if (req.file) {

        const uploadedImage =
          await uploadToCloudinary(
            req.file.buffer
          );

        category.image =
          uploadedImage.secure_url;
      }


      await category.save();


      res.json({

        success: true,

        message:
          'Category updated successfully',

        category,

      });

    } catch (error) {

      console.error(
        'Update Category Error:',
        error
      );

      res.status(500).json({

        success: false,

        message:
          error.message ||
          'Failed to update category',

      });
    }
  }
);


// ========================================
// DELETE CATEGORY
// ADMIN ONLY
// ========================================

router.delete(
  '/:id',
  authMiddleware,

  async (req, res) => {

    try {

      if (req.user.role !== 'admin') {

        return res.status(403).json({
          success: false,
          message:
            'Admin access required',
        });
      }


      const category =
        await Category.findById(
          req.params.id
        );


      if (!category) {

        return res.status(404).json({
          success: false,
          message:
            'Category not found',
        });
      }


      await Category.findByIdAndDelete(
        req.params.id
      );


      res.json({

        success: true,

        message:
          'Category deleted successfully',

      });

    } catch (error) {

      console.error(
        'Delete Category Error:',
        error
      );

      res.status(500).json({

        success: false,

        message:
          'Failed to delete category',

      });
    }
  }
);


module.exports = router;