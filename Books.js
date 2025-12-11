const mongoose = require('mongoose');

// Define the Book schema with validation
const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true, // URL of book cover image
  },
});

// Create and export the Book model
const Book = mongoose.model('Book', bookSchema);
module.exports = Book;