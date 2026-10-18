const express = require('express');
const {
  getProjects,
  getAdminProjects,
  getProjectByIdentifier,
  getAdminProjectById,
  createProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');
const requireAdmin = require('../middleware/authMiddleware');
const { imageUpload, validateImage } = require('../middleware/uploadMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(getProjects));
router.get('/admin', requireAdmin, asyncHandler(getAdminProjects));
router.get('/admin/:id', requireAdmin, asyncHandler(getAdminProjectById));
router.get('/:identifier', asyncHandler(getProjectByIdentifier));
router.post('/', requireAdmin, imageUpload.single('thumbnail'), validateImage, asyncHandler(createProject));
router.patch('/:id', requireAdmin, imageUpload.single('thumbnail'), validateImage, asyncHandler(updateProject));
router.delete('/:id', requireAdmin, asyncHandler(deleteProject));

module.exports = router;
