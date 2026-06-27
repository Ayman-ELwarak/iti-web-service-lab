const express = require('express');
const db = require('../../db/database');

const router = express.Router();

// GET /books
router.get('/', (req, res) => {
  const { author_id } = req.query;
  let books;
  if (author_id) {
    books = db.prepare(`
      SELECT books.*, authors.name AS author_name
      FROM books JOIN authors ON books.author_id = authors.id
      WHERE books.author_id = ?
    `).all(author_id);
  } else {
    books = db.prepare('SELECT * FROM books').all();
  }
  res.json(books);
});

// GET /books/:id
router.get('/:id', (req, res) => {
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  if (!book) return res.status(404).json({ error: 'Book not found' });

  const author = db.prepare('SELECT * FROM authors WHERE id = ?').get(book.author_id);
  res.json({ ...book, author });
});

// POST /books
router.post('/', (req, res) => {
  const { title, year, author_id } = req.body;

  const author = db.prepare('SELECT * FROM authors WHERE id = ?').get(author_id);
  if (!author) return res.status(404).json({ error: 'Author not found' });

  const result = db.prepare('INSERT INTO books (title, year, author_id) VALUES (?, ?, ?)').run(title, year || null, author_id);
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(book);
});

// PATCH /books/:id
router.patch('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Book not found' });

  const title = req.body.title !== undefined ? req.body.title : existing.title;
  const year = req.body.year !== undefined ? req.body.year : existing.year;
  const author_id = req.body.author_id !== undefined ? req.body.author_id : existing.author_id;

  db.prepare('UPDATE books SET title = ?, year = ?, author_id = ? WHERE id = ?').run(title, year, author_id, req.params.id);
  const updated = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /books/:id
router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Book not found' });

  db.prepare('DELETE FROM books WHERE id = ?').run(req.params.id);
  res.sendStatus(204);
});

module.exports = router;
