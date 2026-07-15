const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const { uploadThumbnail, UPLOAD_DIR } = require('../middleware/upload');

const router = express.Router();

// Normalize a stored row into an API-friendly shape (stack -> array).
function serialize(row) {
  let stack = [];
  try {
    stack = row.stack ? JSON.parse(row.stack) : [];
    if (!Array.isArray(stack)) stack = [];
  } catch {
    // Fallback: treat as comma-separated string.
    stack = String(row.stack || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return { ...row, stack };
}

// Accept an array or comma-separated string, always store JSON array text.
function normalizeStack(stack) {
  let arr = [];
  if (Array.isArray(stack)) {
    arr = stack;
  } else if (typeof stack === 'string') {
    arr = stack.split(',');
  }
  arr = arr.map((s) => String(s).trim()).filter(Boolean);
  return JSON.stringify(arr);
}

// Delete an uploaded file given its stored relative path (e.g. /uploads/xxx.png).
function deleteThumbnailFile(thumbnailUrl) {
  if (!thumbnailUrl) return;
  const filename = path.basename(thumbnailUrl);
  const filePath = path.join(UPLOAD_DIR, filename);
  fs.promises.unlink(filePath).catch(() => {
    /* file already gone — ignore */
  });
}

// Runs multer, translating its errors into JSON responses.
// Placed AFTER requireAuth so only authenticated admins can upload files.
function handleUpload(req, res, next) {
  uploadThumbnail(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: '이미지 용량은 2MB를 초과할 수 없습니다.' });
      }
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}

// GET /api/projects — public. Omits detail_content to keep the list lightweight.
router.get('/', (req, res) => {
  const rows = db
    .prepare(
      `SELECT id, title, year, description, stack, link, thumbnail_url, created_at
       FROM projects ORDER BY year DESC, id DESC`
    )
    .all();
  res.json(rows.map(serialize));
});

// GET /api/projects/:id — public. Includes detail_content for the detail page.
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다.' });
  res.json(serialize(row));
});

// POST /api/projects — auth required, optional multipart thumbnail
router.post('/', requireAuth, handleUpload, (req, res) => {
  const { title, year, description, stack, link, detail_content } = req.body || {};

  if (!title || !String(title).trim()) {
    // Clean up an orphaned upload before rejecting.
    if (req.file) deleteThumbnailFile(`/uploads/${req.file.filename}`);
    return res.status(400).json({ error: '제목(title)은 필수입니다.' });
  }

  const thumbnailUrl = req.file ? `/uploads/${req.file.filename}` : null;

  const info = db
    .prepare(
      `INSERT INTO projects (title, year, description, stack, link, thumbnail_url, detail_content)
       VALUES (@title, @year, @description, @stack, @link, @thumbnail_url, @detail_content)`
    )
    .run({
      title: String(title).trim(),
      year: year ? String(year).trim() : null,
      description: description ? String(description) : null,
      stack: normalizeStack(stack),
      link: link ? String(link).trim() : null,
      thumbnail_url: thumbnailUrl,
      detail_content: detail_content ? String(detail_content) : null
    });

  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(serialize(row));
});

// PUT /api/projects/:id — auth required, optional multipart thumbnail
router.put('/:id', requireAuth, handleUpload, (req, res) => {
  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!existing) {
    if (req.file) deleteThumbnailFile(`/uploads/${req.file.filename}`);
    return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다.' });
  }

  const { title, year, description, stack, link, detail_content } = req.body || {};

  if (title !== undefined && !String(title).trim()) {
    if (req.file) deleteThumbnailFile(`/uploads/${req.file.filename}`);
    return res.status(400).json({ error: '제목(title)은 비어 있을 수 없습니다.' });
  }

  // A new upload replaces the old file; otherwise keep the existing thumbnail.
  let thumbnailUrl = existing.thumbnail_url;
  if (req.file) {
    thumbnailUrl = `/uploads/${req.file.filename}`;
    deleteThumbnailFile(existing.thumbnail_url);
  }

  db.prepare(
    `UPDATE projects
     SET title = @title, year = @year, description = @description,
         stack = @stack, link = @link, thumbnail_url = @thumbnail_url,
         detail_content = @detail_content
     WHERE id = @id`
  ).run({
    id: req.params.id,
    title: title !== undefined ? String(title).trim() : existing.title,
    year: year !== undefined ? (year ? String(year).trim() : null) : existing.year,
    description:
      description !== undefined ? (description ? String(description) : null) : existing.description,
    stack: stack !== undefined ? normalizeStack(stack) : existing.stack,
    link: link !== undefined ? (link ? String(link).trim() : null) : existing.link,
    thumbnail_url: thumbnailUrl,
    detail_content:
      detail_content !== undefined
        ? (detail_content ? String(detail_content) : null)
        : existing.detail_content
  });

  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  res.json(serialize(row));
});

// DELETE /api/projects/:id — auth required
router.delete('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다.' });
  }

  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  deleteThumbnailFile(existing.thumbnail_url); // remove linked image file
  res.json({ success: true });
});

module.exports = router;
