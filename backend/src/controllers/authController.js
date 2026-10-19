const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const AppError = require('../utils/AppError');

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
  path: '/',
};

async function login(req, res, next) {
  const { email, password } = req.body || {};

  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return next(new AppError('A valid email and password are required', 400));
  }

  if (
    !env.adminEmail ||
    !env.adminPasswordHash ||
    !/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(env.adminPasswordHash)
  ) {
    return next(new AppError('Admin login is not configured', 503));
  }

  const emailMatches = email.trim().toLowerCase() === env.adminEmail.trim().toLowerCase();
  const passwordMatches = await bcrypt.compare(password, env.adminPasswordHash);

  if (!emailMatches || !passwordMatches) {
    return next(new AppError('Invalid email or password', 401));
  }

  const token = jwt.sign(
    { role: 'admin', email: env.adminEmail },
    env.jwtSecret,
    { subject: 'admin', expiresIn: env.jwtExpiresIn },
  );

  res.cookie('adminToken', token, {
    ...cookieOptions,
  });
  res.json({ success: true, message: 'Logged in successfully' });
}

function getMe(req, res) {
  res.json({
    success: true,
    data: { email: req.admin.email, role: req.admin.role },
  });
}

function logout(req, res) {
  res.clearCookie('adminToken', cookieOptions);
  res.json({ success: true, message: 'Logged out successfully' });
}

module.exports = { login, getMe, logout };
