const cloudinary = require('cloudinary').v2;
const { env } = require('./env');

const { cloudName, apiKey, apiSecret } = env.cloudinary;

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
} else {
  console.warn('Cloudinary is not configured; image uploads are disabled');
}

module.exports = cloudinary;
