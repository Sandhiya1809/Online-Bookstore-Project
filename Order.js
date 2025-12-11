const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: String, required: true }, // ✅ added
  items: [
    {
      bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
      title: String,
      price: Number,
      quantity: Number
    }
  ],
  total: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
