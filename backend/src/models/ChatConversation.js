const mongoose = require('mongoose');
const { env } = require('../config/env');

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true, maxlength: 10000 },
  },
  { timestamps: true, _id: false },
);

const sourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: { type: String, required: true },
    url: { type: String, required: true },
    score: { type: Number, required: true },
  },
  { _id: false },
);

messageSchema.add({
  sources: { type: [sourceSchema], default: [] },
});

const chatConversationSchema = new mongoose.Schema(
  {
    conversationId: { type: String, required: true, unique: true },
    messages: { type: [messageSchema], default: [] },
    memorySummary: { type: String, default: '', maxlength: 1200 },
    summarizedMessages: { type: Number, default: 0, min: 0 },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + env.rag.conversationTtlDays * 24 * 60 * 60 * 1000),
      expires: 0,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('ChatConversation', chatConversationSchema);
