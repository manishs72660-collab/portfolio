const express = require('express');
const { rateLimit } = require('express-rate-limit');
const { sendContactMessage } = require('../controllers/contactController');
const asyncHandler = require('../utils/asyncHandler');

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler(req, res) {
    res.status(429).json({
      success: false,
      message: 'Too many messages sent. Please try again later.',
    });
  },
});

const router = express.Router();

router.post('/', contactLimiter, asyncHandler(sendContactMessage));

module.exports = router;
