const express = require('express');
const rateLimit = require('express-rate-limit');
const { env } = require('../config/env');
const {
  askQuestion,
  chat,
  deleteConversation,
  getConversation,
} = require('../controllers/ragController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

const askLimiter = rateLimit({
  windowMs: env.rag.rateLimitWindowMs,
  limit: env.rag.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many questions. Please try again later.' },
});

router.post('/ask', askLimiter, asyncHandler(askQuestion));
router.post('/chat', askLimiter, asyncHandler(chat));
router.get('/conversations/:conversationId', asyncHandler(getConversation));
router.delete('/conversations/:conversationId', asyncHandler(deleteConversation));

module.exports = router;
