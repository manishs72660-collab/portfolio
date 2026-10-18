const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const AppError = require('../utils/AppError');

function requireAdmin(req, res, next) {
  const token = req.cookies.adminToken;

  if (!token) {
    return next(new AppError('Authentication required', 401));
  }

  try {
    req.admin = jwt.verify(token, env.jwtSecret);
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = requireAdmin;
