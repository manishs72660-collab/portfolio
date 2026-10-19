const BlogPost = require('../models/BlogPost');
const AppError = require('../utils/AppError');
const { saveRecordWithImage, deleteOldImage } = require('../utils/imageRecord');
const { syncBlogToRag, removeRagSource } = require('../services/ragService');
const {
  rejectUnknownFields,
  requireFields,
  parseString,
  parseBoolean,
  parseArray,
  parseDate,
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
  'excerpt',
  'content',
  'tags',
  'categories',
  'seoTitle',
  'metaDescription',
  'isPublished',
  'publishedAt',
];

function getBody(req) {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    throw new AppError('A JSON or multipart request body is required', 400);
  }
  rejectUnknownFields(req.body, writableFields);
  return req.body;
}

function calculateReadingTime(content) {
  const plainText = content.replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/gi, ' ');
  const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

function blogFilter(query, publishedOnly) {
  const filter = publishedOnly
    ? { isPublished: true, $or: [{ publishedAt: null }, { publishedAt: { $lte: new Date() } }] }
    : {};
  const category = parseQueryString(query.category, 'category');
  const tag = parseQueryString(query.tag, 'tag');
  const searchTerm = parseQueryString(query.search, 'search', { maxLength: 200 });
  if (category) filter.categories = new RegExp(`^${escapeRegex(category)}$`, 'i');
  if (tag) filter.tags = new RegExp(`^${escapeRegex(tag)}$`, 'i');
  if (searchTerm) {
    const search = new RegExp(escapeRegex(searchTerm), 'i');
    filter.$and = (filter.$and || []).concat([{ $or: [{ title: search }, { excerpt: search }, { content: search }] }]);
  }
  return filter;
}

async function sendList(req, res, publishedOnly) {
  const { page, limit, skip } = parsePagination(req.query, ['category', 'tag', 'search', 'isPublished']);
  const filter = blogFilter(req.query, publishedOnly);
  if (!publishedOnly && req.query.isPublished !== undefined) {
    if (typeof req.query.isPublished !== 'string' || (req.query.isPublished !== 'true' && req.query.isPublished !== 'false')) {
      throw new AppError('isPublished must be true or false', 400);
    }
    filter.isPublished = req.query.isPublished === 'true';
  }

  const [posts, total] = await Promise.all([
    BlogPost.find(filter).sort({ publishedAt: -1, createdAt: -1 }).skip(skip).limit(limit),
    BlogPost.countDocuments(filter),
  ]);
  res.json({ success: true, data: posts, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

async function getBlogPosts(req, res) {
  await sendList(req, res, true);
}

async function getAdminBlogPosts(req, res) {
  await sendList(req, res, false);
}

async function getPublicBlogPost(req, res) {
  const slug = parseSlug(req.params.slug);
  const post = await BlogPost.findOne({
    slug,
    isPublished: true,
    $or: [{ publishedAt: null }, { publishedAt: { $lte: new Date() } }],
  });
  if (!post) throw new AppError('Blog post not found', 404);
  res.json({ success: true, data: post });
}

async function getAdminBlogPost(req, res) {
  const post = await BlogPost.findById(parseId(req.params.id, 'blog post ID'));
  if (!post) throw new AppError('Blog post not found', 404);
  res.json({ success: true, data: post });
}

function applyBlogFields(post, body, admin, { creating = false } = {}) {
  if (creating) requireFields(body, ['title', 'content']);
  for (const field of ['title', 'excerpt', 'content', 'seoTitle', 'metaDescription']) {
    if (body[field] !== undefined) {
      post[field] = parseString(body[field], field, {
        required: field === 'title' || field === 'content',
        maxLength: field === 'content' ? 200000 : 10000,
      });
    }
  }

  if (body.slug !== undefined) {
    post.slug = parseSlug(body.slug);
  } else if (body.title !== undefined) {
    post.slug = makeSlug(body.title);
    if (!post.slug) throw new AppError('Title must contain letters or numbers to generate a slug', 400);
  }
  if (body.tags !== undefined) post.tags = parseArray(body.tags, 'tags');
  if (body.categories !== undefined) post.categories = parseArray(body.categories, 'categories');
  if (body.isPublished !== undefined) post.isPublished = parseBoolean(body.isPublished, 'isPublished');
  if (body.publishedAt !== undefined) post.publishedAt = parseDate(body.publishedAt, 'publishedAt', { nullable: true });
  if (creating) post.author = { id: admin.sub, email: admin.email };
  if (!post.author?.id || !post.author?.email) {
    post.author = { id: admin.sub, email: admin.email };
  }
  if (post.isPublished && !post.publishedAt) post.publishedAt = new Date();
  post.readingTime = calculateReadingTime(post.content || '');
}

async function createBlogPost(req, res) {
  const body = getBody(req);
  const post = new BlogPost();
  applyBlogFields(post, body, req.admin, { creating: true });
  await saveRecordWithImage(post, req.file, 'portfolio/blog', 'coverImageUrl', 'coverImagePublicId');
  await syncBlogToRag(post);
  res.status(201).json({ success: true, data: post });
}

async function updateBlogPost(req, res) {
  const body = getBody(req);
  if (!Object.keys(body).length && !req.file) throw new AppError('Provide at least one field or image to update', 400);
  const post = await BlogPost.findById(parseId(req.params.id, 'blog post ID'));
  if (!post) throw new AppError('Blog post not found', 404);
  const originalCoverImagePublicId = post.coverImagePublicId;
  applyBlogFields(post, body, req.admin);
  await saveRecordWithImage(
    post,
    req.file,
    'portfolio/blog',
    'coverImageUrl',
    'coverImagePublicId',
    originalCoverImagePublicId,
  );
  await syncBlogToRag(post);
  res.json({ success: true, data: post });
}

async function deleteBlogPost(req, res) {
  const post = await BlogPost.findById(parseId(req.params.id, 'blog post ID'));
  if (!post) throw new AppError('Blog post not found', 404);
  await post.deleteOne();
  await removeRagSource(`blog:${post.id}`);
  await deleteOldImage(post.coverImagePublicId);
  res.json({ success: true, message: 'Blog post deleted successfully' });
}

module.exports = {
  getBlogPosts,
  getAdminBlogPosts,
  getPublicBlogPost,
  getAdminBlogPost,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
};
