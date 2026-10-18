const mongoose = require('mongoose');
const { makeSlug } = require('../utils/validation');

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, trim: true, lowercase: true },
    description: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: '' },
    imagePublicId: { type: String, default: '' },
    technologies: [{ type: String, trim: true }],
    category: { type: String, default: 'Other', trim: true },
    isFeatured: { type: Boolean, default: false },
    liveUrl: { type: String, default: '' },
    repositoryUrl: { type: String, default: '' },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true },
);

projectSchema.pre('validate', function generateLegacySlug() {
  if (!this.slug && this.title) this.slug = makeSlug(this.title);
});

projectSchema.index({ isPublished: 1, createdAt: -1 });
projectSchema.index({ category: 1, isPublished: 1 });

module.exports = mongoose.model('Project', projectSchema);
