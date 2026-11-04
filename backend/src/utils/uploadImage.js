const cloudinary = require('../config/cloudinary');
const { env } = require('../config/env');
const AppError = require('./AppError');

function uploadImage(buffer, folder = 'portfolio') {
  return uploadMedia(buffer, folder, 'image');
}

function uploadVideo(buffer, folder = 'portfolio') {
  return uploadMedia(buffer, folder, 'video');
}

function uploadMedia(buffer, folder, resourceType) {
  const { cloudName, apiKey, apiSecret } = env.cloudinary;

  if (!cloudName || !apiKey || !apiSecret) {
    return Promise.reject(new AppError('Cloudinary credentials are not configured', 503));
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: resourceType }, (error, result) => {
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

async function deleteMedia(publicId, resourceType = 'image') {
  if (!publicId) {
    return;
  }

  const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });

  if (result.result !== 'ok' && result.result !== 'not found') {
    throw new Error(`Cloudinary could not delete ${resourceType} "${publicId}"`);
  }
}

module.exports = {
  uploadImage,
  uploadVideo,
  deleteImage: publicId => deleteMedia(publicId, 'image'),
  deleteVideo: publicId => deleteMedia(publicId, 'video'),
};
