// Multer configuration for project thumbnail uploads.
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');

// Ensure the uploads directory exists.
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // Unique name: timestamp + random uuid, keep original extension.
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${crypto.randomUUID()}${ext}`;
    cb(null, name);
  }
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXT.includes(ext) && ALLOWED_MIME.includes(file.mimetype)) {
    return cb(null, true);
  }
  cb(new Error('허용되지 않는 이미지 형식입니다. (jpg, jpeg, png, webp만 가능)'));
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

// Single optional thumbnail field named "thumbnail".
const uploadThumbnail = upload.single('thumbnail');

module.exports = { uploadThumbnail, UPLOAD_DIR };
