const express = require('express');

const router = express.Router();

const Order = require('../models/Order');
const Product = require('../models/Product');
const authMiddleware = require('../middleware/authMiddleware');


/*
====================================================
CREATE ORDER
POST /api/orders
====================================================
*/
router.post('/', authMiddleware, async (req, res) => {
  const {
    customer,
    items,
    subtotal,
    deliveryFee,
    total,
    deliveryAddress,
    paymentMethod,
  } = req.body;

  const changedStock = [];

  try {
    // -----------------------------------------------
    // VALIDATION
    // -----------------------------------------------

    if (!customer || !customer.name || !customer.email) {
      return res.status(400).json({
        success: false,
        message: 'Customer information is required',
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order items are required',
      });
    }

    if (!deliveryAddress || !deliveryAddress.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Delivery address is required',
      });
    }


    // -----------------------------------------------
    // CHECK PRODUCTS + DECREASE STOCK
    // -----------------------------------------------

    const orderItems = [];

    for (const item of items) {
      const productId = item.productId;
      const quantity = Number(item.quantity);

      if (!productId) {
        throw new Error(
          `Product ID missing for ${item.name || 'product'}`
        );
      }

      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new Error(
          `Invalid quantity for ${item.name || 'product'}`
        );
      }


      /*
      IMPORTANT:

      stock >= quantity condition means stock can never
      become negative.

      Example:

      Stock = 10
      Order quantity = 3

      New stock = 7
      */

      const product = await Product.findOneAndUpdate(
        {
          _id: productId,
          stock: { $gte: quantity },
        },
        {
          $inc: {
            stock: -quantity,
          },
        },
        {
          new: true,
        }
      );


      // ---------------------------------------------
      // PRODUCT NOT FOUND / INSUFFICIENT STOCK
      // ---------------------------------------------

      if (!product) {
        const existingProduct = await Product.findById(
          productId
        );

        if (!existingProduct) {
          throw new Error(
            `Product not found: ${item.name || productId}`
          );
        }

        throw new Error(
          `Insufficient stock for ${existingProduct.name}. Available stock: ${existingProduct.stock}, requested: ${quantity}`
        );
      }


      // Save changed stock so we can restore it if
      // order creation fails.
      changedStock.push({
        productId: product._id,
        quantity,
      });


      // ---------------------------------------------
      // ORDER ITEM
      // ---------------------------------------------

      orderItems.push({
        productId: product._id,
        name: product.name || item.name || '',
        image: product.image || item.image || '',
        price: Number(
          item.price !== undefined
            ? item.price
            : product.price
        ),
        quantity,
        unit: item.unit || product.unit || 'piece',
      });
    }


    // -----------------------------------------------
    // GENERATE ORDER NUMBER
    // -----------------------------------------------

    const orderNumber =
      'ORD-' +
      Date.now() +
      '-' +
      Math.floor(1000 + Math.random() * 9000);


    // -----------------------------------------------
    // CREATE ORDER
    // -----------------------------------------------

    const order = await Order.create({
      orderNumber,

      customer: {
        userId: req.user.id,
        name: customer.name.trim(),
        email: customer.email.trim().toLowerCase(),
        phone: customer.phone || '',
      },

      items: orderItems,

      subtotal: Number(subtotal) || 0,
      deliveryFee: Number(deliveryFee) || 0,
      total: Number(total) || 0,

      deliveryAddress: deliveryAddress.trim(),

      paymentMethod:
        paymentMethod || 'Cash on Delivery',

      status: 'Pending',
    });


    // -----------------------------------------------
    // SUCCESS
    // -----------------------------------------------

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order,
    });

  } catch (error) {

    console.error('Create Order Error:', error);


    // -----------------------------------------------
    // RESTORE STOCK IF ORDER CREATION FAILED
    // -----------------------------------------------

    if (changedStock.length > 0) {
      try {
        for (const changed of changedStock) {
          await Product.findByIdAndUpdate(
            changed.productId,
            {
              $inc: {
                stock: changed.quantity,
              },
            }
          );
        }

        console.log(
          'Stock restored because order creation failed'
        );

      } catch (restoreError) {
        console.error(
          'Stock Restore Error:',
          restoreError
        );
      }
    }


    return res.status(400).json({
      success: false,
      message:
        error.message || 'Failed to place order',
    });
  }
});


