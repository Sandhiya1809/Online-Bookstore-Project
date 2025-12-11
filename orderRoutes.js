const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// ✅ Place a new order
// ✅ Place a new order
router.post('/place-order', async (req, res) => {
  console.log("📥 Incoming order request:", req.body); // 

  try {
    let { user, items } = req.body;


    // Check user and items exist
    if (!user || !items) {
      return res.status(400).json({ success: false, message: "❌ User and items are required" });
    }

    // Wrap single item object into array if needed
    if (!Array.isArray(items)) {
      items = [items];
    }

    // Remove invalid items (missing bookId)
    items = items.filter(item => item.bookId);

    if (items.length === 0) {
      return res.status(400).json({ success: false, message: "❌ No valid items to place order" });
    }

    // Calculate total safely
    const total = items.reduce((sum, item) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 1;
      return sum + price * quantity;
    }, 0);

    const newOrder = new Order({ user, items, total });
    await newOrder.save();

    res.status(201).json({
      success: true,
      message: "✅ Order placed successfully!",
      order: newOrder,
      orderId: newOrder._id
    });

  } catch (error) {
    console.error("❌ Order placement error:", error);
    res.status(500).json({ success: false, message: "❌ Failed to place order", error });
  }
});

// ✅ Get all orders (Admin / Testing)
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: '❌ Failed to fetch orders', error });
  }
});

// ✅ Get orders by specific user
router.get('/orders/:user', async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.user }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: '❌ Failed to fetch user orders', error });
  }
});

module.exports = router;
