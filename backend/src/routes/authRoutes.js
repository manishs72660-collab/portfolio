const express = require('express');
const { login, getMe, logout } = require('../controllers/authController');
const requireAdmin = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', login);
router.get('/me', requireAdmin, getMe);
router.post('/logout', logout);

module.exports = router;
