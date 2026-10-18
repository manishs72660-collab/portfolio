const Project = require('../models/Project');
const AppError = require('../utils/AppError');
const { saveRecordWithImage, deleteOldImage } = require('../utils/imageRecord');
const {
  rejectUnknownFields,
  requireFields,
  parseString,
  parseBoolean,
  parseArray,
  parseUrl,
  parseId,
  parseSlug,
  makeSlug,
  parsePagination,
  parseQueryString,
  escapeRegex,
} = require('../utils/validation');

const writableFields = [
  'title',
  'slug',
  'description',
  'technologies',
  'category',
  'isFeatured',
  'liveUrl',
  'liveDemoUrl',
  'repositoryUrl',
  'githubUrl',
  'isPublished',
];

function getBody(req) {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    throw new AppError('A JSON or multipart request body is required', 400);
  }
  rejectUnknownFields(req.body, writableFields);
  return req.body;
}

function projectFilter(query, publishedOnly) {
  const filter = publishedOnly ? { isPublished: true } : {};
  const category = parseQueryString(query.category, 'category');
  if (category) filter.category = new RegExp(`^${escapeRegex(category)}$`, 'i');
  return filter;
}

async function getProjects(req, res) {
  const { page, limit, skip } = parsePagination(req.query, ['category']);
  const filter = projectFilter(req.query, true);
  const [projects, total] = await Promise.all([
    Project.find(filter).sort({ isFeatured: -1, createdAt: -1 }).skip(skip).limit(limit),
    Project.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: projects,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

async function getAdminProjects(req, res) {
  const { page, limit, skip } = parsePagination(req.query, ['category', 'isPublished']);
  const filter = projectFilter(req.query, false);
  if (req.query.isPublished !== undefined) {
    if (typeof req.query.isPublished !== 'string' || (req.query.isPublished !== 'true' && req.query.isPublished !== 'false')) {
      throw new AppError('isPublished must be true or false', 400);
    }
    filter.isPublished = req.query.isPublished === 'true';
  }

  const [projects, total] = await Promise.all([
    Project.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Project.countDocuments(filter),
  ]);
  res.json({ success: true, data: projects, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

async function getProjectByIdentifier(req, res) {
  const { identifier } = req.params;
  const filter = { isPublished: true };
  if (/^[a-f\d]{24}$/i.test(identifier)) {
    const projectId = parseId(identifier, 'project ID');
    filter.$or = [{ slug: identifier.toLowerCase() }, { _id: projectId }];
  } else {
    filter.slug = parseSlug(identifier);
  }
  const project = await Project.findOne(filter);
  if (!project) throw new AppError('Project not found', 404);
  res.json({ success: true, data: project });
}

async function getAdminProjectById(req, res) {
  const project = await Project.findById(parseId(req.params.id, 'project ID'));
  if (!project) throw new AppError('Project not found', 404);
  res.json({ success: true, data: project });
}

function applyProjectFields(project, body, { creating = false } = {}) {
  if (creating) requireFields(body, ['title', 'description', 'category']);
  for (const field of ['title', 'description', 'category']) {
    if (body[field] !== undefined) project[field] = parseString(body[field], field, { required: true });
  }
  if (body.slug !== undefined) {
    project.slug = parseSlug(body.slug);
  } else if (body.title !== undefined) {
    project.slug = makeSlug(body.title);
    if (!project.slug) throw new AppError('Title must contain letters or numbers to generate a slug', 400);
  } else if (creating) {
    project.slug = makeSlug(body.title);
  }
  if (body.technologies !== undefined) project.technologies = parseArray(body.technologies, 'technologies');
  if (body.isFeatured !== undefined) project.isFeatured = parseBoolean(body.isFeatured, 'isFeatured');
  if (body.isPublished !== undefined) project.isPublished = parseBoolean(body.isPublished, 'isPublished');
  if (body.liveUrl !== undefined && body.liveDemoUrl !== undefined) {
    throw new AppError('Provide only liveDemoUrl or liveUrl', 400);
  }
  if (body.repositoryUrl !== undefined && body.githubUrl !== undefined) {
    throw new AppError('Provide only githubUrl or repositoryUrl', 400);
  }
  const liveDemoUrl = body.liveDemoUrl ?? body.liveUrl;
  const githubUrl = body.githubUrl ?? body.repositoryUrl;
  if (liveDemoUrl !== undefined) project.liveUrl = parseUrl(liveDemoUrl, 'liveDemoUrl');
  if (githubUrl !== undefined) project.repositoryUrl = parseUrl(githubUrl, 'githubUrl');
}

async function createProject(req, res) {
  const body = getBody(req);
  const project = new Project();
  applyProjectFields(project, body, { creating: true });
  await saveRecordWithImage(project, req.file, 'portfolio/projects', 'imageUrl', 'imagePublicId');
  res.status(201).json({ success: true, data: project });
}

async function updateProject(req, res) {
  const body = getBody(req);
  if (!Object.keys(body).length && !req.file) throw new AppError('Provide at least one field or image to update', 400);
  const project = await Project.findById(parseId(req.params.id, 'project ID'));
  if (!project) throw new AppError('Project not found', 404);
  const originalImagePublicId = project.imagePublicId;
  applyProjectFields(project, body);
  await saveRecordWithImage(
    project,
    req.file,
    'portfolio/projects',
    'imageUrl',
    'imagePublicId',
    originalImagePublicId,
  );
  res.json({ success: true, data: project });
}

async function deleteProject(req, res) {
  const project = await Project.findById(parseId(req.params.id, 'project ID'));
  if (!project) throw new AppError('Project not found', 404);
  await project.deleteOne();
  await deleteOldImage(project.imagePublicId);
  res.json({ success: true, message: 'Project deleted successfully' });
}

module.exports = {
  getProjects,
  getAdminProjects,
  getProjectByIdentifier,
  getAdminProjectById,
  createProject,
  updateProject,
  deleteProject,
};
