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
const { projectUpload, validateProjectMedia } = require('../middleware/uploadMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(getProjects));
router.get('/admin', requireAdmin, asyncHandler(getAdminProjects));
router.get('/admin/:id', requireAdmin, asyncHandler(getAdminProjectById));
router.get('/:identifier', asyncHandler(getProjectByIdentifier));
router.post('/', requireAdmin, projectUpload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'demoVideo', maxCount: 1 }]), validateProjectMedia, asyncHandler(createProject));
router.patch('/:id', requireAdmin, projectUpload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'demoVideo', maxCount: 1 }]), validateProjectMedia, asyncHandler(updateProject));
router.delete('/:id', requireAdmin, asyncHandler(deleteProject));

module.exports = router;
