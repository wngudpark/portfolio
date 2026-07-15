// Rejects requests that are not from a logged-in admin session.
function requireAuth(req, res, next) {
  if (req.session && req.session.isAdmin === true) {
    return next();
  }
  return res.status(401).json({ error: '인증이 필요합니다. 관리자로 로그인하세요.' });
}

module.exports = { requireAuth };
