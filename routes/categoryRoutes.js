const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const Category = require('../models/Category');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();


// ========================================
// UPLOAD DIRECTORY
// ========================================

const uploadDir = path.join(
  process.cwd(),
  'uploads',
  'categories'
);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}


// ========================================
// MULTER STORAGE
// ========================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const extension =
      path.extname(file.originalname);

    const filename =
      `${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${extension}`;

    cb(null, filename);
  },
});


// ========================================
// FILE FILTER
// ========================================

const fileFilter = (
  req,
  file,
  cb
) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
  ];

  if (
    allowedTypes.includes(
      file.mimetype
    )
  ) {
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


      const image =
        req.file
          ? `/uploads/categories/${req.file.filename}`
          : '';


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


      if (
        isActive !== undefined
      ) {
        category.isActive =
          isActive === true ||
          isActive === 'true';
      }


      // New image
      if (req.file) {
        category.image =
          `/uploads/categories/${req.file.filename}`;
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