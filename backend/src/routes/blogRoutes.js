const express = require('express');
const {
  getBlogPosts,
  getAdminBlogPosts,
  getPublicBlogPost,
  getAdminBlogPost,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
} = require('../controllers/blogController');
const requireAdmin = require('../middleware/authMiddleware');
const { imageUpload, validateImage } = require('../middleware/uploadMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(getBlogPosts));
router.get('/admin', requireAdmin, asyncHandler(getAdminBlogPosts));
router.get('/admin/:id', requireAdmin, asyncHandler(getAdminBlogPost));
router.get('/:slug', asyncHandler(getPublicBlogPost));
router.post('/', requireAdmin, imageUpload.single('coverImage'), validateImage, asyncHandler(createBlogPost));
router.patch('/:id', requireAdmin, imageUpload.single('coverImage'), validateImage, asyncHandler(updateBlogPost));
router.delete('/:id', requireAdmin, asyncHandler(deleteBlogPost));

module.exports = router;
