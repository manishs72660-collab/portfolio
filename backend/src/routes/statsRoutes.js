const express = require('express');
const { getCodingStats } = require('../controllers/statsController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(getCodingStats));

module.exports = router;
