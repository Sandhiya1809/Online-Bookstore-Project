const express = require('express');
const router = express.Router();
const Book = require('../models/Books');

// POST /api/books - Add a new book
router.post('/books', async (req, res) => {
  try {
    const newBook = new Book(req.body);
    await newBook.save();
    res.status(201).json({ message: 'Book added successfully', book: newBook });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/books - Get all books
router.get('/books', async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/books/:id - View a single book by MongoDB ID ✅
router.get('/books/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json(book);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/books/:id - Update a book by ID
router.put('/books/:id', async (req, res) => {
  try {
    const updatedBook = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ message: 'Book updated', book: updatedBook });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/books/:id - Delete a book by ID
router.delete('/books/:id', async (req, res) => {
  try {
    await Book.findByIdAndDelete(req.params.id);
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/books/view/:title - View a single book by title
router.get('/books/view/:title', async (req, res) => {
  try {
    const book = await Book.findOne({ title: new RegExp(req.params.title, 'i') }); // case-insensitive match
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json(book);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export the router
module.exports = router;