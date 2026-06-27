const express = require('express');
const db = require('../../db/database');

const router = express.Router();

// GET /loans
router.get('/', (req, res) => {
  const { returned } = req.query;
  let loans;
  if (returned === 'true') {
    loans = db.prepare('SELECT * FROM loans WHERE returned_at IS NOT NULL').all();
  } else if (returned === 'false') {
    loans = db.prepare('SELECT * FROM loans WHERE returned_at IS NULL').all();
  } else {
    loans = db.prepare('SELECT * FROM loans').all();
  }
  res.json(loans);
});

// GET /loans/:id
router.get('/:id', (req, res) => {
  const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(req.params.id);
  if (!loan) return res.status(404).json({ error: 'Loan not found' });

  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(loan.book_id);
  res.json({ ...loan, book });
});

// POST /loans
router.post('/', (req, res) => {
  const { book_id, borrower_name } = req.body;

  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(book_id);
  if (!book) return res.status(404).json({ error: 'Book not found' });

  const activeLoan = db.prepare('SELECT * FROM loans WHERE book_id = ? AND returned_at IS NULL').get(book_id);
  if (activeLoan) return res.status(409).json({ error: 'Book is already on active loan' });

  const result = db.prepare('INSERT INTO loans (book_id, borrower_name) VALUES (?, ?)').run(book_id, borrower_name);
  const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(loan);
});

// PATCH /loans/:id/return
router.patch('/:id/return', (req, res) => {
  const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(req.params.id);
  if (!loan) return res.status(404).json({ error: 'Loan not found' });

  if (loan.returned_at) return res.status(409).json({ error: 'Loan already returned' });

  db.prepare("UPDATE loans SET returned_at = date('now') WHERE id = ?").run(req.params.id);
  const updated = db.prepare('SELECT * FROM loans WHERE id = ?').get(req.params.id);
  res.json(updated);
});

module.exports = router;
