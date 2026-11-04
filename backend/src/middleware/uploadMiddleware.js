const multer = require('multer');
const AppError = require('../utils/AppError');

const MAX_PROJECT_MEDIA_SIZE = 100 * 1024 * 1024;

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

const projectUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PROJECT_MEDIA_SIZE, files: 2 },
  fileFilter(req, file, callback) {
    if (file.fieldname === 'thumbnail' && !file.mimetype.startsWith('image/')) {
      return callback(new AppError('Project thumbnail must be an image', 400));
    }
    if (file.fieldname === 'demoVideo' && !['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'].includes(file.mimetype)) {
      return callback(new AppError('Demo video must be an MP4, WebM, MOV, or M4V file', 400));
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

function validateProjectMedia(req, res, next) {
  const thumbnail = req.files?.thumbnail?.[0];
  const demoVideo = req.files?.demoVideo?.[0];

  if (thumbnail && thumbnail.size > 5 * 1024 * 1024) {
    return next(new AppError('Project thumbnail must be 5 MB or smaller', 413));
  }
  if (demoVideo && demoVideo.size > MAX_PROJECT_MEDIA_SIZE) {
    return next(new AppError('Demo video must be 100 MB or smaller', 413));
  }
  if (thumbnail) {
    const buffer = thumbnail.buffer;
    const isPng = buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isGif = buffer.toString('ascii', 0, 3) === 'GIF';
    const isWebp = buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';

    if (!isPng && !isJpeg && !isGif && !isWebp) {
      return next(new AppError('Thumbnail must be a valid PNG, JPEG, GIF, or WebP file', 400));
    }
  }
  if (demoVideo && demoVideo.size === 0) {
    return next(new AppError('Demo video cannot be empty', 400));
  }

  next();
}

module.exports = { imageUpload, projectUpload, validateImage, validateProjectMedia };
