const express = require('express');
const db = require('../../db/database');

const router = express.Router();

// GET /authors
router.get('/', (req, res) => {
  const authors = db.prepare('SELECT * FROM authors').all();
  res.json(authors);
});

// GET /authors/:id
router.get('/:id', (req, res) => {
  const author = db.prepare('SELECT * FROM authors WHERE id = ?').get(req.params.id);
  if (!author) return res.status(404).json({ error: 'Author not found' });
  res.json(author);
});

// POST /authors
router.post('/', (req, res) => {
  const { name, bio } = req.body;
  const result = db.prepare('INSERT INTO authors (name, bio) VALUES (?, ?)').run(name, bio || null);
  const author = db.prepare('SELECT * FROM authors WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(author);
});

// PATCH /authors/:id
router.patch('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM authors WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Author not found' });

  const name = req.body.name !== undefined ? req.body.name : existing.name;
  const bio = req.body.bio !== undefined ? req.body.bio : existing.bio;

  db.prepare('UPDATE authors SET name = ?, bio = ? WHERE id = ?').run(name, bio, req.params.id);
  const updated = db.prepare('SELECT * FROM authors WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /authors/:id
router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM authors WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Author not found' });

  db.prepare('DELETE FROM authors WHERE id = ?').run(req.params.id);
  res.sendStatus(204);
});

// GET /authors/:id/books
router.get('/:id/books', (req, res) => {
  const author = db.prepare('SELECT * FROM authors WHERE id = ?').get(req.params.id);
  if (!author) return res.status(404).json({ error: 'Author not found' });

  const books = db.prepare('SELECT * FROM books WHERE author_id = ?').all(req.params.id);
  res.json(books);
});

module.exports = router;
