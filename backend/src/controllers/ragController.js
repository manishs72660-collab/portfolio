const { randomUUID } = require('node:crypto');
const { env } = require('../config/env');
const AppError = require('../utils/AppError');
const ChatConversation = require('../models/ChatConversation');
const { answerFromPortfolio, summarizeConversation } = require('../services/ragService');

const conversationIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseConversationId(value) {
  if (typeof value !== 'string' || !conversationIdPattern.test(value)) {
    throw new AppError('A valid conversationId is required', 400);
  }
  return value;
}

async function askQuestion(req, res) {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    throw new AppError('A JSON request body is required', 400);
  }

  const { question } = req.body;
  if (typeof question !== 'string' || !question.trim()) {
    throw new AppError('question must be a non-empty string', 400);
  }
  if (question.trim().length > 1000) {
    throw new AppError('question must be 1000 characters or fewer', 400);
  }

  const data = await answerFromPortfolio(question.trim());
  res.json({ success: true, data });
}

async function getConversation(req, res) {
  const conversationId = parseConversationId(req.params.conversationId);
  const conversation = await ChatConversation.findOne({ conversationId }).lean();
  if (!conversation) throw new AppError('Conversation not found or expired', 404);

  res.json({
    success: true,
    data: {
      conversationId,
      messages: conversation.messages.map(({ role, content, sources, createdAt }) => ({
        role,
        content,
        sources,
        createdAt,
      })),
      updatedAt: conversation.updatedAt,
    },
  });
}

async function chat(req, res) {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    throw new AppError('A JSON request body is required', 400);
  }

  const { question } = req.body;
  if (typeof question !== 'string' || !question.trim()) {
    throw new AppError('question must be a non-empty string', 400);
  }
  if (question.trim().length > 1000) {
    throw new AppError('question must be 1000 characters or fewer', 400);
  }

  const conversationId = req.body.conversationId === undefined
    ? randomUUID()
    : parseConversationId(req.body.conversationId);
  const conversation = await ChatConversation.findOneAndUpdate(
    { conversationId },
    { $setOnInsert: { conversationId, messages: [] } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );
  const history = conversation.messages.map(({ role, content }) => ({ role, content }));
  const summarizedMessages = conversation.summarizedMessages;
  const answer = await answerFromPortfolio(question.trim(), {
    history: history.slice(summarizedMessages),
    summary: conversation.memorySummary,
  });

  conversation.messages.push(
    { role: 'user', content: question.trim() },
    { role: 'assistant', content: answer.answer, sources: answer.sources },
  );
  const unsummarizedCount = conversation.messages.length - summarizedMessages;
  if (unsummarizedCount >= 24) {
    const messagesToSummarize = conversation.messages
      .slice(summarizedMessages, summarizedMessages + 12)
      .map(({ role, content }) => ({ role, content }));
    conversation.memorySummary = await summarizeConversation(conversation.memorySummary, messagesToSummarize);
    conversation.summarizedMessages += messagesToSummarize.length;
  }
  conversation.expiresAt = new Date(Date.now() + env.rag.conversationTtlDays * 24 * 60 * 60 * 1000);
  await conversation.save();

  res.json({
    success: true,
    data: {
      conversationId,
      answer: answer.answer,
      sources: answer.sources,
      createdAt: conversation.messages[conversation.messages.length - 1].createdAt,
    },
  });
}

async function streamChat(req, res) {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    throw new AppError('A JSON request body is required', 400);
  }

  const { question } = req.body;
  if (typeof question !== 'string' || !question.trim()) {
    throw new AppError('question must be a non-empty string', 400);
  }
  if (question.trim().length > 1000) {
    throw new AppError('question must be 1000 characters or fewer', 400);
  }

  const conversationId = req.body.conversationId === undefined
    ? randomUUID()
    : parseConversationId(req.body.conversationId);
  const conversation = await ChatConversation.findOneAndUpdate(
    { conversationId },
    { $setOnInsert: { conversationId, messages: [] } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );
  const history = conversation.messages.map(({ role, content }) => ({ role, content }));
  const summarizedMessages = conversation.summarizedMessages;

  res.status(200);
  res.set({
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();

  const sendEvent = (event) => {
    if (!res.destroyed) res.write(`data: ${JSON.stringify(event)}\n\n`);
  };
  sendEvent({ type: 'start', conversationId });

  try {
    const answer = await answerFromPortfolio(question.trim(), {
      history: history.slice(summarizedMessages),
      summary: conversation.memorySummary,
      onToken: (token) => sendEvent({ type: 'token', token }),
    });

    conversation.messages.push(
      { role: 'user', content: question.trim() },
      { role: 'assistant', content: answer.answer, sources: answer.sources },
    );
    const unsummarizedCount = conversation.messages.length - summarizedMessages;
    if (unsummarizedCount >= 24) {
      const messagesToSummarize = conversation.messages
        .slice(summarizedMessages, summarizedMessages + 12)
        .map(({ role, content }) => ({ role, content }));
      conversation.memorySummary = await summarizeConversation(conversation.memorySummary, messagesToSummarize);
      conversation.summarizedMessages += messagesToSummarize.length;
    }
    conversation.expiresAt = new Date(Date.now() + env.rag.conversationTtlDays * 24 * 60 * 60 * 1000);
    await conversation.save();

    sendEvent({
      type: 'complete',
      sources: answer.sources,
      createdAt: conversation.messages[conversation.messages.length - 1].createdAt,
    });
  } catch (error) {
    console.error('RAG chat stream failed:', error);
    sendEvent({ type: 'error', message: 'Unable to complete the answer. Please try again.' });
  } finally {
    if (!res.destroyed) res.end();
  }
}

async function deleteConversation(req, res) {
  const conversationId = parseConversationId(req.params.conversationId);
  await ChatConversation.deleteOne({ conversationId });
  res.json({ success: true, message: 'Conversation memory cleared' });
}

module.exports = { askQuestion, chat, streamChat, deleteConversation, getConversation };
