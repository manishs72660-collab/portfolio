const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    excerpt: { type: String, default: '', trim: true },
    content: { type: String, required: true },
    coverImageUrl: { type: String, default: '' },
    coverImagePublicId: { type: String, default: '' },
    tags: [{ type: String, trim: true, lowercase: true }],
    categories: [{ type: String, trim: true, lowercase: true }],
    seoTitle: { type: String, default: '', trim: true },
    metaDescription: { type: String, default: '', trim: true },
    readingTime: { type: Number, required: true, min: 1 },
    author: {
      id: { type: String, required: true },
      email: { type: String, required: true, lowercase: true, trim: true },
    },
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

blogPostSchema.index({ isPublished: 1, publishedAt: -1 });
blogPostSchema.index({ categories: 1, isPublished: 1 });
blogPostSchema.index({ tags: 1, isPublished: 1 });

module.exports = mongoose.model('BlogPost', blogPostSchema);
