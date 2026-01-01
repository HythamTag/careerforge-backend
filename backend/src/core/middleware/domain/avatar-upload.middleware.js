const multer = require('multer');
const { FileError } = require('@errors');

/**
 * Avatar Upload Middleware
 * 
 * Multer configuration specifically for avatar image uploads.
 * Supports JPEG, PNG, and GIF formats with a 5MB size limit.
 */

const AVATAR_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const AVATAR_MAX_SIZE = 5 * 1024 * 1024; // 5MB

const avatarStorage = multer.memoryStorage();

const avatarFileFilter = (req, file, cb) => {
    if (AVATAR_ALLOWED_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new FileError(`Invalid file type. Only JPEG, PNG, and GIF images are allowed.`), false);
    }
};

const avatarUpload = multer({
    storage: avatarStorage,
    limits: {
        fileSize: AVATAR_MAX_SIZE,
    },
    fileFilter: avatarFileFilter,
});

module.exports = avatarUpload;
