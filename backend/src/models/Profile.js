const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    headline: { type: String, default: '', trim: true },
    bio: { type: String, default: '' },
    email: { type: String, default: '', trim: true, lowercase: true },
    location: { type: String, default: '', trim: true },
    imageUrl: { type: String, default: '' },
    socialLinks: {
      type: Map,
      of: String,
      default: {},
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Profile', profileSchema);