/*
====================================================
GET MY ORDERS
GET /api/orders/my-orders
====================================================
*/
router.get('/my-orders', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({
      'customer.userId': req.user.id,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      orders,
    });

  } catch (error) {
    console.error(
      'Get My Orders Error:',
      error
    );

    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
    });
  }
});


/*
====================================================
GET ALL ORDERS
GET /api/orders

ADMIN ONLY
====================================================
*/
router.get('/', authMiddleware, async (req, res) => {
  try {

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      orders,
    });

  } catch (error) {

    console.error(
      'Get All Orders Error:',
      error
    );

    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
    });
  }
});


/*
====================================================
GET SINGLE ORDER
GET /api/orders/:id
====================================================
*/
router.get('/:id', authMiddleware, async (req, res) => {
  try {

    const order = await Order.findById(
      req.params.id
    ).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }


    // Admin can see any order
    if (req.user.role === 'admin') {
      return res.json({
        success: true,
        order,
      });
    }


    // Customer can only see own order
    if (
      String(order.customer?.userId) !==
      String(req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own orders',
      });
    }


    res.json({
      success: true,
      order,
    });

  } catch (error) {

    console.error(
      'Get Single Order Error:',
      error
    );

    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
    });
  }
});


/*
====================================================
UPDATE ORDER STATUS
PUT /api/orders/:id/status

ADMIN ONLY
====================================================
*/
router.put(
  '/:id/status',
  authMiddleware,
  async (req, res) => {
    try {

      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required',
        });
      }


      const { status } = req.body;


      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required',
        });
      }


      const allowedStatuses = [
        'Pending',
        'Confirmed',
        'Processing',
        'Shipped',
        'Delivered',
        'Cancelled',
      ];


      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid order status',
        });
      }


      const order =
        await Order.findByIdAndUpdate(
          req.params.id,
          {
            status,
          },
          {
            new: true,
          }
        );


      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
        });
      }


      res.json({
        success: true,
        message:
          'Order status updated successfully',
        order,
      });

    } catch (error) {

      console.error(
        'Update Order Status Error:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          'Failed to update order status',
      });
    }
  }
);


/*
====================================================
DELETE ORDER
DELETE /api/orders/:id

ADMIN:
Can delete any order.

CUSTOMER:
Can delete only own order.

STOCK:
Order delete hone par stock restore hoga.
====================================================
*/
router.delete(
  '/:id',
  authMiddleware,
  async (req, res) => {
    try {

      const order = await Order.findById(
        req.params.id
      );


      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
        });
      }


      // ---------------------------------------------
      // CUSTOMER OWNERSHIP CHECK
      // ---------------------------------------------

      if (req.user.role !== 'admin') {

        if (
          String(order.customer?.userId) !==
          String(req.user.id)
        ) {
          return res.status(403).json({
            success: false,
            message:
              'You can only delete your own orders',
          });
        }
      }


      // ---------------------------------------------
      // RESTORE PRODUCT STOCK
      // ---------------------------------------------

      if (Array.isArray(order.items)) {

        for (const item of order.items) {

          const quantity = Number(
            item.quantity
          );


          if (
            item.productId &&
            Number.isInteger(quantity) &&
            quantity > 0
          ) {

            await Product.findByIdAndUpdate(
              item.productId,
              {
                $inc: {
                  stock: quantity,
                },
              }
            );
          }
        }
      }


      // ---------------------------------------------
      // DELETE ORDER
      // ---------------------------------------------

      await Order.findByIdAndDelete(
        req.params.id
      );


      res.json({
        success: true,
        message:
          'Order deleted successfully',
      });

    } catch (error) {

      console.error(
        'Delete Order Error:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          'Failed to delete order',
      });
    }
  }
);


/*
====================================================
EXPORT
====================================================
*/

module.exports = router;