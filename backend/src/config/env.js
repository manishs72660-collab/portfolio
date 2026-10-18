const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const jwtSecret = process.env.JWT_SECRET;

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI is required in backend/.env');
}

if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be set to at least 32 characters in backend/.env');
}

module.exports.env = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  adminEmail: process.env.ADMIN_EMAIL,
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH,
  githubUsername: process.env.GITHUB_USERNAME || 'manishs72660-collab',
  leetcodeUsername: process.env.LEETCODE_USERNAME || 'manishsingh18',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  mail: {
    user: process.env.MAIL_USER,
    appPassword: process.env.MAIL_APP_PASSWORD,
    to: process.env.MAIL_TO || process.env.MAIL_USER,
  },
};
