const cloudinary = require('../config/cloudinary');
const { env } = require('../config/env');
const AppError = require('./AppError');

function uploadImage(buffer, folder = 'portfolio') {
  const { cloudName, apiKey, apiSecret } = env.cloudinary;

  if (!cloudName || !apiKey || !apiSecret) {
    return Promise.reject(new AppError('Cloudinary credentials are not configured', 503));
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error) {
        return reject(error);
      }

      if (!result) {
        return reject(new Error('Cloudinary did not return an upload result'));
      }

      resolve({
        url: result.secure_url,
        publicId: result.public_id,
      });
    });

    stream.end(buffer);
  });
}

async function deleteImage(publicId) {
  if (!publicId) {
    return;
  }

  const result = await cloudinary.uploader.destroy(publicId);

  if (result.result !== 'ok' && result.result !== 'not found') {
    throw new Error(`Cloudinary could not delete image "${publicId}"`);
  }
}

module.exports = { uploadImage, deleteImage };
