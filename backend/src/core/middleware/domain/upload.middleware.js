const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { FileError } = require('@errors');
const { FILE_LIMITS, ALLOWED_MIME_TYPES } = require('@constants');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `cv-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const allowedTypes = ALLOWED_MIME_TYPES.join(', ');
    cb(new FileError(`File type not allowed. Supported types: ${allowedTypes}`), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: FILE_LIMITS.MAX_FILE_SIZE,
  },
  fileFilter,
});

module.exports = upload;

