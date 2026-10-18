const multer = require('multer');
const AppError = require('../utils/AppError');

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, callback) {
    if (!file.mimetype.startsWith('image/')) {
      return callback(new AppError('Only image files are allowed', 400));
    }

    callback(null, true);
  },
});

function validateImage(req, res, next) {
  if (!req.file) return next();

  const buffer = req.file.buffer;
  const isPng = buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isGif = buffer.toString('ascii', 0, 3) === 'GIF';
  const isWebp = buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';

  if (!isPng && !isJpeg && !isGif && !isWebp) {
    return next(new AppError('Image must be a valid PNG, JPEG, GIF, or WebP file', 400));
  }

  next();
}

module.exports = { imageUpload, validateImage };
