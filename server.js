const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ✅ MongoDB Atlas connection (password encoded)
mongoose.connect('mongodb+srv://sandhiyababu1809:Bookstore123%21@books-cluster.yf0e9io.mongodb.net/bookstore?retryWrites=true&w=majority')
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Import routes
const bookRoutes = require('./routes/bookRoutes');
const orderRoutes = require('./routes/orderRoutes');

app.use('/api', bookRoutes);
app.use('/api', orderRoutes);

// ✅ Start server
app.listen(5000, () => {
  console.log('🚀 Backend running on http://localhost:5000');
});
