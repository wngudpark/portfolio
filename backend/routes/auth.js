const express = require('express');
const bcrypt = require('bcryptjs');

const router = express.Router();

// POST /api/login  { password }
router.post('/login', (req, res) => {
  const { password } = req.body || {};

  if (!password) {
    return res.status(400).json({ error: '비밀번호를 입력하세요.' });
  }

  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) {
    return res.status(500).json({ error: '서버에 관리자 비밀번호가 설정되어 있지 않습니다.' });
  }

  const ok = bcrypt.compareSync(password, hash);
  if (!ok) {
    return res.status(401).json({ error: '비밀번호가 올바르지 않습니다.' });
  }

  req.session.isAdmin = true;
  return res.json({ success: true });
});

// POST /api/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('portfolio.sid');
    res.json({ success: true });
  });
});

// GET /api/me  — check current auth status (used by the admin UI)
router.get('/me', (req, res) => {
  res.json({ isAdmin: !!(req.session && req.session.isAdmin) });
});

module.exports = router;
