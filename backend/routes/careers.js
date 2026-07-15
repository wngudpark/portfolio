const express = require('express');
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/careers — public. Latest first (most recent start date on top).
router.get('/', (req, res) => {
  const rows = db
    .prepare(
      `SELECT * FROM careers
       ORDER BY (start_date IS NULL), start_date DESC, id DESC`
    )
    .all();
  res.json(rows);
});

// GET /api/careers/:id — public
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM careers WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: '경력을 찾을 수 없습니다.' });
  res.json(row);
});

// POST /api/careers — auth required
router.post('/', requireAuth, (req, res) => {
  const { company, position, start_date, end_date, description } = req.body || {};

  if (!company || !String(company).trim()) {
    return res.status(400).json({ error: '회사명(company)은 필수입니다.' });
  }
  if (!position || !String(position).trim()) {
    return res.status(400).json({ error: '직무(position)는 필수입니다.' });
  }

  const info = db
    .prepare(
      `INSERT INTO careers (company, position, start_date, end_date, description)
       VALUES (@company, @position, @start_date, @end_date, @description)`
    )
    .run({
      company: String(company).trim(),
      position: String(position).trim(),
      start_date: start_date ? String(start_date).trim() : null,
      end_date: end_date ? String(end_date).trim() : null, // null = 재직중
      description: description ? String(description) : null
    });

  const row = db.prepare('SELECT * FROM careers WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(row);
});

// PUT /api/careers/:id — auth required
router.put('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM careers WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: '경력을 찾을 수 없습니다.' });

  const { company, position, start_date, end_date, description } = req.body || {};

  if (company !== undefined && !String(company).trim()) {
    return res.status(400).json({ error: '회사명(company)은 비어 있을 수 없습니다.' });
  }
  if (position !== undefined && !String(position).trim()) {
    return res.status(400).json({ error: '직무(position)는 비어 있을 수 없습니다.' });
  }

  db.prepare(
    `UPDATE careers
     SET company = @company, position = @position, start_date = @start_date,
         end_date = @end_date, description = @description
     WHERE id = @id`
  ).run({
    id: req.params.id,
    company: company !== undefined ? String(company).trim() : existing.company,
    position: position !== undefined ? String(position).trim() : existing.position,
    start_date:
      start_date !== undefined ? (start_date ? String(start_date).trim() : null) : existing.start_date,
    end_date:
      end_date !== undefined ? (end_date ? String(end_date).trim() : null) : existing.end_date,
    description:
      description !== undefined ? (description ? String(description) : null) : existing.description
  });

  const row = db.prepare('SELECT * FROM careers WHERE id = ?').get(req.params.id);
  res.json(row);
});

// DELETE /api/careers/:id — auth required
router.delete('/:id', requireAuth, (req, res) => {
  const info = db.prepare('DELETE FROM careers WHERE id = ?').run(req.params.id);
  if (info.changes === 0) {
    return res.status(404).json({ error: '경력을 찾을 수 없습니다.' });
  }
  res.json({ success: true });
});

module.exports = router;
